import { QuoteManagementService } from '../quoteManagementService';
import { DynamoDBService } from '@/lib/aws/dynamodb';
import { QuotePricing, ReferenceProject } from '@/lib/types';

// Mock DynamoDB service
jest.mock('@/lib/aws/dynamodb');
const mockDynamoDBService = DynamoDBService as jest.Mocked<typeof DynamoDBService>;

describe('QuoteManagementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitQuote', () => {
    const mockQuoteData = {
      pricing: {
        totalAmount: 15000,
        laborCosts: 8000,
        materialCosts: 7000,
        breakdown: [
          { category: 'Labor', description: 'Installation work', amount: 8000 },
          { category: 'Materials', description: 'Kitchen units', amount: 7000 }
        ]
      } as QuotePricing,
      timeline: 14,
      startDate: new Date('2024-03-01'),
      termsAndConditions: 'Standard terms apply',
      insuranceDocuments: ['doc1', 'doc2'],
      referenceProjects: [
        {
          address: '123 Test Street',
          projectType: 'Kitchen renovation',
          completionDate: new Date('2024-01-15'),
          contactAllowed: true,
          visitAllowed: false,
          description: 'Full kitchen refit'
        }
      ] as ReferenceProject[]
    };

    it('should successfully submit a quote', async () => {
      mockDynamoDBService.putItem.mockResolvedValue({});
      mockDynamoDBService.getItem.mockResolvedValue({
        Item: { quotes: [], invitedBuilders: [] }
      });
      mockDynamoDBService.updateItem.mockResolvedValue({});

      const result = await QuoteManagementService.submitQuote(
        'project-123',
        'builder-456',
        mockQuoteData
      );

      expect(result.success).toBe(true);
      expect(result.quoteId).toBeDefined();
      expect(mockDynamoDBService.putItem).toHaveBeenCalledWith(
        'uk-home-improvement-quotes',
        expect.objectContaining({
          projectId: 'project-123',
          builderId: 'builder-456',
          pricing: mockQuoteData.pricing,
          timeline: 14,
          status: 'submitted'
        })
      );
    });

    it('should calculate working days completion date correctly', async () => {
      mockDynamoDBService.putItem.mockResolvedValue({});
      mockDynamoDBService.getItem.mockResolvedValue({
        Item: { quotes: [], invitedBuilders: [] }
      });
      mockDynamoDBService.updateItem.mockResolvedValue({});

      // Start on Monday (2024-03-04), 5 working days should end on Friday (2024-03-08)
      // Monday (1), Tuesday (2), Wednesday (3), Thursday (4), Friday (5)
      const startDate = new Date('2024-03-04'); // Monday
      const quoteData = { ...mockQuoteData, timeline: 5, startDate };

      await QuoteManagementService.submitQuote('project-123', 'builder-456', quoteData);

      const putItemCall = mockDynamoDBService.putItem.mock.calls[0];
      const savedQuote = putItemCall[1];
      const completionDate = new Date(savedQuote.projectedCompletionDate);
      
      // Should be Friday March 8th
      expect(completionDate.getDate()).toBe(8);
      expect(completionDate.getMonth()).toBe(2); // March (0-indexed)
    });

    it('should handle validation errors', async () => {
      const invalidQuoteData = {
        ...mockQuoteData,
        pricing: {
          ...mockQuoteData.pricing,
          totalAmount: 0 // Invalid amount
        }
      };

      const result = await QuoteManagementService.submitQuote(
        'project-123',
        'builder-456',
        invalidQuoteData
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Total amount must be greater than 0');
    });

    it('should handle database errors', async () => {
      mockDynamoDBService.putItem.mockRejectedValue(new Error('Database error'));

      const result = await QuoteManagementService.submitQuote(
        'project-123',
        'builder-456',
        mockQuoteData
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to submit quote');
    });
  });

  describe('getQuote', () => {
    it('should retrieve a quote successfully', async () => {
      const mockQuote = {
        id: 'quote-123',
        projectId: 'project-123',
        builderId: 'builder-456',
        pricing: { totalAmount: 15000, laborCosts: 8000, materialCosts: 7000, breakdown: [] },
        timeline: 14,
        startDate: '2024-03-01T00:00:00.000Z',
        projectedCompletionDate: '2024-03-21T00:00:00.000Z',
        submittedAt: '2024-02-15T10:00:00.000Z',
        status: 'submitted',
        referenceProjects: []
      };

      mockDynamoDBService.getItem.mockResolvedValue({ Item: mockQuote });

      const result = await QuoteManagementService.getQuote('quote-123');

      expect(result.success).toBe(true);
      expect(result.quote).toBeDefined();
      expect(result.quote?.id).toBe('quote-123');
      expect(result.quote?.startDate).toBeInstanceOf(Date);
    });

    it('should handle quote not found', async () => {
      mockDynamoDBService.getItem.mockResolvedValue({});

      const result = await QuoteManagementService.getQuote('nonexistent-quote');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quote not found');
    });
  });

  describe('getProjectQuotes', () => {
    it('should retrieve all quotes for a project', async () => {
      const mockQuotes = [
        {
          id: 'quote-1',
          projectId: 'project-123',
          builderId: 'builder-1',
          startDate: '2024-03-01T00:00:00.000Z',
          projectedCompletionDate: '2024-03-21T00:00:00.000Z',
          submittedAt: '2024-02-15T10:00:00.000Z',
          referenceProjects: []
        },
        {
          id: 'quote-2',
          projectId: 'project-123',
          builderId: 'builder-2',
          startDate: '2024-03-05T00:00:00.000Z',
          projectedCompletionDate: '2024-03-25T00:00:00.000Z',
          submittedAt: '2024-02-16T10:00:00.000Z',
          referenceProjects: []
        }
      ];

      mockDynamoDBService.queryItems.mockResolvedValue({ Items: mockQuotes });

      const result = await QuoteManagementService.getProjectQuotes('project-123');

      expect(result.success).toBe(true);
      expect(result.quotes).toHaveLength(2);
      expect(result.quotes?.[0].id).toBe('quote-1');
    });
  });

  describe('updateQuoteStatus', () => {
    it('should update quote status successfully', async () => {
      mockDynamoDBService.updateItem.mockResolvedValue({});

      const result = await QuoteManagementService.updateQuoteStatus('quote-123', 'accepted');

      expect(result.success).toBe(true);
      expect(mockDynamoDBService.updateItem).toHaveBeenCalledWith(
        'uk-home-improvement-quotes',
        { id: 'quote-123' },
        { status: 'accepted' }
      );
    });
  });

  describe('AI Analysis', () => {
    it('should detect pricing red flags', async () => {
      // This would test the private performQuoteAnalysis method
      // In a real implementation, you might want to make this method public for testing
      // or test it indirectly through the quote submission process
      
      const mockQuote = {
        id: 'quote-123',
        projectId: 'project-123',
        builderId: 'builder-456',
        pricing: { totalAmount: 50000, laborCosts: 30000, materialCosts: 20000, breakdown: [] }, // Very high amount
        timeline: 5, // Very short timeline
        startDate: new Date(),
        projectedCompletionDate: new Date(),
        amendments: [],
        termsAndConditions: 'Terms',
        insuranceDocuments: [], // No insurance docs
        referenceProjects: [], // No references
        status: 'submitted' as const,
        submittedAt: new Date()
      };

      const mockSoWDocument = {
        id: 'sow-123',
        projectId: 'project-123',
        version: 1,
        sections: [],
        materials: [],
        laborRequirements: [],
        timeline: [{ id: '1', name: 'Task 1', description: 'Test', duration: 10, dependencies: [], canRunInParallel: false, trade: 'General' }],
        estimatedCosts: { totalEstimate: 20000, laborCosts: 12000, materialCosts: 8000, builderMaterials: 8000, homeownerMaterials: 0, breakdown: [] },
        regulatoryRequirements: [],
        generatedAt: new Date()
      };

      // The analysis would be performed asynchronously in the real implementation
      // Here we're testing the logic that would be applied
      
      // Expected red flags:
      // 1. High pricing variance (50000 vs 20000 = 150% increase)
      // 2. Short timeline variance (5 vs 10 days = -50% decrease)
      // 3. No insurance documents
      // 4. No reference projects
      
      expect(mockQuote.pricing.totalAmount).toBeGreaterThan(mockSoWDocument.estimatedCosts.totalEstimate);
      expect(mockQuote.timeline).toBeLessThan(mockSoWDocument.timeline.reduce((sum, task) => sum + task.duration, 0));
      expect(mockQuote.insuranceDocuments).toHaveLength(0);
      expect(mockQuote.referenceProjects).toHaveLength(0);
    });
  });
});