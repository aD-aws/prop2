import { BuilderReviewAgentService } from '../builderReviewAgentService';
import { AIAgentService } from '../aiAgentService';
import { PromptManager } from '../promptManager';
import { ProjectType, SoWDocument, BuilderReviewAnalysis } from '../../types';

// Mock dependencies
jest.mock('../aiAgentService');
jest.mock('../promptManager');

const mockAIAgentService = AIAgentService as jest.MockedClass<typeof AIAgentService>;
const mockPromptManager = PromptManager as jest.MockedClass<typeof PromptManager>;

describe('BuilderReviewAgentService', () => {
  let service: BuilderReviewAgentService;
  let mockAIAgent: jest.Mocked<AIAgentService>;
  let mockPrompt: jest.Mocked<PromptManager>;

  const mockSoWDocument: SoWDocument = {
    id: 'sow-123',
    projectId: 'project-123',
    version: 1.0,
    sections: [
      {
        id: 'section-1',
        title: 'Kitchen Installation',
        description: 'Complete kitchen renovation',
        specifications: ['Install new cabinets', 'Fit worktops'],
        dependencies: []
      }
    ],
    materials: [
      {
        id: 'material-1',
        name: 'Kitchen Cabinets',
        category: 'homeowner_provided',
        quantity: 10,
        unit: 'units',
        estimatedCost: 5000,
        specifications: ['Solid wood', 'Soft close hinges']
      }
    ],
    laborRequirements: [
      {
        id: 'labor-1',
        trade: 'Kitchen Fitter',
        description: 'Install kitchen units',
        personDays: 5,
        estimatedCost: 2500,
        qualifications: ['Kitchen fitting experience']
      }
    ],
    timeline: [
      {
        id: 'task-1',
        name: 'Install cabinets',
        description: 'Fit kitchen cabinets',
        duration: 3,
        dependencies: [],
        canRunInParallel: false,
        trade: 'Kitchen Fitter'
      }
    ],
    estimatedCosts: {
      totalEstimate: 7500,
      laborCosts: 2500,
      materialCosts: 5000,
      builderMaterials: 0,
      homeownerMaterials: 5000,
      breakdown: []
    },
    regulatoryRequirements: [],
    generatedAt: new Date()
  };

  const mockPropertyDetails = {
    address: '123 Test Street',
    propertyType: 'house',
    isListedBuilding: false,
    isInConservationArea: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAIAgent = new mockAIAgentService() as jest.Mocked<AIAgentService>;
    mockPrompt = new mockPromptManager() as jest.Mocked<PromptManager>;
    
    service = new BuilderReviewAgentService();
    (service as any).aiAgentService = mockAIAgent;
    (service as any).promptManager = mockPrompt;
  });

  describe('reviewSoW', () => {
    it('should successfully review a kitchen renovation SoW', async () => {
      // Arrange
      const projectType: ProjectType = 'kitchen_full_refit';
      const mockPromptTemplate = 'Kitchen review prompt template';
      const mockAIResponse = {
        content: JSON.stringify({
          issues: [
            {
              category: 'missing_work',
              severity: 'major',
              title: 'Missing electrical work',
              description: 'No electrical specifications for new appliances',
              location: 'Kitchen Installation section',
              impact: 'Could delay project and increase costs'
            }
          ],
          recommendations: [
            {
              type: 'addition',
              title: 'Add electrical specifications',
              description: 'Include electrical work for appliance installation',
              suggestedText: 'Install dedicated circuits for dishwasher and oven',
              reasoning: 'New appliances require proper electrical connections',
              priority: 'high'
            }
          ],
          missingElements: ['Electrical work specifications'],
          unrealisticSpecifications: [],
          regulatoryIssues: ['Part P electrical notification required'],
          costAccuracyIssues: [],
          materialImprovements: ['Specify appliance electrical requirements'],
          timelineIssues: []
        })
      };

      mockPrompt.getPrompt.mockResolvedValue(mockPromptTemplate);
      mockAIAgent.invokeAgent.mockResolvedValue(mockAIResponse);

      // Act
      const result = await service.reviewSoW(
        'project-123',
        mockSoWDocument,
        projectType,
        mockPropertyDetails
      );

      // Assert
      expect(mockPrompt.getPrompt).toHaveBeenCalledWith('builder-review-kitchen', 'latest');
      expect(mockAIAgent.invokeAgent).toHaveBeenCalledWith(
        'builder-review-kitchen',
        mockPromptTemplate,
        expect.objectContaining({
          sowDocument: mockSoWDocument,
          projectType,
          propertyDetails: mockPropertyDetails
        })
      );

      expect(result).toMatchObject({
        overallScore: expect.any(Number),
        issues: expect.arrayContaining([
          expect.objectContaining({
            category: 'missing_work',
            severity: 'major',
            title: 'Missing electrical work'
          })
        ]),
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            type: 'addition',
            title: 'Add electrical specifications',
            priority: 'high'
          })
        ]),
        qualityIndicator: expect.any(String),
        reviewAgentType: 'kitchen'
      });
    });

    it('should select correct review agent for loft conversion', async () => {
      // Arrange
      const projectType: ProjectType = 'loft_conversion_dormer';
      mockPrompt.getPrompt.mockResolvedValue('Structural conversion prompt');
      mockAIAgent.invokeAgent.mockResolvedValue({
        content: JSON.stringify({
          issues: [],
          recommendations: [],
          missingElements: [],
          unrealisticSpecifications: [],
          regulatoryIssues: [],
          costAccuracyIssues: [],
          materialImprovements: [],
          timelineIssues: []
        })
      });

      // Act
      await service.reviewSoW('project-123', mockSoWDocument, projectType, mockPropertyDetails);

      // Assert
      expect(mockPrompt.getPrompt).toHaveBeenCalledWith('builder-review-structural-conversion', 'latest');
      expect(mockAIAgent.invokeAgent).toHaveBeenCalledWith(
        'builder-review-structural-conversion',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should calculate quality score based on issue severity', async () => {
      // Arrange
      const projectType: ProjectType = 'kitchen_full_refit';
      const mockAIResponse = {
        content: JSON.stringify({
          issues: [
            {
              category: 'missing_work',
              severity: 'critical',
              title: 'Critical issue',
              description: 'Critical problem',
              location: 'Section 1',
              impact: 'High impact'
            },
            {
              category: 'regulatory',
              severity: 'major',
              title: 'Major issue',
              description: 'Major problem',
              location: 'Section 2',
              impact: 'Medium impact'
            },
            {
              category: 'material_spec',
              severity: 'minor',
              title: 'Minor issue',
              description: 'Minor problem',
              location: 'Section 3',
              impact: 'Low impact'
            }
          ],
          recommendations: [],
          missingElements: [],
          unrealisticSpecifications: [],
          regulatoryIssues: [],
          costAccuracyIssues: [],
          materialImprovements: [],
          timelineIssues: []
        })
      };

      mockPrompt.getPrompt.mockResolvedValue('prompt');
      mockAIAgent.invokeAgent.mockResolvedValue(mockAIResponse);

      // Act
      const result = await service.reviewSoW('project-123', mockSoWDocument, projectType, mockPropertyDetails);

      // Assert
      // Score should be 100 - 20 (critical) - 10 (major) - 5 (minor) = 65
      expect(result.overallScore).toBe(65);
      expect(result.qualityIndicator).toBe('needs_improvement');
    });

    it('should handle AI service errors gracefully', async () => {
      // Arrange
      const projectType: ProjectType = 'kitchen_full_refit';
      mockPrompt.getPrompt.mockResolvedValue('prompt');
      mockAIAgent.invokeAgent.mockRejectedValue(new Error('AI service unavailable'));

      // Act & Assert
      await expect(
        service.reviewSoW('project-123', mockSoWDocument, projectType, mockPropertyDetails)
      ).rejects.toThrow('Failed to review SoW: AI service unavailable');
    });
  });

  describe('applyRecommendations', () => {
    it('should apply selected recommendations to improve SoW', async () => {
      // Arrange
      const selectedRecommendations = ['rec-1', 'rec-2'];
      const mockReviewResults: BuilderReviewAnalysis = {
        overallScore: 75,
        issues: [],
        recommendations: [
          {
            id: 'rec-1',
            issueId: 'issue-1',
            type: 'addition',
            title: 'Add electrical work',
            description: 'Include electrical specifications',
            reasoning: 'Required for appliances',
            priority: 'high'
          },
          {
            id: 'rec-2',
            issueId: 'issue-2',
            type: 'modification',
            title: 'Update timeline',
            description: 'Extend timeline for electrical work',
            reasoning: 'Additional time needed',
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

      const mockImprovedSoW = {
        ...mockSoWDocument,
        version: 1.1,
        sections: [
          ...mockSoWDocument.sections,
          {
            id: 'section-2',
            title: 'Electrical Work',
            description: 'Electrical installations for kitchen',
            specifications: ['Install appliance circuits'],
            dependencies: []
          }
        ]
      };

      // Mock the service methods
      jest.spyOn(service, 'getReviewResults').mockResolvedValue(mockReviewResults);
      mockPrompt.getPrompt.mockResolvedValue('improvement prompt');
      mockAIAgent.invokeAgent.mockResolvedValue({
        content: JSON.stringify(mockImprovedSoW)
      });

      // Act
      const result = await service.applyRecommendations(
        'project-123',
        mockSoWDocument,
        selectedRecommendations
      );

      // Assert
      expect(result.version).toBe(1.1);
      expect(result.sections).toHaveLength(2);
      expect(result.appliedRecommendations).toEqual(selectedRecommendations);
      expect(result.reviewApplied).toBe(true);
    });

    it('should throw error when no review results found', async () => {
      // Arrange
      jest.spyOn(service, 'getReviewResults').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.applyRecommendations('project-123', mockSoWDocument, ['rec-1'])
      ).rejects.toThrow('No review results found for project');
    });
  });

  describe('quality score calculation', () => {
    it('should return excellent quality for score >= 90', () => {
      // Arrange
      const issues = [
        {
          id: 'issue-1',
          category: 'minor' as const,
          severity: 'minor' as const,
          title: 'Minor issue',
          description: 'Small problem',
          location: 'Section 1',
          impact: 'Low'
        }
      ];

      // Act
      const score = (service as any).calculateQualityScore(issues);
      const indicator = (service as any).getQualityIndicator(score);

      // Assert
      expect(score).toBe(95); // 100 - 5 (minor)
      expect(indicator).toBe('excellent');
    });

    it('should return poor quality for score < 50', () => {
      // Arrange
      const issues = [
        {
          id: 'issue-1',
          category: 'critical' as const,
          severity: 'critical' as const,
          title: 'Critical issue 1',
          description: 'Problem 1',
          location: 'Section 1',
          impact: 'High'
        },
        {
          id: 'issue-2',
          category: 'critical' as const,
          severity: 'critical' as const,
          title: 'Critical issue 2',
          description: 'Problem 2',
          location: 'Section 2',
          impact: 'High'
        },
        {
          id: 'issue-3',
          category: 'critical' as const,
          severity: 'critical' as const,
          title: 'Critical issue 3',
          description: 'Problem 3',
          location: 'Section 3',
          impact: 'High'
        }
      ];

      // Act
      const score = (service as any).calculateQualityScore(issues);
      const indicator = (service as any).getQualityIndicator(score);

      // Assert
      expect(score).toBe(40); // 100 - 60 (3 critical issues)
      expect(indicator).toBe('poor');
    });
  });

  describe('agent selection', () => {
    it('should select correct agent for different project types', () => {
      // Test cases for different project types
      const testCases = [
        { projectType: 'loft_conversion_dormer' as ProjectType, expectedAgent: 'structural-conversion' },
        { projectType: 'kitchen_full_refit' as ProjectType, expectedAgent: 'kitchen' },
        { projectType: 'bathroom_full_refit' as ProjectType, expectedAgent: 'bathroom' },
        { projectType: 'rear_extension_single_storey' as ProjectType, expectedAgent: 'extension' },
        { projectType: 'roofing_re_roofing' as ProjectType, expectedAgent: 'roofing' },
        { projectType: 'electrical_rewiring' as ProjectType, expectedAgent: 'electrical' },
        { projectType: 'others' as ProjectType, expectedAgent: 'general' }
      ];

      testCases.forEach(({ projectType, expectedAgent }) => {
        const selectedAgent = (service as any).selectReviewAgent(projectType);
        expect(selectedAgent).toBe(expectedAgent);
      });
    });
  });

  describe('review focus areas', () => {
    it('should return appropriate focus areas for loft conversion', () => {
      // Act
      const focusAreas = (service as any).getReviewFocus('loft_conversion_dormer');

      // Assert
      expect(focusAreas).toContain('structural_calculations');
      expect(focusAreas).toContain('building_regulations');
      expect(focusAreas).toContain('fire_safety');
      expect(focusAreas).toContain('insulation_standards');
    });

    it('should return appropriate focus areas for kitchen renovation', () => {
      // Act
      const focusAreas = (service as any).getReviewFocus('kitchen_full_refit');

      // Assert
      expect(focusAreas).toContain('electrical_safety');
      expect(focusAreas).toContain('plumbing_compliance');
      expect(focusAreas).toContain('ventilation_requirements');
      expect(focusAreas).toContain('gas_safety');
    });
  });
});