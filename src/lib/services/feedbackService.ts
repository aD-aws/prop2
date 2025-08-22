import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { 
  ProjectFeedback, 
  CompletionPhoto, 
  BuilderRating, 
  FeedbackSubmissionRequest,
  RatingDistribution,
  BuilderLeadPriority
} from '../types';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: process.env.AWS_REGION });

export class FeedbackService {
  private readonly feedbackTableName = process.env.FEEDBACK_TABLE_NAME || 'feedback';
  private readonly builderRatingsTableName = process.env.BUILDER_RATINGS_TABLE_NAME || 'builder-ratings';
  private readonly photoBucketName = process.env.COMPLETION_PHOTOS_BUCKET || 'completion-photos';

  /**
   * Submit feedback for a completed project
   */
  async submitFeedback(
    homeownerId: string,
    builderId: string,
    feedbackRequest: FeedbackSubmissionRequest
  ): Promise<ProjectFeedback> {
    try {
      // Upload photos to S3 first
      const completionPhotos: CompletionPhoto[] = [];
      
      for (let i = 0; i < feedbackRequest.photos.length; i++) {
        const photo = feedbackRequest.photos[i];
        const photoId = `${feedbackRequest.projectId}-${Date.now()}-${i}`;
        const key = `${feedbackRequest.projectId}/${photoId}`;
        
        // Upload to S3
        const uploadCommand = new PutObjectCommand({
          Bucket: this.photoBucketName,
          Key: key,
          Body: photo,
          ContentType: photo.type,
          Metadata: {
            projectId: feedbackRequest.projectId,
            uploadedBy: homeownerId
          }
        });
        
        await s3Client.send(uploadCommand);
        
        const completionPhoto: CompletionPhoto = {
          id: photoId,
          feedbackId: '', // Will be set after feedback creation
          url: `https://${this.photoBucketName}.s3.amazonaws.com/${key}`,
          uploadedAt: new Date(),
          fileSize: photo.size,
          fileName: photo.name
        };
        
        completionPhotos.push(completionPhoto);
      }

      // Create feedback record
      const feedback: ProjectFeedback = {
        id: `feedback-${Date.now()}`,
        projectId: feedbackRequest.projectId,
        homeownerId,
        builderId,
        rating: feedbackRequest.rating,
        overallSatisfaction: feedbackRequest.overallSatisfaction,
        qualityRating: feedbackRequest.qualityRating,
        timelinessRating: feedbackRequest.timelinessRating,
        communicationRating: feedbackRequest.communicationRating,
        cleanlinessRating: feedbackRequest.cleanlinessRating,
        professionalismRating: feedbackRequest.professionalismRating,
        valueForMoneyRating: feedbackRequest.valueForMoneyRating,
        writtenFeedback: feedbackRequest.writtenFeedback,
        wouldRecommend: feedbackRequest.wouldRecommend,
        completionPhotos: completionPhotos.map(photo => ({
          ...photo,
          feedbackId: `feedback-${Date.now()}`
        })),
        improvementSuggestions: feedbackRequest.improvementSuggestions,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: feedbackRequest.isPublic
      };

      // Save feedback to DynamoDB
      const putCommand = new PutCommand({
        TableName: this.feedbackTableName,
        Item: feedback
      });

      await docClient.send(putCommand);

      // Update builder ratings
      await this.updateBuilderRating(builderId, feedback);

      return feedback;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error('Failed to submit feedback');
    }
  }

  /**
   * Get feedback for a specific project
   */
  async getProjectFeedback(projectId: string): Promise<ProjectFeedback | null> {
    try {
      const command = new QueryCommand({
        TableName: this.feedbackTableName,
        IndexName: 'ProjectIdIndex',
        KeyConditionExpression: 'projectId = :projectId',
        ExpressionAttributeValues: {
          ':projectId': projectId
        }
      });

      const result = await docClient.send(command);
      return result.Items?.[0] as ProjectFeedback || null;
    } catch (error) {
      console.error('Error getting project feedback:', error);
      throw new Error('Failed to get project feedback');
    }
  }

  /**
   * Get all feedback for a builder
   */
  async getBuilderFeedback(builderId: string, limit: number = 10): Promise<ProjectFeedback[]> {
    try {
      const command = new QueryCommand({
        TableName: this.feedbackTableName,
        IndexName: 'BuilderIdIndex',
        KeyConditionExpression: 'builderId = :builderId',
        ExpressionAttributeValues: {
          ':builderId': builderId
        },
        ScanIndexForward: false, // Most recent first
        Limit: limit
      });

      const result = await docClient.send(command);
      return result.Items as ProjectFeedback[] || [];
    } catch (error) {
      console.error('Error getting builder feedback:', error);
      throw new Error('Failed to get builder feedback');
    }
  }

  /**
   * Get builder rating summary
   */
  async getBuilderRating(builderId: string): Promise<BuilderRating | null> {
    try {
      const command = new GetCommand({
        TableName: this.builderRatingsTableName,
        Key: { builderId }
      });

      const result = await docClient.send(command);
      return result.Item as BuilderRating || null;
    } catch (error) {
      console.error('Error getting builder rating:', error);
      throw new Error('Failed to get builder rating');
    }
  }

  /**
   * Update builder rating based on new feedback
   */
  private async updateBuilderRating(builderId: string, newFeedback: ProjectFeedback): Promise<void> {
    try {
      // Get existing rating or create new one
      let builderRating = await this.getBuilderRating(builderId);
      
      if (!builderRating) {
        builderRating = {
          builderId,
          overallRating: 0,
          totalReviews: 0,
          qualityAverage: 0,
          timelinessAverage: 0,
          communicationAverage: 0,
          cleanlinessAverage: 0,
          professionalismAverage: 0,
          valueForMoneyAverage: 0,
          recommendationPercentage: 0,
          recentFeedback: [],
          ratingDistribution: {
            fiveStars: 0,
            fourStars: 0,
            threeStars: 0,
            twoStars: 0,
            oneStar: 0
          },
          lastUpdated: new Date()
        };
      }

      // Calculate new averages
      const totalReviews = builderRating.totalReviews + 1;
      
      builderRating.overallRating = this.calculateNewAverage(
        builderRating.overallRating,
        builderRating.totalReviews,
        newFeedback.rating
      );
      
      builderRating.qualityAverage = this.calculateNewAverage(
        builderRating.qualityAverage,
        builderRating.totalReviews,
        newFeedback.qualityRating
      );
      
      builderRating.timelinessAverage = this.calculateNewAverage(
        builderRating.timelinessAverage,
        builderRating.totalReviews,
        newFeedback.timelinessRating
      );
      
      builderRating.communicationAverage = this.calculateNewAverage(
        builderRating.communicationAverage,
        builderRating.totalReviews,
        newFeedback.communicationRating
      );
      
      builderRating.cleanlinessAverage = this.calculateNewAverage(
        builderRating.cleanlinessAverage,
        builderRating.totalReviews,
        newFeedback.cleanlinessRating
      );
      
      builderRating.professionalismAverage = this.calculateNewAverage(
        builderRating.professionalismAverage,
        builderRating.totalReviews,
        newFeedback.professionalismRating
      );
      
      builderRating.valueForMoneyAverage = this.calculateNewAverage(
        builderRating.valueForMoneyAverage,
        builderRating.totalReviews,
        newFeedback.valueForMoneyRating
      );

      // Update rating distribution
      this.updateRatingDistribution(builderRating.ratingDistribution, newFeedback.rating);

      // Calculate recommendation percentage
      const recommendationCount = newFeedback.wouldRecommend ? 1 : 0;
      const currentRecommendations = Math.round(
        (builderRating.recommendationPercentage / 100) * builderRating.totalReviews
      );
      builderRating.recommendationPercentage = 
        ((currentRecommendations + recommendationCount) / totalReviews) * 100;

      // Update totals
      builderRating.totalReviews = totalReviews;
      builderRating.lastUpdated = new Date();

      // Add to recent feedback (keep last 5)
      builderRating.recentFeedback.unshift(newFeedback);
      if (builderRating.recentFeedback.length > 5) {
        builderRating.recentFeedback = builderRating.recentFeedback.slice(0, 5);
      }

      // Save updated rating
      const updateCommand = new PutCommand({
        TableName: this.builderRatingsTableName,
        Item: builderRating
      });

      await docClient.send(updateCommand);
    } catch (error) {
      console.error('Error updating builder rating:', error);
      throw new Error('Failed to update builder rating');
    }
  }

  /**
   * Calculate new average rating
   */
  private calculateNewAverage(currentAverage: number, currentCount: number, newRating: number): number {
    return ((currentAverage * currentCount) + newRating) / (currentCount + 1);
  }

  /**
   * Update rating distribution
   */
  private updateRatingDistribution(distribution: RatingDistribution, rating: number): void {
    switch (Math.floor(rating)) {
      case 5:
        distribution.fiveStars++;
        break;
      case 4:
        distribution.fourStars++;
        break;
      case 3:
        distribution.threeStars++;
        break;
      case 2:
        distribution.twoStars++;
        break;
      case 1:
        distribution.oneStar++;
        break;
    }
  }

  /**
   * Get builder priorities for lead distribution
   */
  async getBuilderPriorities(
    postcode: string,
    projectType: string,
    limit: number = 10
  ): Promise<BuilderLeadPriority[]> {
    try {
      // This would typically query builders by location and specialization
      // For now, we'll get all builders and sort by rating
      const command = new QueryCommand({
        TableName: this.builderRatingsTableName,
        IndexName: 'RatingIndex',
        KeyConditionExpression: 'overallRating > :minRating',
        ExpressionAttributeValues: {
          ':minRating': 0
        },
        ScanIndexForward: false, // Highest rated first
        Limit: limit
      });

      const result = await docClient.send(command);
      const builderRatings = result.Items as BuilderRating[] || [];

      // Convert to BuilderLeadPriority format
      return builderRatings.map((rating, index) => ({
        builderId: rating.builderId,
        priority: (limit - index) * 10 + Math.floor(rating.overallRating * 2), // Higher rating = higher priority
        rating: rating.overallRating,
        totalReviews: rating.totalReviews,
        responseTime: 24, // Default - would be calculated from historical data
        acceptanceRate: 85, // Default - would be calculated from historical data
        completionRate: 95, // Default - would be calculated from historical data
        lastActive: new Date(),
        serviceAreas: [postcode], // Would be fetched from builder profile
        specializations: [projectType as any] // Would be fetched from builder profile
      }));
    } catch (error) {
      console.error('Error getting builder priorities:', error);
      throw new Error('Failed to get builder priorities');
    }
  }

  /**
   * Check if project can receive feedback (project completed)
   */
  async canSubmitFeedback(projectId: string, homeownerId: string): Promise<boolean> {
    try {
      // Check if project exists and is completed
      // This would typically check the project status
      const existingFeedback = await this.getProjectFeedback(projectId);
      return !existingFeedback; // Can only submit once
    } catch (error) {
      console.error('Error checking feedback eligibility:', error);
      return false;
    }
  }

  /**
   * Get public feedback for display to other homeowners
   */
  async getPublicBuilderFeedback(builderId: string, limit: number = 5): Promise<ProjectFeedback[]> {
    try {
      const allFeedback = await this.getBuilderFeedback(builderId, limit * 2);
      return allFeedback
        .filter(feedback => feedback.isPublic)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting public builder feedback:', error);
      throw new Error('Failed to get public builder feedback');
    }
  }
}

export const feedbackService = new FeedbackService();