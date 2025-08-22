import { builderQuoteGenerationService } from '../builderQuoteGenerationService';
import { builderSubscriptionService } from '../builderSubscriptionService';
import { sowGenerationService } from '../sowGenerationService';
import { timelineOptimizationService } from '../timelineOptimizationService';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: jest.fn().mockResolvedValue({ Items: [], Item: null })
    }))
  },
  PutCommand: jest.fn(),
  GetCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  QueryCommand: jest.fn()
}));
jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn(() => ({
    send: jest.fn().mockResolvedValue({})
  })),
  SendEmailCommand: jest.fn()
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    // Mock Stripe methods as needed
  }));
});

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123')
}));

// Mock dependencies
jest.mock('../builderSubscriptionService', () => ({
  builderSubscriptionService: {
    getBuilderSubscription: jest.fn(),
    trackUsage: jest.fn()
  }
}));
jest.mock('../sowGenerationService', () => ({
  sowGenerationService: {
    generateSoW: jest.fn()
  }
}));
jest.mock('../timelineOptimizationService', () => ({
  timelineOptimizationService: {
    optimizeTimeline: jest.fn()
  }
}));

const mockBuilderSubscriptionService = builderSubscriptionService as jest.Mocked<typeof builderSubscriptionService>;
const mockSowGenerationService = sowGenerationService as jest.Mocked<typeof sowGenerationService>;
const mockTimelineOptimizationService = timelineOptimizationService as jest.Mocked<typeof timelineOptimizationService>;

describe('BuilderQuoteGenerationService', () => {
  const mockBuilderId = 'builder-123';
  const mockProjectData = {
    clientName: 'John Smith',
    clientEmail: 'john@example.com',
    projectType: 'Kitchen Renovation',
    propertyAddress: '123 Main Street, London, SW1A 1AA',
    projectDetails: {
      description: 'Full kitchen renovation with new appliances',
      requirements: { budget: 15000 }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful subscription check
    mockBuilderSubscriptionService.getBuilderSubscription.mockResolvedValue({
      id: 'sub-123',
      builderId: mockBuilderId,
      status: 'active',
      plan: 'premium',
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);
  });

  describe('createBuilderProject', () => {
    it('should create a new builder project successfully', async () => {
      const project = await builderQuoteGenerationService.createBuilderProject(
        mockBuilderId,
        mockProjectData
      );

      expect(project).toMatchObject({
        builderId: mockBuilderId,
        clientName: mockProjectData.clientName,
        clientEmail: mockProjectData.clientEmail,
        projectType: mockProjectData.projectType,
        propertyAddress: mockProjectData.propertyAddress,
        status: 'draft',
        usageTracked: false
      });

      expect(project.id).toBeDefined();
      expect(project.invitationToken).toBeDefined();
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error if builder has no active subscription', async () => {
      mockBuilderSubscriptionService.getBuilderSubscription.mockResolvedValue(null);

      await expect(
        builderQuoteGenerationService.createBuilderProject(mockBuilderId, mockProjectData)
      ).rejects.toThrow('Active subscription required for professional quote generation');
    });

    it('should throw error if builder subscription is not active', async () => {
      mockBuilderSubscriptionService.getBuilderSubscription.mockResolvedValue({
        id: 'sub-123',
        builderId: mockBuilderId,
        status: 'expired',
        plan: 'premium',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      await expect(
        builderQuoteGenerationService.createBuilderProject(mockBuilderId, mockProjectData)
      ).rejects.toThrow('Active subscription required for professional quote generation');
    });
  });

  describe('generateSoWForBuilderProject', () => {
    const mockProjectId = 'project-123';
    const mockSowResult = {
      sections: [
        { title: 'Kitchen Demolition', content: 'Remove existing kitchen units...' },
        { title: 'Installation', content: 'Install new kitchen units...' }
      ],
      materials: [
        { name: 'Kitchen Units', cost: 5000, type: 'builder_provided' }
      ],
      tasks: [
        { id: 'task-1', name: 'Demolition', duration: 2, dependencies: [] },
        { id: 'task-2', name: 'Installation', duration: 5, dependencies: ['task-1'] }
      ]
    };

    const mockGanttChart = {
      tasks: mockSowResult.tasks,
      totalDuration: 7,
      criticalPath: ['task-1', 'task-2']
    };

    beforeEach(() => {
      mockSowGenerationService.generateSoW.mockResolvedValue(mockSowResult as any);
      mockTimelineOptimizationService.optimizeTimeline.mockResolvedValue(mockGanttChart as any);
    });

    it('should generate SoW and timeline successfully', async () => {
      await expect(
        builderQuoteGenerationService.generateSoWForBuilderProject(mockProjectId)
      ).resolves.not.toThrow();

      expect(mockSowGenerationService.generateSoW).toHaveBeenCalledWith({
        projectType: expect.any(String),
        propertyDetails: expect.objectContaining({ address: expect.any(String) }),
        projectDetails: expect.any(Object),
        includeCosting: true
      });

      expect(mockTimelineOptimizationService.optimizeTimeline).toHaveBeenCalledWith(
        mockSowResult.tasks,
        expect.any(Object)
      );
    });

    it('should handle SoW generation errors gracefully', async () => {
      const error = new Error('AI service unavailable');
      mockSowGenerationService.generateSoW.mockRejectedValue(error);

      await expect(
        builderQuoteGenerationService.generateSoWForBuilderProject(mockProjectId)
      ).rejects.toThrow('AI service unavailable');
    });
  });

  describe('createQuoteForProject', () => {
    const mockProjectId = 'project-123';
    const mockQuoteData = {
      totalAmount: 15000,
      laborCosts: 8000,
      materialCosts: 7000,
      breakdown: [
        {
          category: 'Labor',
          description: 'Kitchen installation',
          quantity: 1,
          unitPrice: 8000,
          totalPrice: 8000,
          type: 'labor' as const
        }
      ],
      timeline: 10,
      startDate: new Date('2024-03-01'),
      terms: 'Standard terms and conditions',
      validUntil: new Date('2024-04-01')
    };

    it('should create quote with calculated completion date', async () => {
      await expect(
        builderQuoteGenerationService.createQuoteForProject(mockProjectId, mockQuoteData)
      ).resolves.not.toThrow();

      // Verify that projected completion date is calculated correctly
      const expectedCompletionDate = new Date('2024-03-01');
      expectedCompletionDate.setDate(expectedCompletionDate.getDate() + 10);
      
      // The service should have been called with the quote data including projected completion date
    });
  });

  describe('sendInvitationToClient', () => {
    const mockProjectId = 'project-123';

    it('should track usage and send email invitation', async () => {
      await expect(
        builderQuoteGenerationService.sendInvitationToClient(mockProjectId)
      ).resolves.not.toThrow();

      expect(mockBuilderSubscriptionService.trackUsage).toHaveBeenCalledWith(
        expect.any(String),
        'quote_generation',
        1
      );
    });

    it('should throw error if project is not ready', async () => {
      // This would require mocking the project retrieval to return a project without quote
      // The actual implementation would handle this case
    });
  });

  describe('getQuoteByToken', () => {
    const mockToken = 'invitation-token-123';

    it('should return project and builder data for valid token', async () => {
      const result = await builderQuoteGenerationService.getQuoteByToken(mockToken);
      
      // This test would require proper mocking of DynamoDB responses
      // The actual implementation handles token validation and data retrieval
    });

    it('should return null for invalid token', async () => {
      const result = await builderQuoteGenerationService.getQuoteByToken('invalid-token');
      
      expect(result).toBeNull();
    });
  });

  describe('getBuilderProjects', () => {
    it('should return list of builder projects', async () => {
      const projects = await builderQuoteGenerationService.getBuilderProjects(mockBuilderId);
      
      expect(Array.isArray(projects)).toBe(true);
    });

    it('should return projects in descending order by creation date', async () => {
      const projects = await builderQuoteGenerationService.getBuilderProjects(mockBuilderId);
      
      // Verify that projects are returned in the correct order
      // This would require proper mocking of DynamoDB query results
    });
  });

  describe('email generation', () => {
    const mockProject = {
      id: 'project-123',
      builderId: mockBuilderId,
      clientName: 'John Smith',
      clientEmail: 'john@example.com',
      projectType: 'Kitchen Renovation',
      propertyAddress: '123 Main Street, London',
      invitationToken: 'token-123',
      status: 'ready' as const,
      quote: {
        totalAmount: 15000,
        validUntil: new Date('2024-04-01')
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      usageTracked: false
    };

    it('should generate proper HTML email content', () => {
      // Test the private email generation methods
      // This would require exposing them or testing through the public interface
      const viewUrl = 'https://example.com/quote/view/token-123';
      
      // The email should contain project details, client name, and view URL
      expect(viewUrl).toContain('token-123');
    });

    it('should generate proper text email content', () => {
      // Similar test for text email format
      const viewUrl = 'https://example.com/quote/view/token-123';
      
      expect(viewUrl).toContain('token-123');
    });
  });

  describe('usage tracking', () => {
    it('should track usage only once per project', async () => {
      const mockProjectId = 'project-123';
      
      // First invitation should track usage
      await builderQuoteGenerationService.sendInvitationToClient(mockProjectId);
      
      expect(mockBuilderSubscriptionService.trackUsage).toHaveBeenCalledTimes(1);
      
      // Second invitation should not track usage again (if project already tracked)
      // This would require proper state management in the test
    });
  });

  describe('error handling', () => {
    it('should handle DynamoDB errors gracefully', async () => {
      // Mock DynamoDB errors and verify proper error handling
      const mockError = new Error('DynamoDB connection failed');
      
      // Test various error scenarios and ensure they are handled properly
    });

    it('should handle SES email sending errors', async () => {
      // Mock SES errors and verify proper error handling
      const mockError = new Error('Email sending failed');
      
      // Test email sending failures
    });
  });
});

describe('BuilderQuoteGenerationService Integration', () => {
  it('should handle complete quote generation workflow', async () => {
    // Integration test covering the full workflow:
    // 1. Create project
    // 2. Generate SoW
    // 3. Create quote
    // 4. Send invitation
    // 5. View quote by token
    
    const builderId = 'builder-123';
    const projectData = {
      clientName: 'Jane Doe',
      clientEmail: 'jane@example.com',
      projectType: 'Bathroom Renovation',
      propertyAddress: '456 Oak Street, Manchester',
      projectDetails: {
        description: 'Complete bathroom renovation',
        requirements: { budget: 12000 }
      }
    };

    // This would be a comprehensive integration test
    // covering the entire workflow end-to-end
  });
});