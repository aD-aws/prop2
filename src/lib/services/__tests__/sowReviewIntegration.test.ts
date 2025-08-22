import { SoWReviewIntegration } from '../sowReviewIntegration';
import { BuilderReviewAgentService } from '../builderReviewAgentService';
import { SoWGenerationService } from '../sowGenerationService';
import { ProjectType, SoWDocument, BuilderReviewAnalysis } from '../../types';

// Mock dependencies
jest.mock('../builderReviewAgentService');
jest.mock('../sowGenerationService');

const mockBuilderReviewService = BuilderReviewAgentService as jest.MockedClass<typeof BuilderReviewAgentService>;
const mockSoWGenerationService = SoWGenerationService as jest.MockedClass<typeof SoWGenerationService>;

describe('SoWReviewIntegration', () => {
  let service: SoWReviewIntegration;
  let mockBuilderReview: jest.Mocked<BuilderReviewAgentService>;
  let mockSoWGeneration: jest.Mocked<SoWGenerationService>;

  const mockSoWDocument: SoWDocument = {
    id: 'sow-123',
    projectId: 'project-123',
    version: 1.0,
    sections: [],
    materials: [],
    laborRequirements: [],
    timeline: [],
    estimatedCosts: {
      totalEstimate: 10000,
      laborCosts: 4000,
      materialCosts: 6000,
      builderMaterials: 3000,
      homeownerMaterials: 3000,
      breakdown: []
    },
    regulatoryRequirements: [],
    generatedAt: new Date()
  };

  const mockReviewAnalysis: BuilderReviewAnalysis = {
    overallScore: 85,
    issues: [
      {
        id: 'issue-1',
        category: 'minor',
        severity: 'minor',
        title: 'Minor specification issue',
        description: 'Small improvement needed',
        location: 'Section 1',
        impact: 'Low impact'
      }
    ],
    recommendations: [
      {
        id: 'rec-1',
        issueId: 'issue-1',
        type: 'modification',
        title: 'Improve specification',
        description: 'Add more detail to specification',
        reasoning: 'Better clarity needed',
        priority: 'medium'
      }
    ],
    missingElements: [],
    unrealisticSpecifications: [],
    regulatoryIssues: [],
    costAccuracyIssues: [],
    materialImprovements: [],
    timelineIssues: [],
    qualityIndicator: 'good',
    reviewedAt: new Date(),
    reviewAgentType: 'kitchen'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock instances with proper method mocking
    mockBuilderReview = {
      reviewSoW: jest.fn(),
      applyRecommendations: jest.fn(),
      getReviewResults: jest.fn()
    } as any;
    
    mockSoWGeneration = {
      generateSoW: jest.fn()
    } as any;
    
    service = new SoWReviewIntegration();
    (service as any).builderReviewService = mockBuilderReview;
    (service as any).sowGenerationService = mockSoWGeneration;
  });

  describe('generateSoWWithReview', () => {
    it('should generate SoW and automatically trigger review', async () => {
      // Arrange
      const projectType: ProjectType = 'kitchen_full_refit';
      const questionnaireResponses = { kitchenSize: 'large', budget: 15000 };
      const propertyDetails = { address: '123 Test St', propertyType: 'house' };

      mockSoWGeneration.generateSoW.mockResolvedValue(mockSoWDocument);
      mockBuilderReview.reviewSoW.mockResolvedValue(mockReviewAnalysis);

      // Act
      const result = await service.generateSoWWithReview(
        'project-123',
        projectType,
        questionnaireResponses,
        propertyDetails
      );

      // Assert
      expect(mockSoWGeneration.generateSoW).toHaveBeenCalledWith(
        'project-123',
        projectType,
        questionnaireResponses,
        propertyDetails
      );

      expect(mockBuilderReview.reviewSoW).toHaveBeenCalledWith(
        'project-123',
        mockSoWDocument,
        projectType,
        propertyDetails
      );

      expect(result).toEqual({
        sowDocument: mockSoWDocument,
        reviewAnalysis: mockReviewAnalysis
      });
    });

    it('should handle SoW generation errors', async () => {
      // Arrange
      const projectType: ProjectType = 'kitchen_full_refit';
      mockSoWGeneration.generateSoW.mockRejectedValue(new Error('SoW generation failed'));

      // Act & Assert
      await expect(
        service.generateSoWWithReview('project-123', projectType, {}, {})
      ).rejects.toThrow('Failed to generate SoW with review: SoW generation failed');
    });

    it('should handle review service errors', async () => {
      // Arrange
      const projectType: ProjectType = 'kitchen_full_refit';
      mockSoWGeneration.generateSoW.mockResolvedValue(mockSoWDocument);
      mockBuilderReview.reviewSoW.mockRejectedValue(new Error('Review service failed'));

      // Act & Assert
      await expect(
        service.generateSoWWithReview('project-123', projectType, {}, {})
      ).rejects.toThrow('Failed to generate SoW with review: Review service failed');
    });
  });

  describe('regenerateSoWWithImprovements', () => {
    it('should apply recommendations and re-review improved SoW', async () => {
      // Arrange
      const selectedRecommendations = ['rec-1', 'rec-2'];
      const improvedSoW = { ...mockSoWDocument, version: 1.1 };
      const newReviewAnalysis = { ...mockReviewAnalysis, overallScore: 95 };

      mockBuilderReview.applyRecommendations.mockResolvedValue(improvedSoW);
      mockBuilderReview.reviewSoW.mockResolvedValue(newReviewAnalysis);

      // Act
      const result = await service.regenerateSoWWithImprovements(
        'project-123',
        mockSoWDocument,
        selectedRecommendations
      );

      // Assert
      expect(mockBuilderReview.applyRecommendations).toHaveBeenCalledWith(
        'project-123',
        mockSoWDocument,
        selectedRecommendations
      );

      expect(mockBuilderReview.reviewSoW).toHaveBeenCalledWith(
        'project-123',
        improvedSoW,
        expect.any(String), // project type
        expect.any(Object)  // property details
      );

      expect(result).toEqual({
        improvedSoW,
        newReviewAnalysis
      });
    });

    it('should handle recommendation application errors', async () => {
      // Arrange
      mockBuilderReview.applyRecommendations.mockRejectedValue(new Error('Apply recommendations failed'));

      // Act & Assert
      await expect(
        service.regenerateSoWWithImprovements('project-123', mockSoWDocument, ['rec-1'])
      ).rejects.toThrow('Failed to regenerate SoW: Apply recommendations failed');
    });
  });

  describe('validateSoWForBuilderInvitation', () => {
    it('should allow builder invitations for high quality SoW', async () => {
      // Arrange
      const highQualityReview: BuilderReviewAnalysis = {
        ...mockReviewAnalysis,
        overallScore: 85,
        issues: [
          {
            id: 'issue-1',
            category: 'minor',
            severity: 'minor',
            title: 'Minor issue',
            description: 'Small problem',
            location: 'Section 1',
            impact: 'Low'
          }
        ]
      };

      mockBuilderReview.getReviewResults.mockResolvedValue(highQualityReview);

      // Act
      const result = await service.validateSoWForBuilderInvitation('project-123');

      // Assert
      expect(result.canInviteBuilders).toBe(true);
      expect(result.qualityScore).toBe(85);
      expect(result.criticalIssues).toHaveLength(0);
    });

    it('should prevent builder invitations for low quality SoW', async () => {
      // Arrange
      const lowQualityReview: BuilderReviewAnalysis = {
        ...mockReviewAnalysis,
        overallScore: 45,
        issues: [
          {
            id: 'issue-1',
            category: 'regulatory',
            severity: 'critical',
            title: 'Critical regulatory issue',
            description: 'Major compliance problem',
            location: 'Section 1',
            impact: 'High'
          }
        ]
      };

      mockBuilderReview.getReviewResults.mockResolvedValue(lowQualityReview);

      // Act
      const result = await service.validateSoWForBuilderInvitation('project-123');

      // Assert
      expect(result.canInviteBuilders).toBe(false);
      expect(result.qualityScore).toBe(45);
      expect(result.criticalIssues).toContain('Critical regulatory issue');
    });

    it('should prevent builder invitations when SoW not reviewed', async () => {
      // Arrange
      mockBuilderReview.getReviewResults.mockResolvedValue(null);

      // Act
      const result = await service.validateSoWForBuilderInvitation('project-123');

      // Assert
      expect(result.canInviteBuilders).toBe(false);
      expect(result.qualityScore).toBe(0);
      expect(result.criticalIssues).toContain('SoW has not been reviewed by Builder Review Agent');
    });

    it('should handle validation errors gracefully', async () => {
      // Arrange
      mockBuilderReview.getReviewResults.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await service.validateSoWForBuilderInvitation('project-123');

      // Assert
      expect(result.canInviteBuilders).toBe(false);
      expect(result.qualityScore).toBe(0);
      expect(result.criticalIssues).toContain('Error validating SoW quality');
    });
  });

  describe('getQualityIndicatorForBuilders', () => {
    it('should return correct quality indicator for excellent SoW', () => {
      // Arrange
      const excellentReview: BuilderReviewAnalysis = {
        ...mockReviewAnalysis,
        qualityIndicator: 'excellent'
      };

      // Act
      const result = service.getQualityIndicatorForBuilders(excellentReview);

      // Assert
      expect(result.hasQualityIndicator).toBe(true);
      expect(result.qualityLevel).toBe('excellent');
      expect(result.displayText).toBe('Professionally Reviewed - Excellent Quality');
      expect(result.badgeColor).toBe('green');
    });

    it('should return correct quality indicator for poor SoW', () => {
      // Arrange
      const poorReview: BuilderReviewAnalysis = {
        ...mockReviewAnalysis,
        qualityIndicator: 'poor'
      };

      // Act
      const result = service.getQualityIndicatorForBuilders(poorReview);

      // Assert
      expect(result.hasQualityIndicator).toBe(true);
      expect(result.qualityLevel).toBe('poor');
      expect(result.displayText).toBe('Professionally Reviewed - Poor Quality');
      expect(result.badgeColor).toBe('red');
    });

    it('should return not reviewed indicator when no review available', () => {
      // Act
      const result = service.getQualityIndicatorForBuilders(null);

      // Assert
      expect(result.hasQualityIndicator).toBe(false);
      expect(result.qualityLevel).toBe('not_reviewed');
      expect(result.displayText).toBe('Not Reviewed');
      expect(result.badgeColor).toBe('gray');
    });
  });

  describe('getReviewStatus', () => {
    it('should return review analysis when available', async () => {
      // Arrange
      mockBuilderReview.getReviewResults.mockResolvedValue(mockReviewAnalysis);

      // Act
      const result = await service.getReviewStatus('project-123');

      // Assert
      expect(result).toEqual(mockReviewAnalysis);
      expect(mockBuilderReview.getReviewResults).toHaveBeenCalledWith('project-123');
    });

    it('should return null when no review available', async () => {
      // Arrange
      mockBuilderReview.getReviewResults.mockResolvedValue(null);

      // Act
      const result = await service.getReviewStatus('project-123');

      // Assert
      expect(result).toBeNull();
    });
  });
});