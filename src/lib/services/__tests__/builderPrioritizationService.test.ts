import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { BuilderPrioritizationService } from '../builderPrioritizationService';
import { feedbackService } from '../feedbackService';
import { BuilderProfile, BuilderRating, ProjectType } from '../../types';

// Mock dependencies
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('../feedbackService');

describe('BuilderPrioritizationService', () => {
  let builderPrioritizationService: BuilderPrioritizationService;
  let mockDocClient: {
    send: jest.Mock;
  };
  let mockFeedbackService: {
    getBuilderRating: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDocClient = {
      send: jest.fn()
    };

    mockFeedbackService = {
      getBuilderRating: jest.fn()
    };

    // Mock the DynamoDB client
    (DynamoDBDocumentClient.from as jest.Mock).mockReturnValue(mockDocClient);
    
    // Mock the feedback service
    Object.assign(feedbackService, mockFeedbackService);

    builderPrioritizationService = new BuilderPrioritizationService();
  });

  describe('getPrioritizedBuilders', () => {
    it('should return prioritized builders list', async () => {
      const postcode = 'SW1A 1AA';
      const projectType: ProjectType = 'kitchen_full_refit';

      const mockBuilders: BuilderProfile[] = [
        {
          id: 'builder-1',
          firstName: 'John',
          lastName: 'Smith',
          companyName: 'Smith Construction',
          companiesHouseNumber: '12345678',
          insuranceDocuments: [],
          vettingStatus: 'approved',
          specializations: ['kitchen_full_refit'],
          serviceAreas: ['SW1A'],
          rating: 4.5,
          completedProjects: 25
        },
        {
          id: 'builder-2',
          firstName: 'Jane',
          lastName: 'Doe',
          companyName: 'Doe Builders',
          companiesHouseNumber: '87654321',
          insuranceDocuments: [],
          vettingStatus: 'approved',
          specializations: ['kitchen_full_refit'],
          serviceAreas: ['SW1A'],
          rating: 4.8,
          completedProjects: 40
        }
      ];

      const mockRating1: BuilderRating = {
        builderId: 'builder-1',
        overallRating: 4.5,
        totalReviews: 15,
        qualityAverage: 4.6,
        timelinessAverage: 4.3,
        communicationAverage: 4.7,
        cleanlinessAverage: 4.4,
        professionalismAverage: 4.8,
        valueForMoneyAverage: 4.2,
        recommendationPercentage: 85,
        recentFeedback: [],
        ratingDistribution: {
          fiveStars: 8,
          fourStars: 5,
          threeStars: 2,
          twoStars: 0,
          oneStar: 0
        },
        lastUpdated: new Date()
      };

      const mockRating2: BuilderRating = {
        builderId: 'builder-2',
        overallRating: 4.8,
        totalReviews: 25,
        qualityAverage: 4.9,
        timelinessAverage: 4.7,
        communicationAverage: 4.8,
        cleanlinessAverage: 4.8,
        professionalismAverage: 4.9,
        valueForMoneyAverage: 4.6,
        recommendationPercentage: 95,
        recentFeedback: [],
        ratingDistribution: {
          fiveStars: 20,
          fourStars: 4,
          threeStars: 1,
          twoStars: 0,
          oneStar: 0
        },
        lastUpdated: new Date()
      };

      // Mock DynamoDB query for builders
      mockDocClient.send.mockResolvedValue({
        Items: mockBuilders
      });

      // Mock feedback service calls
      mockFeedbackService.getBuilderRating
        .mockResolvedValueOnce(mockRating1)
        .mockResolvedValueOnce(mockRating2);

      const result = await builderPrioritizationService.getPrioritizedBuilders(
        postcode,
        projectType,
        10
      );

      expect(result).toHaveLength(2);
      expect(result[0].builderId).toBe('builder-2'); // Higher rated builder should be first
      expect(result[0].priority).toBeGreaterThan(result[1].priority);
      expect(result[0].rating).toBe(4.8);
      expect(result[1].rating).toBe(4.5);
    });

    it('should handle builders with no ratings', async () => {
      const postcode = 'SW1A 1AA';
      const projectType: ProjectType = 'kitchen_full_refit';

      const mockBuilders: BuilderProfile[] = [
        {
          id: 'builder-new',
          firstName: 'New',
          lastName: 'Builder',
          companyName: 'New Construction',
          companiesHouseNumber: '11111111',
          insuranceDocuments: [],
          vettingStatus: 'approved',
          specializations: ['kitchen_full_refit'],
          serviceAreas: ['SW1A']
        }
      ];

      mockDocClient.send.mockResolvedValue({
        Items: mockBuilders
      });

      // Mock no rating found
      mockFeedbackService.getBuilderRating.mockResolvedValue(null);

      const result = await builderPrioritizationService.getPrioritizedBuilders(
        postcode,
        projectType,
        10
      );

      expect(result).toHaveLength(1);
      expect(result[0].builderId).toBe('builder-new');
      expect(result[0].rating).toBe(0);
      expect(result[0].totalReviews).toBe(0);
      expect(result[0].priority).toBeGreaterThan(0); // Should still have some priority
    });

    it('should handle empty builders list', async () => {
      const postcode = 'SW1A 1AA';
      const projectType: ProjectType = 'kitchen_full_refit';

      mockDocClient.send.mockResolvedValue({
        Items: []
      });

      const result = await builderPrioritizationService.getPrioritizedBuilders(
        postcode,
        projectType,
        10
      );

      expect(result).toHaveLength(0);
    });

    it('should handle DynamoDB errors gracefully', async () => {
      const postcode = 'SW1A 1AA';
      const projectType: ProjectType = 'kitchen_full_refit';

      mockDocClient.send.mockRejectedValue(new Error('DynamoDB error'));

      await expect(builderPrioritizationService.getPrioritizedBuilders(postcode, projectType))
        .rejects.toThrow('Failed to get prioritized builders');
    });

    it('should limit results to maxBuilders parameter', async () => {
      const postcode = 'SW1A 1AA';
      const projectType: ProjectType = 'kitchen_full_refit';

      // Create 5 mock builders
      const mockBuilders: BuilderProfile[] = Array.from({ length: 5 }, (_, i) => ({
        id: `builder-${i}`,
        firstName: `Builder${i}`,
        lastName: 'Test',
        companyName: `Test Construction ${i}`,
        companiesHouseNumber: `1234567${i}`,
        insuranceDocuments: [],
        vettingStatus: 'approved',
        specializations: ['kitchen_full_refit'],
        serviceAreas: ['SW1A']
      }));

      mockDocClient.send.mockResolvedValue({
        Items: mockBuilders
      });

      // Mock ratings for all builders
      mockFeedbackService.getBuilderRating.mockResolvedValue({
        builderId: 'test',
        overallRating: 4.0,
        totalReviews: 10,
        qualityAverage: 4.0,
        timelinessAverage: 4.0,
        communicationAverage: 4.0,
        cleanlinessAverage: 4.0,
        professionalismAverage: 4.0,
        valueForMoneyAverage: 4.0,
        recommendationPercentage: 80,
        recentFeedback: [],
        ratingDistribution: {
          fiveStars: 5,
          fourStars: 3,
          threeStars: 2,
          twoStars: 0,
          oneStar: 0
        },
        lastUpdated: new Date()
      });

      const result = await builderPrioritizationService.getPrioritizedBuilders(
        postcode,
        projectType,
        3 // Limit to 3 builders
      );

      expect(result).toHaveLength(3);
    });
  });

  describe('getBuilderPriorityExplanation', () => {
    it('should return priority score breakdown', async () => {
      const builderId = 'builder-123';

      const mockBuilder: BuilderProfile = {
        id: builderId,
        firstName: 'Test',
        lastName: 'Builder',
        companyName: 'Test Construction',
        companiesHouseNumber: '12345678',
        insuranceDocuments: [],
        vettingStatus: 'approved',
        specializations: ['kitchen_full_refit'],
        serviceAreas: ['SW1A']
      };

      const mockRating: BuilderRating = {
        builderId,
        overallRating: 4.5,
        totalReviews: 20,
        qualityAverage: 4.6,
        timelinessAverage: 4.3,
        communicationAverage: 4.7,
        cleanlinessAverage: 4.4,
        professionalismAverage: 4.8,
        valueForMoneyAverage: 4.2,
        recommendationPercentage: 90,
        recentFeedback: [],
        ratingDistribution: {
          fiveStars: 12,
          fourStars: 6,
          threeStars: 2,
          twoStars: 0,
          oneStar: 0
        },
        lastUpdated: new Date()
      };

      // Mock builder profile query
      mockDocClient.send.mockResolvedValue({
        Items: [mockBuilder]
      });

      // Mock rating query
      mockFeedbackService.getBuilderRating.mockResolvedValue(mockRating);

      const result = await builderPrioritizationService.getBuilderPriorityExplanation(builderId);

      expect(result).toBeDefined();
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.rating).toBeGreaterThan(0);
      expect(result.breakdown.responseTime).toBeGreaterThan(0);
      expect(result.breakdown.acceptanceRate).toBeGreaterThan(0);
      expect(result.breakdown.completionRate).toBeGreaterThan(0);
      expect(result.breakdown.activity).toBeGreaterThan(0);
    });

    it('should handle builder not found', async () => {
      const builderId = 'nonexistent-builder';

      mockDocClient.send.mockResolvedValue({
        Items: []
      });

      await expect(builderPrioritizationService.getBuilderPriorityExplanation(builderId))
        .rejects.toThrow('Builder not found');
    });
  });

  describe('updateBuilderMetrics', () => {
    it('should update builder metrics successfully', async () => {
      const builderId = 'builder-123';
      const action = 'accepted';
      const responseTime = 8;

      // Should not throw an error
      await expect(builderPrioritizationService.updateBuilderMetrics(builderId, action, responseTime))
        .resolves.not.toThrow();
    });

    it('should handle different action types', async () => {
      const builderId = 'builder-123';

      const actions: Array<'offered' | 'accepted' | 'rejected' | 'completed'> = [
        'offered',
        'accepted', 
        'rejected',
        'completed'
      ];

      for (const action of actions) {
        await expect(builderPrioritizationService.updateBuilderMetrics(builderId, action))
          .resolves.not.toThrow();
      }
    });
  });
});