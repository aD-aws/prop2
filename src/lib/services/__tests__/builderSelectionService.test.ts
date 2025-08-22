import { BuilderSelectionService, MeetingFeedback } from '../builderSelectionService';
import { Quote, BuilderProfile } from '@/lib/types';
import { DynamoDBService } from '@/lib/aws/dynamodb';

// Mock DynamoDB service
jest.mock('@/lib/aws/dynamodb');
const mockDynamoDBService = DynamoDBService as jest.Mocked<typeof DynamoDBService>;

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123')
}));

describe('BuilderSelectionService', () => {
  const mockProjectId = 'project-123';
  const mockQuoteId = 'quote-123';
  const mockBuilderId = 'builder-123';
  const mockHomeownerId = 'homeowner-123';
  const mockSelectionId = 'selection-123';

  const mockQuote: Quote = {
    id: mockQuoteId,
    projectId: mockProjectId,
    builderId: mockBuilderId,
    pricing: {
      totalAmount: 25000,
      laborCosts: 15000,
      materialCosts: 10000,
      breakdown: []
    },
    timeline: 30,
    startDate: new Date('2024-03-01'),
    projectedCompletionDate: new Date('2024-04-15'),
    amendments: [],
    termsAndConditions: 'Standard terms',
    insuranceDocuments: [],
    referenceProjects: [],
    status: 'submitted',
    submittedAt: new Date('2024-02-15')
  };

  const mockBuilderProfile: BuilderProfile = {
    firstName: 'John',
    lastName: 'Builder',
    companyName: 'Builder Co Ltd',
    companiesHouseNumber: '12345678',
    insuranceDocuments: [
      {
        id: 'doc-1',
        name: 'Public Liability Insurance',
        type: 'insurance',
        url: 'https://example.com/insurance.pdf',
        uploadedAt: new Date(),
        size: 1024
      }
    ],
    vettingStatus: 'approved',
    specializations: ['kitchen_full_refit', 'bathroom_full_refit'],
    serviceAreas: ['London', 'Surrey'],
    rating: 4.5,
    completedProjects: 15
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('selectBuilder', () => {
    it('should successfully select a builder', async () => {
      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: mockQuote
      });

      mockDynamoDBService.putItem.mockResolvedValueOnce({});
      mockDynamoDBService.updateItem.mockResolvedValue({});

      // Mock project with quotes
      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: {
          id: mockProjectId,
          quotes: [mockQuoteId, 'other-quote-1', 'other-quote-2']
        }
      });

      const result = await BuilderSelectionService.selectBuilder(
        mockProjectId,
        mockQuoteId,
        mockHomeownerId,
        'Best value for money'
      );

      expect(result.success).toBe(true);
      expect(result.selectionId).toBe('mock-uuid-123');

      // Verify selection was stored
      expect(mockDynamoDBService.putItem).toHaveBeenCalledWith(
        'uk-home-improvement-selections',
        expect.objectContaining({
          id: 'mock-uuid-123',
          projectId: mockProjectId,
          selectedQuoteId: mockQuoteId,
          builderId: mockBuilderId,
          homeownerId: mockHomeownerId,
          status: 'quote_selected',
          selectionReason: 'Best value for money'
        })
      );

      // Verify project was updated
      expect(mockDynamoDBService.updateItem).toHaveBeenCalledWith(
        'uk-home-improvement-projects',
        { id: mockProjectId },
        expect.objectContaining({
          status: 'builder_selection',
          selectedBuilderId: mockBuilderId
        })
      );

      // Verify selected quote was marked as accepted
      expect(mockDynamoDBService.updateItem).toHaveBeenCalledWith(
        'uk-home-improvement-quotes',
        { id: mockQuoteId },
        { status: 'accepted' }
      );

      // Verify other quotes were marked as rejected
      expect(mockDynamoDBService.updateItem).toHaveBeenCalledWith(
        'uk-home-improvement-quotes',
        { id: 'other-quote-1' },
        { status: 'rejected' }
      );
    });

    it('should return error for invalid quote', async () => {
      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: null
      });

      const result = await BuilderSelectionService.selectBuilder(
        mockProjectId,
        mockQuoteId,
        mockHomeownerId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid quote or project mismatch');
    });

    it('should return error for project mismatch', async () => {
      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: { ...mockQuote, projectId: 'different-project' }
      });

      const result = await BuilderSelectionService.selectBuilder(
        mockProjectId,
        mockQuoteId,
        mockHomeownerId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid quote or project mismatch');
    });

    it('should handle database errors', async () => {
      mockDynamoDBService.getItem.mockRejectedValueOnce(new Error('Database error'));

      const result = await BuilderSelectionService.selectBuilder(
        mockProjectId,
        mockQuoteId,
        mockHomeownerId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to select builder');
    });
  });

  describe('scheduleMeeting', () => {
    it('should successfully schedule a meeting', async () => {
      const meetingDetails = {
        scheduledDate: new Date('2024-03-15'),
        scheduledTime: '10:00 AM',
        location: '123 Main Street, London',
        attendees: ['homeowner@example.com', 'builder@example.com']
      };

      mockDynamoDBService.updateItem.mockResolvedValueOnce({});

      const result = await BuilderSelectionService.scheduleMeeting(
        mockSelectionId,
        meetingDetails
      );

      expect(result.success).toBe(true);

      expect(mockDynamoDBService.updateItem).toHaveBeenCalledWith(
        'uk-home-improvement-selections',
        { id: mockSelectionId },
        expect.objectContaining({
          status: 'meet_scheduled',
          meetingDetails: expect.objectContaining({
            ...meetingDetails,
            scheduledDate: meetingDetails.scheduledDate.toISOString(),
            agenda: expect.arrayContaining([
              'Review project scope and specifications',
              'Verify builder credentials and insurance'
            ])
          })
        })
      );
    });

    it('should handle database errors', async () => {
      mockDynamoDBService.updateItem.mockRejectedValueOnce(new Error('Database error'));

      const result = await BuilderSelectionService.scheduleMeeting(
        mockSelectionId,
        {
          scheduledDate: new Date(),
          scheduledTime: '10:00 AM',
          location: 'Test location',
          attendees: ['test@example.com']
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to schedule meeting');
    });
  });

  describe('completeMeeting', () => {
    const mockFeedback: MeetingFeedback = {
      overallImpression: 'positive',
      professionalism: 5,
      communication: 4,
      expertise: 5,
      trustworthiness: 4,
      concerns: [],
      positives: ['Very knowledgeable', 'Professional appearance'],
      willingToProceed: true,
      additionalNotes: 'Great builder, ready to proceed'
    };

    it('should complete meeting with positive feedback', async () => {
      const mockSelection = {
        id: mockSelectionId,
        projectId: mockProjectId,
        selectedQuoteId: mockQuoteId,
        builderId: mockBuilderId,
        homeownerId: mockHomeownerId,
        status: 'meet_scheduled',
        meetingDetails: {
          scheduledDate: new Date('2024-03-15'),
          scheduledTime: '10:00 AM',
          location: '123 Main Street',
          attendees: ['test@example.com'],
          agenda: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: mockSelection
      });

      mockDynamoDBService.updateItem.mockResolvedValueOnce({});

      const result = await BuilderSelectionService.completeMeeting(
        mockSelectionId,
        mockFeedback,
        'Meeting went very well'
      );

      expect(result.success).toBe(true);

      expect(mockDynamoDBService.updateItem).toHaveBeenCalledWith(
        'uk-home-improvement-selections',
        { id: mockSelectionId },
        expect.objectContaining({
          status: 'meeting_approved',
          meetingDetails: expect.objectContaining({
            homeownerFeedback: mockFeedback,
            notes: 'Meeting went very well',
            completedAt: expect.any(String)
          })
        })
      );
    });

    it('should complete meeting with negative feedback', async () => {
      const negativeFeedback: MeetingFeedback = {
        ...mockFeedback,
        overallImpression: 'negative',
        willingToProceed: false,
        concerns: ['Seemed unprofessional', 'Couldn\'t answer technical questions']
      };

      const mockSelection = {
        id: mockSelectionId,
        projectId: mockProjectId,
        meetingDetails: {
          scheduledDate: new Date('2024-03-15'),
          attendees: [],
          agenda: []
        }
      };

      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: mockSelection
      });

      mockDynamoDBService.updateItem.mockResolvedValue({});

      const result = await BuilderSelectionService.completeMeeting(
        mockSelectionId,
        negativeFeedback
      );

      expect(result.success).toBe(true);

      // Should update selection to rejected
      expect(mockDynamoDBService.updateItem).toHaveBeenCalledWith(
        'uk-home-improvement-selections',
        { id: mockSelectionId },
        expect.objectContaining({
          status: 'meeting_rejected'
        })
      );

      // Should reset project status
      expect(mockDynamoDBService.updateItem).toHaveBeenCalledWith(
        'uk-home-improvement-projects',
        { id: mockProjectId },
        expect.objectContaining({
          status: 'quote_collection',
          selectedBuilderId: null
        })
      );
    });

    it('should return error for missing selection', async () => {
      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: null
      });

      const result = await BuilderSelectionService.completeMeeting(
        mockSelectionId,
        mockFeedback
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Selection not found');
    });
  });

  describe('getBuilderVerification', () => {
    it('should return comprehensive verification for builder', async () => {
      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: mockBuilderProfile
      });

      const result = await BuilderSelectionService.getBuilderVerification(mockBuilderId);

      expect(result.success).toBe(true);
      expect(result.verification).toBeDefined();

      const verification = result.verification!;
      expect(verification.builderId).toBe(mockBuilderId);
      expect(verification.companiesHouseVerified).toBe(true);
      expect(verification.insuranceVerified).toBe(true);
      expect(verification.referencesVerified).toBe(true);
      expect(verification.qualificationsVerified).toBe(true);
      expect(verification.overallVerificationScore).toBe(100); // All checks passed

      expect(verification.verificationDetails).toHaveLength(4);
      expect(verification.verificationDetails[0].type).toBe('companies_house');
      expect(verification.verificationDetails[0].status).toBe('verified');
    });

    it('should handle builder with missing credentials', async () => {
      const incompleteBuilder: BuilderProfile = {
        ...mockBuilderProfile,
        companiesHouseNumber: '',
        insuranceDocuments: [],
        completedProjects: 0,
        specializations: []
      };

      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: incompleteBuilder
      });

      const result = await BuilderSelectionService.getBuilderVerification(mockBuilderId);

      expect(result.success).toBe(true);
      expect(result.verification!.overallVerificationScore).toBe(0);
      expect(result.verification!.companiesHouseVerified).toBe(false);
      expect(result.verification!.insuranceVerified).toBe(false);
      expect(result.verification!.referencesVerified).toBe(false);
      expect(result.verification!.qualificationsVerified).toBe(false);
    });

    it('should return error for missing builder', async () => {
      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: null
      });

      const result = await BuilderSelectionService.getBuilderVerification(mockBuilderId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Builder not found');
    });
  });

  describe('getSelection', () => {
    it('should return selection with proper date parsing', async () => {
      const mockSelectionData = {
        id: mockSelectionId,
        projectId: mockProjectId,
        selectedQuoteId: mockQuoteId,
        builderId: mockBuilderId,
        homeownerId: mockHomeownerId,
        status: 'meeting_completed',
        createdAt: '2024-02-15T10:00:00.000Z',
        updatedAt: '2024-02-16T15:30:00.000Z',
        meetingDetails: {
          scheduledDate: '2024-03-15T10:00:00.000Z',
          completedAt: '2024-03-15T11:30:00.000Z',
          location: 'Test location',
          attendees: ['test@example.com'],
          agenda: []
        }
      };

      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: mockSelectionData
      });

      const result = await BuilderSelectionService.getSelection(mockSelectionId);

      expect(result.success).toBe(true);
      expect(result.selection).toBeDefined();

      const selection = result.selection!;
      expect(selection.id).toBe(mockSelectionId);
      expect(selection.createdAt).toBeInstanceOf(Date);
      expect(selection.updatedAt).toBeInstanceOf(Date);
      expect(selection.meetingDetails?.scheduledDate).toBeInstanceOf(Date);
      expect(selection.meetingDetails?.completedAt).toBeInstanceOf(Date);
    });

    it('should return error for missing selection', async () => {
      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: null
      });

      const result = await BuilderSelectionService.getSelection(mockSelectionId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Selection not found');
    });
  });

  describe('getSelectionByProject', () => {
    it('should return most recent selection for project', async () => {
      const selections = [
        {
          id: 'selection-1',
          projectId: mockProjectId,
          createdAt: '2024-02-15T10:00:00.000Z',
          updatedAt: '2024-02-15T10:00:00.000Z'
        },
        {
          id: 'selection-2',
          projectId: mockProjectId,
          createdAt: '2024-02-16T10:00:00.000Z',
          updatedAt: '2024-02-16T10:00:00.000Z'
        }
      ];

      mockDynamoDBService.queryItems.mockResolvedValueOnce({
        Items: selections
      });

      const result = await BuilderSelectionService.getSelectionByProject(mockProjectId);

      expect(result.success).toBe(true);
      expect(result.selection?.id).toBe('selection-2'); // Most recent
    });

    it('should return error when no selection found', async () => {
      mockDynamoDBService.queryItems.mockResolvedValueOnce({
        Items: []
      });

      const result = await BuilderSelectionService.getSelectionByProject(mockProjectId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No selection found for project');
    });
  });

  describe('proceedToContract', () => {
    it('should proceed to contract after approved meeting', async () => {
      const mockSelection = {
        id: mockSelectionId,
        projectId: mockProjectId,
        status: 'meeting_approved',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock getSelection call
      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: mockSelection
      });

      mockDynamoDBService.updateItem.mockResolvedValue({});

      const result = await BuilderSelectionService.proceedToContract(mockSelectionId);

      expect(result.success).toBe(true);
      expect(result.contractId).toBe('mock-uuid-123');

      // Verify selection status updated
      expect(mockDynamoDBService.updateItem).toHaveBeenCalledWith(
        'uk-home-improvement-selections',
        { id: mockSelectionId },
        expect.objectContaining({
          status: 'contract_generated'
        })
      );

      // Verify project status updated
      expect(mockDynamoDBService.updateItem).toHaveBeenCalledWith(
        'uk-home-improvement-projects',
        { id: mockProjectId },
        expect.objectContaining({
          status: 'contract_generation'
        })
      );
    });

    it('should return error if meeting not approved', async () => {
      const mockSelection = {
        id: mockSelectionId,
        status: 'meeting_completed',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: mockSelection
      });

      const result = await BuilderSelectionService.proceedToContract(mockSelectionId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Meeting must be approved before proceeding to contract');
    });
  });
});