import { QuoteComparisonService } from '../quoteComparisonService';
import { Quote, QuoteAnalysis, RedFlag, SoWDocument, Project } from '@/lib/types';
import { DynamoDBService } from '@/lib/aws/dynamodb';

// Mock DynamoDB service
jest.mock('@/lib/aws/dynamodb');
const mockDynamoDBService = DynamoDBService as jest.Mocked<typeof DynamoDBService>;

describe('QuoteComparisonService', () => {
  const mockProjectId = 'project-123';
  
  const createMockQuote = (overrides: Partial<Quote> = {}): Quote => ({
    id: 'quote-1',
    projectId: mockProjectId,
    builderId: 'builder-1',
    pricing: {
      totalAmount: 25000,
      laborCosts: 15000,
      materialCosts: 10000,
      breakdown: [],
      varianceFromEstimate: 5
    },
    timeline: 30,
    startDate: new Date('2024-03-01'),
    projectedCompletionDate: new Date('2024-04-15'),
    amendments: [],
    termsAndConditions: 'Standard terms',
    insuranceDocuments: [],
    referenceProjects: [],
    status: 'submitted',
    submittedAt: new Date('2024-02-15'),
    aiAnalysis: {
      redFlags: [],
      timelineAnalysis: {
        isRealistic: true,
        comparedToAverage: 0,
        concerns: [],
        recommendations: []
      },
      pricingAnalysis: {
        comparedToEstimate: 5,
        comparedToMarket: 0,
        unusualItems: [],
        recommendations: []
      },
      overallRisk: 'low'
    },
    ...overrides
  });

  const mockSoWDocument: SoWDocument = {
    id: 'sow-1',
    projectId: mockProjectId,
    version: 1,
    sections: [],
    materials: [],
    laborRequirements: [],
    timeline: [
      { id: 'task-1', name: 'Task 1', description: 'Test task', duration: 10, dependencies: [], canRunInParallel: false, trade: 'general' },
      { id: 'task-2', name: 'Task 2', description: 'Test task', duration: 15, dependencies: [], canRunInParallel: false, trade: 'general' }
    ],
    estimatedCosts: {
      totalEstimate: 24000,
      laborCosts: 14000,
      materialCosts: 10000,
      builderMaterials: 6000,
      homeownerMaterials: 4000,
      breakdown: []
    },
    regulatoryRequirements: [],
    generatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('compareQuotes', () => {
    it('should successfully compare multiple quotes', async () => {
      const quotes = [
        createMockQuote({
          id: 'quote-1',
          builderId: 'builder-1',
          pricing: { ...createMockQuote().pricing, totalAmount: 25000 },
          timeline: 30,
          aiAnalysis: { ...createMockQuote().aiAnalysis!, overallRisk: 'low' }
        }),
        createMockQuote({
          id: 'quote-2',
          builderId: 'builder-2',
          pricing: { ...createMockQuote().pricing, totalAmount: 28000 },
          timeline: 25,
          aiAnalysis: { ...createMockQuote().aiAnalysis!, overallRisk: 'medium' }
        }),
        createMockQuote({
          id: 'quote-3',
          builderId: 'builder-3',
          pricing: { ...createMockQuote().pricing, totalAmount: 22000 },
          timeline: 35,
          aiAnalysis: { ...createMockQuote().aiAnalysis!, overallRisk: 'low' }
        })
      ];

      // Mock project data
      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: {
          id: mockProjectId,
          sowDocument: mockSoWDocument,
          projectType: 'kitchen_full_refit'
        } as Project
      });

      // Mock builder profiles
      mockDynamoDBService.getItem
        .mockResolvedValueOnce({ success: true, Item: { id: 'builder-1', completedProjects: 15, rating: 4.5 } })
        .mockResolvedValueOnce({ success: true, Item: { id: 'builder-2', completedProjects: 8, rating: 4.2 } })
        .mockResolvedValueOnce({ success: true, Item: { id: 'builder-3', completedProjects: 20, rating: 4.8 } });

      const result = await QuoteComparisonService.compareQuotes(mockProjectId, quotes);

      expect(result.success).toBe(true);
      expect(result.comparison).toBeDefined();
      
      const comparison = result.comparison!;
      
      // Check price analysis
      expect(comparison.analysis.priceRange.lowest).toBe(22000);
      expect(comparison.analysis.priceRange.highest).toBe(28000);
      expect(comparison.analysis.priceRange.average).toBe(25000);

      // Check timeline analysis
      expect(comparison.analysis.timelineRange.shortest).toBe(25);
      expect(comparison.analysis.timelineRange.longest).toBe(35);

      // Check risk assessment
      expect(comparison.analysis.riskAssessment.lowRisk).toHaveLength(2);
      expect(comparison.analysis.riskAssessment.mediumRisk).toHaveLength(1);
      expect(comparison.analysis.riskAssessment.highRisk).toHaveLength(0);

      // Check recommendations
      expect(comparison.recommendations).toBeDefined();
      expect(comparison.negotiationTips).toBeDefined();
      expect(comparison.questionsToAsk).toBeDefined();
      expect(comparison.redFlagSummary).toBeDefined();
    });

    it('should return error for insufficient quotes', async () => {
      const quotes = [createMockQuote()];

      const result = await QuoteComparisonService.compareQuotes(mockProjectId, quotes);

      expect(result.success).toBe(false);
      expect(result.error).toBe('At least 2 quotes required for comparison');
    });

    it('should generate price variance recommendations', async () => {
      const quotes = [
        createMockQuote({
          id: 'quote-1',
          pricing: { ...createMockQuote().pricing, totalAmount: 20000 }
        }),
        createMockQuote({
          id: 'quote-2',
          pricing: { ...createMockQuote().pricing, totalAmount: 35000 }
        })
      ];

      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: { id: mockProjectId, sowDocument: mockSoWDocument }
      });

      mockDynamoDBService.getItem
        .mockResolvedValueOnce({ Item: { id: 'builder-1' } })
        .mockResolvedValueOnce({ Item: { id: 'builder-2' } });

      const result = await QuoteComparisonService.compareQuotes(mockProjectId, quotes);

      expect(result.success).toBe(true);
      
      const priceVarianceRec = result.comparison!.recommendations.find(
        rec => rec.type === 'pricing' && rec.title.includes('Price Variation')
      );
      
      expect(priceVarianceRec).toBeDefined();
      expect(priceVarianceRec!.priority).toBe('high');
    });

    it('should generate timeline variance recommendations', async () => {
      const quotes = [
        createMockQuote({
          id: 'quote-1',
          timeline: 20
        }),
        createMockQuote({
          id: 'quote-2',
          timeline: 50
        })
      ];

      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: { id: mockProjectId, sowDocument: mockSoWDocument }
      });

      mockDynamoDBService.getItem
        .mockResolvedValueOnce({ Item: { id: 'builder-1' } })
        .mockResolvedValueOnce({ Item: { id: 'builder-2' } });

      const result = await QuoteComparisonService.compareQuotes(mockProjectId, quotes);

      expect(result.success).toBe(true);
      
      const timelineVarianceRec = result.comparison!.recommendations.find(
        rec => rec.type === 'timeline' && rec.title.includes('Timeline Differences')
      );
      
      expect(timelineVarianceRec).toBeDefined();
      expect(timelineVarianceRec!.priority).toBe('high');
    });

    it('should identify high-risk quotes', async () => {
      const redFlags: RedFlag[] = [
        {
          type: 'pricing',
          severity: 'high',
          description: 'Quote significantly below market rate',
          recommendation: 'Verify all work is included'
        }
      ];

      const quotes = [
        createMockQuote({
          id: 'quote-1',
          aiAnalysis: {
            ...createMockQuote().aiAnalysis!,
            overallRisk: 'high',
            redFlags
          }
        }),
        createMockQuote({
          id: 'quote-2',
          aiAnalysis: { ...createMockQuote().aiAnalysis!, overallRisk: 'low' }
        })
      ];

      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: { id: mockProjectId, sowDocument: mockSoWDocument }
      });

      mockDynamoDBService.getItem
        .mockResolvedValueOnce({ Item: { id: 'builder-1' } })
        .mockResolvedValueOnce({ Item: { id: 'builder-2' } });

      const result = await QuoteComparisonService.compareQuotes(mockProjectId, quotes);

      expect(result.success).toBe(true);
      expect(result.comparison!.analysis.riskAssessment.highRisk).toContain('quote-1');
      
      const riskRec = result.comparison!.recommendations.find(
        rec => rec.type === 'risk' && rec.title.includes('High-Risk')
      );
      
      expect(riskRec).toBeDefined();
      expect(riskRec!.priority).toBe('high');
    });

    it('should recommend experienced builders', async () => {
      const quotes = [
        createMockQuote({ id: 'quote-1', builderId: 'builder-1' }),
        createMockQuote({ id: 'quote-2', builderId: 'builder-2' })
      ];

      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: { id: mockProjectId, sowDocument: mockSoWDocument }
      });

      // Mock experienced builder
      mockDynamoDBService.getItem
        .mockResolvedValueOnce({ 
          Item: { 
            id: 'builder-1', 
            completedProjects: 15, 
            rating: 4.5 
          } 
        })
        .mockResolvedValueOnce({ 
          Item: { 
            id: 'builder-2', 
            completedProjects: 5, 
            rating: 3.8 
          } 
        });

      const result = await QuoteComparisonService.compareQuotes(mockProjectId, quotes);

      expect(result.success).toBe(true);
      
      const experienceRec = result.comparison!.recommendations.find(
        rec => rec.type === 'quality' && rec.title.includes('Experienced Builders')
      );
      
      expect(experienceRec).toBeDefined();
      expect(experienceRec!.priority).toBe('medium');
    });

    it('should generate appropriate negotiation tips', async () => {
      const quotes = [
        createMockQuote({
          pricing: { ...createMockQuote().pricing, totalAmount: 20000 },
          timeline: 20
        }),
        createMockQuote({
          pricing: { ...createMockQuote().pricing, totalAmount: 35000 },
          timeline: 40
        })
      ];

      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: { id: mockProjectId, sowDocument: mockSoWDocument }
      });

      mockDynamoDBService.getItem
        .mockResolvedValueOnce({ Item: { id: 'builder-1' } })
        .mockResolvedValueOnce({ Item: { id: 'builder-2' } });

      const result = await QuoteComparisonService.compareQuotes(mockProjectId, quotes);

      expect(result.success).toBe(true);
      expect(result.comparison!.negotiationTips).toBeDefined();
      expect(result.comparison!.negotiationTips.length).toBeGreaterThan(4); // Base tips + specific tips

      // Should include specific tips for price and timeline variance
      const priceTip = result.comparison!.negotiationTips.find(
        tip => tip.category === 'pricing' && tip.tip.includes('varied pricing')
      );
      expect(priceTip).toBeDefined();

      const timelineTip = result.comparison!.negotiationTips.find(
        tip => tip.category === 'timeline' && tip.tip.includes('timelines vary significantly')
      );
      expect(timelineTip).toBeDefined();
    });

    it('should generate project-specific questions', async () => {
      const quotes = [
        createMockQuote(),
        createMockQuote({ id: 'quote-2' })
      ];

      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: { 
          id: mockProjectId, 
          sowDocument: mockSoWDocument,
          projectType: 'loft_conversion_dormer'
        }
      });

      mockDynamoDBService.getItem
        .mockResolvedValueOnce({ Item: { id: 'builder-1' } })
        .mockResolvedValueOnce({ Item: { id: 'builder-2' } });

      const result = await QuoteComparisonService.compareQuotes(mockProjectId, quotes);

      expect(result.success).toBe(true);
      expect(result.comparison!.questionsToAsk).toBeDefined();
      
      // Should include structural work specific questions for loft conversion
      const structuralCategory = result.comparison!.questionsToAsk.find(
        category => category.category === 'Structural Work Specific'
      );
      expect(structuralCategory).toBeDefined();
      expect(structuralCategory!.questions.length).toBeGreaterThan(0);
    });

    it('should correctly summarize red flags', async () => {
      const redFlags1: RedFlag[] = [
        { type: 'pricing', severity: 'high', description: 'High severity issue', recommendation: 'Fix it' },
        { type: 'timeline', severity: 'medium', description: 'Medium severity issue', recommendation: 'Check it' }
      ];

      const redFlags2: RedFlag[] = [
        { type: 'documentation', severity: 'low', description: 'Low severity issue', recommendation: 'Note it' }
      ];

      const quotes = [
        createMockQuote({
          id: 'quote-1',
          builderId: 'builder-1',
          aiAnalysis: { ...createMockQuote().aiAnalysis!, redFlags: redFlags1 }
        }),
        createMockQuote({
          id: 'quote-2',
          builderId: 'builder-2',
          aiAnalysis: { ...createMockQuote().aiAnalysis!, redFlags: redFlags2 }
        })
      ];

      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: { id: mockProjectId, sowDocument: mockSoWDocument }
      });

      mockDynamoDBService.getItem
        .mockResolvedValueOnce({ Item: { id: 'builder-1' } })
        .mockResolvedValueOnce({ Item: { id: 'builder-2' } });

      const result = await QuoteComparisonService.compareQuotes(mockProjectId, quotes);

      expect(result.success).toBe(true);
      
      const summary = result.comparison!.redFlagSummary;
      expect(summary.totalFlags).toBe(3);
      expect(summary.highSeverity).toBe(1);
      expect(summary.mediumSeverity).toBe(1);
      expect(summary.lowSeverity).toBe(1);
      expect(summary.flagsByBuilder['builder-1']).toEqual(redFlags1);
      expect(summary.flagsByBuilder['builder-2']).toEqual(redFlags2);
    });

    it('should handle missing project data gracefully', async () => {
      const quotes = [
        createMockQuote(),
        createMockQuote({ id: 'quote-2' })
      ];

      mockDynamoDBService.getItem.mockResolvedValueOnce({
        Item: null
      });

      mockDynamoDBService.getItem
        .mockResolvedValueOnce({ Item: { id: 'builder-1' } })
        .mockResolvedValueOnce({ Item: { id: 'builder-2' } });

      const result = await QuoteComparisonService.compareQuotes(mockProjectId, quotes);

      expect(result.success).toBe(true);
      expect(result.comparison).toBeDefined();
    });

    it('should handle database errors', async () => {
      const quotes = [
        createMockQuote(),
        createMockQuote({ id: 'quote-2' })
      ];

      mockDynamoDBService.getItem.mockRejectedValueOnce(new Error('Database error'));

      const result = await QuoteComparisonService.compareQuotes(mockProjectId, quotes);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to compare quotes');
    });
  });
});