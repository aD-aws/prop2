import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { FeedbackService } from '../feedbackService';
import { ProjectFeedback, FeedbackSubmissionRequest } from '../../types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@aws-sdk/client-s3');

describe('FeedbackService', () => {
  let feedbackService: FeedbackService;
  let mockDocClient: {
    send: jest.Mock;
  };
  let mockS3Client: {
    send: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDocClient = {
      send: jest.fn()
    };
    
    mockS3Client = {
      send: jest.fn()
    };

    // Mock the DynamoDB and S3 clients
    (DynamoDBDocumentClient.from as jest.Mock).mockReturnValue(mockDocClient);
    (S3Client as jest.Mock).mockImplementation(() => mockS3Client);

    feedbackService = new FeedbackService();
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully with photos', async () => {
      const homeownerId = 'homeowner-123';
      const builderId = 'builder-456';
      const feedbackRequest: FeedbackSubmissionRequest = {
        projectId: 'project-789',
        rating: 5,
        overallSatisfaction: 5,
        qualityRating: 5,
        timelinessRating: 4,
        communicationRating: 5,
        cleanlinessRating: 4,
        professionalismRating: 5,
        valueForMoneyRating: 4,
        writtenFeedback: 'Excellent work, very professional',
        wouldRecommend: true,
        isPublic: true,
        photos: [
          new File(['photo1'], 'photo1.jpg', { type: 'image/jpeg' }),
          new File(['photo2'], 'photo2.jpg', { type: 'image/jpeg' })
        ] as File[]
      };

      // Mock S3 upload success
      mockS3Client.send.mockResolvedValue({});
      
      // Mock DynamoDB put success
      mockDocClient.send.mockResolvedValue({});

      const result = await feedbackService.submitFeedback(homeownerId, builderId, feedbackRequest);

      expect(result).toBeDefined();
      expect(result.projectId).toBe(feedbackRequest.projectId);
      expect(result.homeownerId).toBe(homeownerId);
      expect(result.builderId).toBe(builderId);
      expect(result.rating).toBe(feedbackRequest.rating);
      expect(result.completionPhotos).toHaveLength(2);
      expect(mockS3Client.send).toHaveBeenCalledTimes(2); // Two photo uploads
      expect(mockDocClient.send).toHaveBeenCalledTimes(2); // Feedback + rating update
    });

    it('should submit feedback without photos', async () => {
      const homeownerId = 'homeowner-123';
      const builderId = 'builder-456';
      const feedbackRequest: FeedbackSubmissionRequest = {
        projectId: 'project-789',
        rating: 4,
        overallSatisfaction: 4,
        qualityRating: 4,
        timelinessRating: 3,
        communicationRating: 4,
        cleanlinessRating: 4,
        professionalismRating: 4,
        valueForMoneyRating: 3,
        writtenFeedback: 'Good work overall',
        wouldRecommend: true,
        isPublic: true,
        photos: []
      };

      mockDocClient.send.mockResolvedValue({});

      const result = await feedbackService.submitFeedback(homeownerId, builderId, feedbackRequest);

      expect(result).toBeDefined();
      expect(result.completionPhotos).toHaveLength(0);
      expect(mockS3Client.send).not.toHaveBeenCalled();
      expect(mockDocClient.send).toHaveBeenCalledTimes(2); // Feedback + rating update
    });

    it('should handle S3 upload failure', async () => {
      const homeownerId = 'homeowner-123';
      const builderId = 'builder-456';
      const feedbackRequest: FeedbackSubmissionRequest = {
        projectId: 'project-789',
        rating: 5,
        overallSatisfaction: 5,
        qualityRating: 5,
        timelinessRating: 5,
        communicationRating: 5,
        cleanlinessRating: 5,
        professionalismRating: 5,
        valueForMoneyRating: 5,
        writtenFeedback: 'Great work',
        wouldRecommend: true,
        isPublic: true,
        photos: [new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })] as File[]
      };

      mockS3Client.send.mockRejectedValue(new Error('S3 upload failed'));

      await expect(feedbackService.submitFeedback(homeownerId, builderId, feedbackRequest))
        .rejects.toThrow('Failed to submit feedback');
    });
  });

  describe('getProjectFeedback', () => {
    it('should return project feedback when it exists', async () => {
      const projectId = 'project-123';
      const mockFeedback: ProjectFeedback = {
        id: 'feedback-123',
        projectId,
        homeownerId: 'homeowner-123',
        builderId: 'builder-456',
        rating: 5,
        overallSatisfaction: 5,
        qualityRating: 5,
        timelinessRating: 4,
        communicationRating: 5,
        cleanlinessRating: 4,
        professionalismRating: 5,
        valueForMoneyRating: 4,
        writtenFeedback: 'Excellent work',
        wouldRecommend: true,
        completionPhotos: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true
      };

      mockDocClient.send.mockResolvedValue({
        Items: [mockFeedback]
      });

      const result = await feedbackService.getProjectFeedback(projectId);

      expect(result).toEqual(mockFeedback);
      expect(mockDocClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: expect.any(String),
          IndexName: 'ProjectIdIndex'
        })
      );
    });

    it('should return null when no feedback exists', async () => {
      const projectId = 'project-123';

      mockDocClient.send.mockResolvedValue({
        Items: []
      });

      const result = await feedbackService.getProjectFeedback(projectId);

      expect(result).toBeNull();
    });

    it('should handle DynamoDB errors', async () => {
      const projectId = 'project-123';

      mockDocClient.send.mockRejectedValue(new Error('DynamoDB error'));

      await expect(feedbackService.getProjectFeedback(projectId))
        .rejects.toThrow('Failed to get project feedback');
    });
  });

  describe('getBuilderFeedback', () => {
    it('should return builder feedback list', async () => {
      const builderId = 'builder-123';
      const mockFeedback: ProjectFeedback[] = [
        {
          id: 'feedback-1',
          projectId: 'project-1',
          homeownerId: 'homeowner-1',
          builderId,
          rating: 5,
          overallSatisfaction: 5,
          qualityRating: 5,
          timelinessRating: 5,
          communicationRating: 5,
          cleanlinessRating: 5,
          professionalismRating: 5,
          valueForMoneyRating: 5,
          writtenFeedback: 'Great work',
          wouldRecommend: true,
          completionPhotos: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: true
        }
      ];

      mockDocClient.send.mockResolvedValue({
        Items: mockFeedback
      });

      const result = await feedbackService.getBuilderFeedback(builderId);

      expect(result).toEqual(mockFeedback);
      expect(mockDocClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: expect.any(String),
          IndexName: 'BuilderIdIndex'
        })
      );
    });

    it('should handle empty feedback list', async () => {
      const builderId = 'builder-123';

      mockDocClient.send.mockResolvedValue({
        Items: []
      });

      const result = await feedbackService.getBuilderFeedback(builderId);

      expect(result).toEqual([]);
    });
  });

  describe('getBuilderRating', () => {
    it('should return builder rating when it exists', async () => {
      const builderId = 'builder-123';
      const mockRating = {
        builderId,
        overallRating: 4.5,
        totalReviews: 10,
        qualityAverage: 4.6,
        timelinessAverage: 4.3,
        communicationAverage: 4.7,
        cleanlinessAverage: 4.4,
        professionalismAverage: 4.8,
        valueForMoneyAverage: 4.2,
        recommendationPercentage: 90,
        recentFeedback: [],
        ratingDistribution: {
          fiveStars: 6,
          fourStars: 3,
          threeStars: 1,
          twoStars: 0,
          oneStar: 0
        },
        lastUpdated: new Date()
      };

      mockDocClient.send.mockResolvedValue({
        Item: mockRating
      });

      const result = await feedbackService.getBuilderRating(builderId);

      expect(result).toEqual(mockRating);
    });

    it('should return null when no rating exists', async () => {
      const builderId = 'builder-123';

      mockDocClient.send.mockResolvedValue({});

      const result = await feedbackService.getBuilderRating(builderId);

      expect(result).toBeNull();
    });
  });

  describe('canSubmitFeedback', () => {
    it('should return true when no existing feedback', async () => {
      const projectId = 'project-123';
      const homeownerId = 'homeowner-123';

      mockDocClient.send.mockResolvedValue({
        Items: []
      });

      const result = await feedbackService.canSubmitFeedback(projectId, homeownerId);

      expect(result).toBe(true);
    });

    it('should return false when feedback already exists', async () => {
      const projectId = 'project-123';
      const homeownerId = 'homeowner-123';

      mockDocClient.send.mockResolvedValue({
        Items: [{ id: 'existing-feedback' }]
      });

      const result = await feedbackService.canSubmitFeedback(projectId, homeownerId);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const projectId = 'project-123';
      const homeownerId = 'homeowner-123';

      mockDocClient.send.mockRejectedValue(new Error('Database error'));

      const result = await feedbackService.canSubmitFeedback(projectId, homeownerId);

      expect(result).toBe(false);
    });
  });

  describe('getPublicBuilderFeedback', () => {
    it('should return only public feedback', async () => {
      const builderId = 'builder-123';
      const mockFeedback: ProjectFeedback[] = [
        {
          id: 'feedback-1',
          projectId: 'project-1',
          homeownerId: 'homeowner-1',
          builderId,
          rating: 5,
          overallSatisfaction: 5,
          qualityRating: 5,
          timelinessRating: 5,
          communicationRating: 5,
          cleanlinessRating: 5,
          professionalismRating: 5,
          valueForMoneyRating: 5,
          writtenFeedback: 'Great work',
          wouldRecommend: true,
          completionPhotos: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: true
        },
        {
          id: 'feedback-2',
          projectId: 'project-2',
          homeownerId: 'homeowner-2',
          builderId,
          rating: 4,
          overallSatisfaction: 4,
          qualityRating: 4,
          timelinessRating: 4,
          communicationRating: 4,
          cleanlinessRating: 4,
          professionalismRating: 4,
          valueForMoneyRating: 4,
          writtenFeedback: 'Good work',
          wouldRecommend: true,
          completionPhotos: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: false // Private feedback
        }
      ];

      mockDocClient.send.mockResolvedValue({
        Items: mockFeedback
      });

      const result = await feedbackService.getPublicBuilderFeedback(builderId, 5);

      expect(result).toHaveLength(1);
      expect(result[0].isPublic).toBe(true);
    });
  });
});