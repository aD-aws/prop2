import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

const mockSend = jest.fn();
const mockDynamoClient = {
  send: mockSend
} as unknown as DynamoDBDocumentClient;

// Mock the DynamoDBDocumentClient.from method
(DynamoDBDocumentClient.from as jest.Mock) = jest.fn().mockReturnValue(mockDynamoClient);

// Import after mocking
import { AdminAnalyticsService } from '../adminAnalyticsService';

describe('AdminAnalyticsService', () => {
  let adminAnalyticsService: AdminAnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    adminAnalyticsService = new AdminAnalyticsService(mockDynamoClient);
  });

  describe('getQuoteVarianceMetrics', () => {
    it('should calculate quote variance metrics correctly', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          projectType: 'kitchen-renovation',
          aiEstimate: 15000,
          quotes: [
            { totalAmount: 16000 },
            { totalAmount: 14500 },
            { totalAmount: 15800 }
          ],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'project-2',
          projectType: 'bathroom-renovation',
          aiEstimate: 8000,
          quotes: [
            { totalAmount: 9000 },
            { totalAmount: 8500 }
          ],
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-16T00:00:00Z'
        }
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockProjects
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const result = await adminAnalyticsService.getQuoteVarianceMetrics(startDate, endDate);

      expect(result).toHaveLength(2);
      
      // Check first project metrics
      expect(result[0]).toMatchObject({
        projectId: 'project-1',
        projectType: 'kitchen-renovation',
        aiEstimate: 15000,
        actualQuotes: [16000, 14500, 15800],
        builderCount: 3
      });
      
      // Check average quote with precision
      expect(result[0].averageQuote).toBeCloseTo(15433.33, 2);
      
      // Variance should be approximately 2.89%
      expect(result[0].variancePercentage).toBeCloseTo(2.89, 1);

      // Check second project metrics
      expect(result[1]).toMatchObject({
        projectId: 'project-2',
        projectType: 'bathroom-renovation',
        aiEstimate: 8000,
        actualQuotes: [9000, 8500],
        averageQuote: 8750,
        builderCount: 2
      });
      
      // Variance should be 9.375%
      expect(result[1].variancePercentage).toBeCloseTo(9.375, 2);
    });

    it('should filter by project type when specified', async () => {
      mockSend.mockResolvedValueOnce({
        Items: []
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const result = await adminAnalyticsService.getQuoteVarianceMetrics(startDate, endDate, 'kitchen-renovation');

      expect(result).toEqual([]);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle projects without quotes', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          projectType: 'kitchen-renovation',
          aiEstimate: 15000,
          quotes: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockProjects
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const result = await adminAnalyticsService.getQuoteVarianceMetrics(startDate, endDate);

      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('Database error'));

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      await expect(
        adminAnalyticsService.getQuoteVarianceMetrics(startDate, endDate)
      ).rejects.toThrow('Failed to retrieve quote variance metrics');
    });
  });

  describe('getBuilderPerformanceMetrics', () => {
    it('should calculate builder performance metrics correctly', async () => {
      const mockBuilders = [
        {
          id: 'builder-1',
          companyName: 'ABC Construction',
          name: 'John Smith'
        }
      ];

      const mockQuotes = [
        {
          projectId: 'project-1',
          builderId: 'builder-1',
          status: 'selected',
          totalAmount: 15000,
          varianceFromEstimate: 5.5,
          invitedAt: '2024-01-01T10:00:00Z',
          submittedAt: '2024-01-01T14:00:00Z',
          createdAt: '2024-01-01T14:00:00Z'
        },
        {
          projectId: 'project-2',
          builderId: 'builder-1',
          status: 'rejected',
          totalAmount: 8500,
          varianceFromEstimate: -2.3,
          invitedAt: '2024-01-02T09:00:00Z',
          submittedAt: '2024-01-02T16:00:00Z',
          createdAt: '2024-01-02T16:00:00Z'
        }
      ];

      const mockRatings = [
        {
          builderId: 'builder-1',
          projectId: 'project-1',
          score: 4.5
        }
      ];

      // Mock builder query
      mockSend.mockResolvedValueOnce({
        Items: mockBuilders
      });

      // Mock quotes query
      mockSend.mockResolvedValueOnce({
        Items: mockQuotes
      });

      // Mock ratings query
      mockSend.mockResolvedValueOnce({
        Items: mockRatings
      });

      const result = await adminAnalyticsService.getBuilderPerformanceMetrics('builder-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        builderId: 'builder-1',
        builderName: 'ABC Construction',
        totalProjectsQuoted: 2,
        totalProjectsWon: 1,
        winRate: 50,
        averageQuoteVariance: 1.6, // (5.5 + (-2.3)) / 2
        averageRating: 4.5,
        totalRatings: 1
      });

      // Response time should be average of 4 hours and 7 hours = 5.5 hours
      expect(result[0].responseTime).toBeCloseTo(5.5, 1);
    });

    it('should get all builders when no builderId specified', async () => {
      mockSend.mockResolvedValueOnce({
        Items: []
      });

      const result = await adminAnalyticsService.getBuilderPerformanceMetrics();

      expect(result).toEqual([]);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle builders with no quotes', async () => {
      const mockBuilders = [
        {
          id: 'builder-1',
          companyName: 'ABC Construction'
        }
      ];

      mockSend
        .mockResolvedValueOnce({ Items: mockBuilders })
        .mockResolvedValueOnce({ Items: [] }) // No quotes
        .mockResolvedValueOnce({ Items: [] }); // No ratings

      const result = await adminAnalyticsService.getBuilderPerformanceMetrics('builder-1');

      expect(result[0]).toMatchObject({
        totalProjectsQuoted: 0,
        totalProjectsWon: 0,
        winRate: 0,
        averageQuoteVariance: 0,
        averageRating: 0,
        totalRatings: 0,
        responseTime: 0
      });
    });
  });

  describe('getPlatformUsageMetrics', () => {
    it('should calculate platform usage metrics correctly', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          createdAt: '2024-01-15T00:00:00Z',
          lastLogin: '2024-01-20T00:00:00Z'
        },
        {
          id: 'user-2',
          createdAt: '2023-12-01T00:00:00Z',
          lastLogin: '2024-01-18T00:00:00Z'
        }
      ];

      const mockProjects = [
        {
          id: 'project-1',
          projectType: 'kitchen-renovation',
          status: 'completed',
          quotes: [{ id: 'quote-1' }],
          contractId: 'contract-1',
          finalValue: 15000
        },
        {
          id: 'project-2',
          projectType: 'bathroom-renovation',
          status: 'in-progress',
          quotes: [{ id: 'quote-2' }]
        },
        {
          id: 'project-3',
          projectType: 'kitchen-renovation',
          status: 'planning',
          quotes: []
        }
      ];

      mockSend
        .mockResolvedValueOnce({ Items: mockUsers })
        .mockResolvedValueOnce({ Items: mockProjects });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const result = await adminAnalyticsService.getPlatformUsageMetrics(startDate, endDate);

      expect(result).toMatchObject({
        totalUsers: 2,
        activeUsers: 2, // Both users logged in during period
        newUsersThisMonth: 1, // Only user-1 created in period
        totalProjects: 3,
        completedProjects: 1,
        projectsByType: {
          'kitchen-renovation': 2,
          'bathroom-renovation': 1
        },
        averageProjectValue: 15000 // Only one project has finalValue
      });
      
      // Check conversion rate with precision
      expect(result.conversionRate).toBeCloseTo(66.67, 1);
      expect(result.contractSigningRate).toBeCloseTo(50, 1);
    });

    it('should handle empty data gracefully', async () => {
      mockSend
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const result = await adminAnalyticsService.getPlatformUsageMetrics(startDate, endDate);

      expect(result).toMatchObject({
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        totalProjects: 0,
        completedProjects: 0,
        projectsByType: {},
        conversionRate: 0,
        contractSigningRate: 0,
        averageProjectValue: 0
      });
    });
  });

  describe('getFinancialMetrics', () => {
    it('should calculate financial metrics correctly', async () => {
      const mockPayments = [
        {
          amount: 1000,
          type: 'subscription',
          discountApplied: true,
          discountAmount: 100,
          createdAt: '2024-01-15T00:00:00Z'
        },
        {
          amount: 500,
          type: 'lead_purchase',
          discountApplied: false,
          createdAt: '2024-01-20T00:00:00Z'
        }
      ];

      const mockSubscriptions = [
        {
          status: 'active',
          monthlyAmount: 50
        },
        {
          status: 'active',
          monthlyAmount: 100
        }
      ];

      mockSend
        .mockResolvedValueOnce({ Items: mockPayments })
        .mockResolvedValueOnce({ Items: mockSubscriptions });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const result = await adminAnalyticsService.getFinancialMetrics(startDate, endDate);

      expect(result).toMatchObject({
        totalRevenue: 1500,
        monthlyRecurringRevenue: 150,
        subscriptionRevenue: 1000,
        leadSalesRevenue: 500,
        discountUsage: 100
      });
    });

    it('should handle no payments gracefully', async () => {
      mockSend
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const result = await adminAnalyticsService.getFinancialMetrics(startDate, endDate);

      expect(result).toMatchObject({
        totalRevenue: 0,
        monthlyRecurringRevenue: 0,
        subscriptionRevenue: 0,
        leadSalesRevenue: 0,
        discountUsage: 0
      });
    });
  });

  describe('getProjectsForInvitation', () => {
    it('should return projects with invitation data', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          homeownerId: 'homeowner-1',
          projectType: 'kitchen-renovation',
          postcode: 'SW1A 1AA',
          status: 'planning',
          aiEstimate: 15000,
          createdAt: '2024-01-15T00:00:00Z',
          invitedBuilders: ['builder-1']
        }
      ];

      const mockHomeowner = {
        id: 'homeowner-1',
        name: 'John Doe'
      };

      const mockBuilders = [
        { id: 'builder-1' },
        { id: 'builder-2' }
      ];

      mockSend
        .mockResolvedValueOnce({ Items: mockProjects })
        .mockResolvedValueOnce({ Items: [mockHomeowner] })
        .mockResolvedValueOnce({ Items: mockBuilders });

      const result = await adminAnalyticsService.getProjectsForInvitation();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        projectId: 'project-1',
        homeownerName: 'John Doe',
        projectType: 'kitchen-renovation',
        postcode: 'SW1A 1AA',
        estimatedValue: 15000,
        status: 'planning',
        invitedBuilders: ['builder-1'],
        availableBuilders: ['builder-1', 'builder-2']
      });
    });

    it('should apply filters correctly', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const result = await adminAnalyticsService.getProjectsForInvitation('SW1A', 'kitchen-renovation', 'planning');

      expect(result).toEqual([]);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('inviteBuilderToProject', () => {
    it('should invite builder to project successfully', async () => {
      mockSend.mockResolvedValueOnce({});

      await expect(
        adminAnalyticsService.inviteBuilderToProject('project-1', 'builder-1', 'admin-1')
      ).resolves.not.toThrow();

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle invitation errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        adminAnalyticsService.inviteBuilderToProject('project-1', 'builder-1', 'admin-1')
      ).rejects.toThrow('Failed to invite builder to project');
    });
  });
});