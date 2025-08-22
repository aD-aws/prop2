import { builderAnalyticsService, initializeClient } from '../builderAnalyticsService';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('../aiService');

const mockSend = jest.fn();
const mockClient = {
  send: mockSend
} as unknown as DynamoDBDocumentClient;

describe('BuilderAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Initialize the service with our mock client
    initializeClient(mockClient);
  });

  describe('getBuilderAnalytics', () => {
    it('should throw error when builder has no subscription', async () => {
      // Mock subscription check - no subscription
      mockSend.mockResolvedValueOnce({
        Items: []
      });

      await expect(builderAnalyticsService.getBuilderAnalytics('builder-123'))
        .rejects.toThrow('Analytics access requires active subscription');
    });

    it('should throw error when builder subscription is expired', async () => {
      // Mock subscription check - expired subscription
      mockSend.mockResolvedValueOnce({
        Items: [{
          builderId: 'builder-123',
          status: 'active',
          tier: 'premium',
          expiryDate: '2023-01-01T00:00:00Z' // Expired
        }]
      });

      await expect(builderAnalyticsService.getBuilderAnalytics('builder-123'))
        .rejects.toThrow('Analytics access requires active subscription');
    });

    it('should throw error when builder has basic subscription without analytics', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      // Mock subscription check - basic tier without analytics
      mockSend.mockResolvedValueOnce({
        Items: [{
          builderId: 'builder-123',
          status: 'active',
          tier: 'basic',
          expiryDate: futureDate.toISOString()
        }]
      });

      await expect(builderAnalyticsService.getBuilderAnalytics('builder-123'))
        .rejects.toThrow('Analytics access requires active subscription');
    });

    it('should return analytics for builder with premium subscription', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      // Mock subscription check - premium subscription
      mockSend
        .mockResolvedValueOnce({
          Items: [{
            builderId: 'builder-123',
            status: 'active',
            tier: 'premium',
            expiryDate: futureDate.toISOString()
          }]
        })
        // Mock quotes query
        .mockResolvedValueOnce({
          Items: [
            {
              quoteId: 'quote-1',
              builderId: 'builder-123',
              projectId: 'project-1',
              status: 'selected',
              pricing: { totalAmount: 15000 },
              timeline: 14,
              createdAt: '2024-01-01T10:00:00Z',
              submittedAt: '2024-01-01T12:00:00Z',
              selectedAt: '2024-01-15T10:00:00Z',
              qualityScore: 8,
              builderRating: 4.5
            }
          ]
        })
        // Mock project query
        .mockResolvedValueOnce({
          Items: [{
            projectId: 'project-1',
            projectType: 'Kitchen Renovation',
            propertyId: 'property-1',
            estimatedValue: 16000
          }]
        })
        // Mock property query
        .mockResolvedValueOnce({
          Items: [{
            propertyId: 'property-1',
            address: {
              city: 'London',
              county: 'Greater London',
              postcode: 'SW1A 1AA'
            }
          }]
        })
        // Mock competitor quotes query
        .mockResolvedValueOnce({
          Items: [
            {
              quoteId: 'quote-1',
              builderId: 'builder-123',
              timeline: 14
            },
            {
              quoteId: 'quote-2',
              builderId: 'builder-456',
              timeline: 18
            }
          ]
        });

      const result = await builderAnalyticsService.getBuilderAnalytics('builder-123');

      expect(result).toBeDefined();
      expect(result.builderId).toBe('builder-123');
      expect(result.subscriptionStatus).toBe('active');
      expect(result.analyticsAccess).toBe(true);
      expect(result.geographicAnalytics).toBeDefined();
      expect(result.categoryAnalytics).toBeDefined();
      expect(result.aiInsights).toBeDefined();
    });

    it('should handle empty project win data gracefully', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      // Mock subscription check - premium subscription
      mockSend
        .mockResolvedValueOnce({
          Items: [{
            builderId: 'builder-123',
            status: 'active',
            tier: 'premium',
            expiryDate: futureDate.toISOString()
          }]
        })
        // Mock quotes query - no quotes
        .mockResolvedValueOnce({
          Items: []
        });

      const result = await builderAnalyticsService.getBuilderAnalytics('builder-123');

      expect(result).toBeDefined();
      expect(result.geographicAnalytics).toHaveLength(0);
      expect(result.categoryAnalytics).toHaveLength(0);
      expect(result.aiInsights).toBeDefined();
    });
  });

  describe('Geographic Analytics', () => {
    it('should group projects by postcode area correctly', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      // Mock data for multiple geographic areas
      mockSend
        .mockResolvedValueOnce({
          Items: [{
            builderId: 'builder-123',
            status: 'active',
            tier: 'premium',
            expiryDate: futureDate.toISOString()
          }]
        })
        .mockResolvedValueOnce({
          Items: [
            {
              quoteId: 'quote-1',
              builderId: 'builder-123',
              projectId: 'project-1',
              status: 'selected',
              pricing: { totalAmount: 15000 },
              timeline: 14,
              createdAt: '2024-01-01T10:00:00Z',
              submittedAt: '2024-01-01T12:00:00Z'
            },
            {
              quoteId: 'quote-2',
              builderId: 'builder-123',
              projectId: 'project-2',
              status: 'selected',
              pricing: { totalAmount: 25000 },
              timeline: 21,
              createdAt: '2024-01-02T10:00:00Z',
              submittedAt: '2024-01-02T11:00:00Z'
            }
          ]
        })
        // Mock project queries
        .mockResolvedValueOnce({
          Items: [{
            projectId: 'project-1',
            projectType: 'Kitchen Renovation',
            propertyId: 'property-1'
          }]
        })
        .mockResolvedValueOnce({
          Items: [{
            propertyId: 'property-1',
            address: {
              city: 'London',
              county: 'Greater London',
              postcode: 'SW1A 1AA'
            }
          }]
        })
        .mockResolvedValueOnce({
          Items: [{ quoteId: 'quote-1', builderId: 'builder-123' }]
        })
        .mockResolvedValueOnce({
          Items: [{
            projectId: 'project-2',
            projectType: 'Bathroom Renovation',
            propertyId: 'property-2'
          }]
        })
        .mockResolvedValueOnce({
          Items: [{
            propertyId: 'property-2',
            address: {
              city: 'Manchester',
              county: 'Greater Manchester',
              postcode: 'M1 1AA'
            }
          }]
        })
        .mockResolvedValueOnce({
          Items: [{ quoteId: 'quote-2', builderId: 'builder-123' }]
        });

      const result = await builderAnalyticsService.getBuilderAnalytics('builder-123');

      expect(result.geographicAnalytics).toHaveLength(2);
      
      const sw1Area = result.geographicAnalytics.find(g => g.postcode === 'SW1A');
      const m1Area = result.geographicAnalytics.find(g => g.postcode === 'M1');
      
      expect(sw1Area).toBeDefined();
      expect(m1Area).toBeDefined();
      expect(sw1Area?.wonProjects).toBe(1);
      expect(m1Area?.wonProjects).toBe(1);
    });
  });

  describe('Category Analytics', () => {
    it('should categorize projects correctly', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      mockSend
        .mockResolvedValueOnce({
          Items: [{
            builderId: 'builder-123',
            status: 'active',
            tier: 'premium',
            expiryDate: futureDate.toISOString()
          }]
        })
        .mockResolvedValueOnce({
          Items: [
            {
              quoteId: 'quote-1',
              builderId: 'builder-123',
              projectId: 'project-1',
              status: 'selected',
              pricing: { totalAmount: 15000 },
              timeline: 14,
              createdAt: '2024-01-01T10:00:00Z',
              submittedAt: '2024-01-01T12:00:00Z',
              qualityScore: 8,
              builderRating: 4.5
            }
          ]
        })
        .mockResolvedValueOnce({
          Items: [{
            projectId: 'project-1',
            projectType: 'Kitchen Renovation',
            propertyId: 'property-1'
          }]
        })
        .mockResolvedValueOnce({
          Items: [{
            propertyId: 'property-1',
            address: {
              postcode: 'SW1A 1AA',
              city: 'London',
              county: 'Greater London'
            }
          }]
        })
        .mockResolvedValueOnce({
          Items: [{ quoteId: 'quote-1', builderId: 'builder-123' }]
        });

      const result = await builderAnalyticsService.getBuilderAnalytics('builder-123');

      expect(result.categoryAnalytics).toHaveLength(1);
      expect(result.categoryAnalytics[0].category).toBe('Kitchen');
      expect(result.categoryAnalytics[0].wonProjects).toBe(1);
      expect(result.categoryAnalytics[0].projectTypes).toContain('Kitchen Renovation');
    });
  });

  describe('AI Insights', () => {
    it('should generate fallback insights when AI service fails', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      mockSend
        .mockResolvedValueOnce({
          Items: [{
            builderId: 'builder-123',
            status: 'active',
            tier: 'premium',
            expiryDate: futureDate.toISOString()
          }]
        })
        .mockResolvedValueOnce({
          Items: [
            {
              quoteId: 'quote-1',
              builderId: 'builder-123',
              projectId: 'project-1',
              status: 'selected',
              pricing: { totalAmount: 15000 },
              timeline: 14,
              createdAt: '2024-01-01T10:00:00Z',
              submittedAt: '2024-01-01T12:00:00Z',
              qualityScore: 8,
              builderRating: 4.5
            }
          ]
        })
        .mockResolvedValueOnce({
          Items: [{
            projectId: 'project-1',
            projectType: 'Kitchen Renovation',
            propertyId: 'property-1'
          }]
        })
        .mockResolvedValueOnce({
          Items: [{
            propertyId: 'property-1',
            address: {
              postcode: 'SW1A 1AA',
              city: 'London',
              county: 'Greater London'
            }
          }]
        })
        .mockResolvedValueOnce({
          Items: [{ quoteId: 'quote-1', builderId: 'builder-123' }]
        });

      const result = await builderAnalyticsService.getBuilderAnalytics('builder-123');

      expect(result.aiInsights).toBeDefined();
      expect(result.aiInsights.overallPerformance).toBeDefined();
      expect(result.aiInsights.competitiveAdvantages).toBeDefined();
      expect(result.aiInsights.successPatterns).toBeDefined();
      expect(result.aiInsights.recommendations).toBeDefined();
      expect(result.aiInsights.marketOpportunities).toBeDefined();
    });

    it('should identify competitive advantages correctly', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      mockSend
        .mockResolvedValueOnce({
          Items: [{
            builderId: 'builder-123',
            status: 'active',
            tier: 'premium',
            expiryDate: futureDate.toISOString()
          }]
        })
        .mockResolvedValueOnce({
          Items: [
            {
              quoteId: 'quote-1',
              builderId: 'builder-123',
              projectId: 'project-1',
              status: 'selected',
              pricing: { totalAmount: 15000 },
              timeline: 14,
              createdAt: '2024-01-01T10:00:00Z',
              submittedAt: '2024-01-01T11:00:00Z', // 1 hour response time
              qualityScore: 9,
              builderRating: 4.8
            }
          ]
        })
        .mockResolvedValueOnce({
          Items: [{
            projectId: 'project-1',
            projectType: 'Kitchen Renovation',
            propertyId: 'property-1'
          }]
        })
        .mockResolvedValueOnce({
          Items: [{
            propertyId: 'property-1',
            address: {
              postcode: 'SW1A 1AA',
              city: 'London',
              county: 'Greater London'
            }
          }]
        })
        .mockResolvedValueOnce({
          Items: [
            { quoteId: 'quote-1', builderId: 'builder-123', timeline: 14 },
            { quoteId: 'quote-2', builderId: 'builder-456', timeline: 20 }
          ]
        });

      const result = await builderAnalyticsService.getBuilderAnalytics('builder-123');

      expect(result.aiInsights.competitiveAdvantages).toContainEqual(
        expect.objectContaining({
          factor: 'Response Time',
          impact: 'high'
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle DynamoDB errors gracefully', async () => {
      // First call (subscription check) should fail with DynamoDB error
      mockSend.mockRejectedValueOnce(new Error('DynamoDB connection failed'));

      await expect(builderAnalyticsService.getBuilderAnalytics('builder-123'))
        .rejects.toThrow('Analytics access requires active subscription');
    });

    it('should handle missing data gracefully', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      mockSend
        .mockResolvedValueOnce({
          Items: [{
            builderId: 'builder-123',
            status: 'active',
            tier: 'premium',
            expiryDate: futureDate.toISOString()
          }]
        })
        .mockResolvedValueOnce({
          Items: [
            {
              quoteId: 'quote-1',
              builderId: 'builder-123',
              projectId: 'project-1',
              status: 'selected',
              pricing: { totalAmount: 15000 }
              // Missing other fields
            }
          ]
        })
        .mockResolvedValueOnce({
          Items: [] // No project found
        });

      const result = await builderAnalyticsService.getBuilderAnalytics('builder-123');

      expect(result).toBeDefined();
      expect(result.geographicAnalytics).toHaveLength(0);
      expect(result.categoryAnalytics).toHaveLength(0);
    });
  });
});