import { BuilderProjectAccessService } from '../builderProjectAccessService';
import { InvitationService } from '../invitationService';
import { DynamoDBService } from '@/lib/aws/dynamodb';

// Mock dependencies
jest.mock('../invitationService');
jest.mock('@/lib/aws/dynamodb');

const mockInvitationService = InvitationService as jest.Mocked<typeof InvitationService>;
const mockDynamoDBService = DynamoDBService as jest.Mocked<typeof DynamoDBService>;

describe('BuilderProjectAccessService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('grantProjectAccess', () => {
    const mockInvitation = {
      invitationCode: 'ABC12345',
      projectId: 'project-123',
      homeownerId: 'homeowner-456',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'active' as const,
      invitationType: 'email' as const
    };

    it('should grant access with valid invitation code', async () => {
      mockInvitationService.validateInvitationCode.mockResolvedValue({
        success: true,
        invitation: mockInvitation
      });

      mockDynamoDBService.getItem.mockResolvedValue({}); // No existing access
      mockInvitationService.useInvitationCode.mockResolvedValue({ success: true });
      mockDynamoDBService.putItem.mockResolvedValue({});
      mockDynamoDBService.updateItem.mockResolvedValue({});

      const result = await BuilderProjectAccessService.grantProjectAccess(
        'ABC12345',
        'builder-789'
      );

      expect(result.success).toBe(true);
      expect(result.projectId).toBe('project-123');
      expect(mockInvitationService.validateInvitationCode).toHaveBeenCalledWith('ABC12345');
      expect(mockInvitationService.useInvitationCode).toHaveBeenCalledWith('ABC12345', 'builder-789');
      expect(mockDynamoDBService.putItem).toHaveBeenCalledWith(
        'uk-home-improvement-builder-access',
        expect.objectContaining({
          projectId: 'project-123',
          builderId: 'builder-789',
          canViewSoW: true,
          canSubmitQuote: true,
          hasSubmittedQuote: false,
          builderProjectKey: 'builder-789#project-123'
        })
      );
    });

    it('should return existing access if builder already has access', async () => {
      mockInvitationService.validateInvitationCode.mockResolvedValue({
        success: true,
        invitation: mockInvitation
      });

      // Mock existing access
      const existingAccess = {
        projectId: 'project-123',
        builderId: 'builder-789',
        accessGrantedAt: new Date(),
        canViewSoW: true,
        canSubmitQuote: true,
        hasSubmittedQuote: false
      };

      mockDynamoDBService.getItem.mockResolvedValue({ Item: existingAccess });

      const result = await BuilderProjectAccessService.grantProjectAccess(
        'ABC12345',
        'builder-789'
      );

      expect(result.success).toBe(true);
      expect(result.projectId).toBe('project-123');
      expect(mockInvitationService.useInvitationCode).not.toHaveBeenCalled();
    });

    it('should handle invalid invitation code', async () => {
      mockInvitationService.validateInvitationCode.mockResolvedValue({
        success: false,
        error: 'Invalid invitation code'
      });

      const result = await BuilderProjectAccessService.grantProjectAccess(
        'INVALID123',
        'builder-789'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid invitation code');
    });

    it('should handle database errors', async () => {
      mockInvitationService.validateInvitationCode.mockResolvedValue({
        success: true,
        invitation: mockInvitation
      });

      mockDynamoDBService.getItem.mockResolvedValue({});
      mockInvitationService.useInvitationCode.mockResolvedValue({ success: true });
      mockDynamoDBService.putItem.mockRejectedValue(new Error('Database error'));

      const result = await BuilderProjectAccessService.grantProjectAccess(
        'ABC12345',
        'builder-789'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to grant project access');
    });
  });

  describe('getBuilderProjectAccess', () => {
    it('should retrieve builder access successfully', async () => {
      const mockAccess = {
        projectId: 'project-123',
        builderId: 'builder-789',
        accessGrantedAt: '2024-02-15T10:00:00.000Z',
        canViewSoW: true,
        canSubmitQuote: true,
        hasSubmittedQuote: false,
        builderProjectKey: 'builder-789#project-123'
      };

      mockDynamoDBService.getItem.mockResolvedValue({ Item: mockAccess });

      const result = await BuilderProjectAccessService.getBuilderProjectAccess(
        'builder-789',
        'project-123'
      );

      expect(result.success).toBe(true);
      expect(result.access).toBeDefined();
      expect(result.access?.projectId).toBe('project-123');
      expect(result.access?.accessGrantedAt).toBeInstanceOf(Date);
    });

    it('should handle access not found', async () => {
      mockDynamoDBService.getItem.mockResolvedValue({});

      const result = await BuilderProjectAccessService.getBuilderProjectAccess(
        'builder-789',
        'project-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access not found');
    });
  });

  describe('getBuilderAccessibleProjects', () => {
    it('should retrieve all accessible projects for builder', async () => {
      const mockAccessRecords = [
        { projectId: 'project-1', builderId: 'builder-789' },
        { projectId: 'project-2', builderId: 'builder-789' }
      ];

      const mockProjects = [
        {
          id: 'project-1',
          projectType: 'kitchen_renovation',
          status: 'quote_collection',
          createdAt: '2024-02-15T10:00:00.000Z',
          updatedAt: '2024-02-15T10:00:00.000Z',
          timeline: {
            milestones: []
          }
        },
        {
          id: 'project-2',
          projectType: 'bathroom_renovation',
          status: 'builder_invitation',
          createdAt: '2024-02-16T10:00:00.000Z',
          updatedAt: '2024-02-16T10:00:00.000Z',
          timeline: {
            milestones: []
          }
        }
      ];

      mockDynamoDBService.queryItems.mockResolvedValue({ Items: mockAccessRecords });
      mockDynamoDBService.getItem
        .mockResolvedValueOnce({ Item: mockProjects[0] })
        .mockResolvedValueOnce({ Item: mockProjects[1] });

      const result = await BuilderProjectAccessService.getBuilderAccessibleProjects('builder-789');

      expect(result.success).toBe(true);
      expect(result.projects).toHaveLength(2);
      expect(result.projects?.[0].id).toBe('project-1');
      expect(result.projects?.[0].createdAt).toBeInstanceOf(Date);
    });

    it('should return empty array when no projects accessible', async () => {
      mockDynamoDBService.queryItems.mockResolvedValue({ Items: [] });

      const result = await BuilderProjectAccessService.getBuilderAccessibleProjects('builder-789');

      expect(result.success).toBe(true);
      expect(result.projects).toEqual([]);
    });
  });

  describe('getProjectSoWForBuilder', () => {
    const mockProject = {
      id: 'project-123',
      projectType: 'kitchen_renovation',
      status: 'quote_collection',
      createdAt: '2024-02-15T10:00:00.000Z',
      updatedAt: '2024-02-15T10:00:00.000Z',
      timeline: { milestones: [] },
      sowDocument: {
        id: 'sow-123',
        projectId: 'project-123',
        version: 1,
        sections: [],
        materials: [
          {
            id: 'mat-1',
            name: 'Kitchen Units',
            category: 'builder_provided',
            quantity: 10,
            unit: 'units',
            estimatedCost: 5000,
            specifications: []
          }
        ],
        laborRequirements: [
          {
            id: 'labor-1',
            trade: 'Carpenter',
            description: 'Install kitchen units',
            personDays: 5,
            estimatedCost: 2500,
            qualifications: []
          }
        ],
        timeline: [],
        estimatedCosts: {
          totalEstimate: 15000,
          laborCosts: 8000,
          materialCosts: 7000,
          builderMaterials: 7000,
          homeownerMaterials: 0,
          breakdown: []
        },
        regulatoryRequirements: [],
        generatedAt: new Date()
      }
    };

    it('should return SoW without cost estimates for builder', async () => {
      const mockAccess = {
        projectId: 'project-123',
        builderId: 'builder-789',
        canViewSoW: true,
        canSubmitQuote: true
      };

      mockDynamoDBService.getItem
        .mockResolvedValueOnce({ Item: mockAccess })
        .mockResolvedValueOnce({ Item: mockProject });

      const result = await BuilderProjectAccessService.getProjectSoWForBuilder(
        'builder-789',
        'project-123'
      );

      expect(result.success).toBe(true);
      expect(result.sowDocument).toBeDefined();
      expect(result.project).toBeDefined();
      
      // Check that cost estimates are removed
      expect(result.sowDocument?.estimatedCosts.totalEstimate).toBe(0);
      expect(result.sowDocument?.materials[0].estimatedCost).toBeUndefined();
      expect(result.sowDocument?.laborRequirements[0].estimatedCost).toBeUndefined();
    });

    it('should deny access if builder cannot view SoW', async () => {
      const mockAccess = {
        projectId: 'project-123',
        builderId: 'builder-789',
        canViewSoW: false,
        canSubmitQuote: true
      };

      mockDynamoDBService.getItem.mockResolvedValue({ Item: mockAccess });

      const result = await BuilderProjectAccessService.getProjectSoWForBuilder(
        'builder-789',
        'project-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied to project SoW');
    });
  });

  describe('updateBuilderQuoteStatus', () => {
    it('should update quote status successfully', async () => {
      mockDynamoDBService.updateItem.mockResolvedValue({});
      mockDynamoDBService.getItem.mockResolvedValue({
        Item: {
          invitedBuilders: [
            {
              builderId: 'builder-789',
              status: 'accessed',
              quoteSubmitted: false
            }
          ]
        }
      });

      const result = await BuilderProjectAccessService.updateBuilderQuoteStatus(
        'builder-789',
        'project-123',
        'quote-456'
      );

      expect(result.success).toBe(true);
      expect(mockDynamoDBService.updateItem).toHaveBeenCalledWith(
        'uk-home-improvement-builder-access',
        { builderProjectKey: 'builder-789#project-123' },
        {
          hasSubmittedQuote: true,
          quoteId: 'quote-456'
        }
      );
    });
  });

  describe('canBuilderAccessProject', () => {
    it('should return true if builder has access', async () => {
      const mockAccess = {
        projectId: 'project-123',
        builderId: 'builder-789',
        canViewSoW: true
      };

      mockDynamoDBService.getItem.mockResolvedValue({ Item: mockAccess });

      const result = await BuilderProjectAccessService.canBuilderAccessProject(
        'builder-789',
        'project-123'
      );

      expect(result.success).toBe(true);
      expect(result.canAccess).toBe(true);
    });

    it('should return false if builder has no access', async () => {
      mockDynamoDBService.getItem.mockResolvedValue({});

      const result = await BuilderProjectAccessService.canBuilderAccessProject(
        'builder-789',
        'project-123'
      );

      expect(result.success).toBe(true);
      expect(result.canAccess).toBe(false);
    });
  });
});