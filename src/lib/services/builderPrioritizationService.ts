import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { 
  BuilderLeadPriority, 
  BuilderRating, 
  ProjectType,
  BuilderProfile 
} from '../types';
import { feedbackService } from './feedbackService';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export class BuilderPrioritizationService {
  private readonly buildersTableName = process.env.BUILDERS_TABLE_NAME || 'builders';
  private readonly builderRatingsTableName = process.env.BUILDER_RATINGS_TABLE_NAME || 'builder-ratings';
  private readonly leadOffersTableName = process.env.LEAD_OFFERS_TABLE_NAME || 'lead-offers';

  /**
   * Get prioritized list of builders for a lead
   */
  async getPrioritizedBuilders(
    postcode: string,
    projectType: ProjectType,
    maxBuilders: number = 10
  ): Promise<BuilderLeadPriority[]> {
    try {
      // Get builders in the area who specialize in this project type
      const eligibleBuilders = await this.getEligibleBuilders(postcode, projectType);
      
      // Get ratings for each builder
      const builderPriorities: BuilderLeadPriority[] = [];
      
      for (const builder of eligibleBuilders) {
        const rating = await feedbackService.getBuilderRating(builder.id);
        const metrics = await this.getBuilderMetrics(builder.id);
        
        const priority = this.calculateBuilderPriority(builder, rating, metrics);
        builderPriorities.push(priority);
      }

      // Sort by priority (highest first) and return top builders
      return builderPriorities
        .sort((a, b) => b.priority - a.priority)
        .slice(0, maxBuilders);
    } catch (error) {
      console.error('Error getting prioritized builders:', error);
      throw new Error('Failed to get prioritized builders');
    }
  }

  /**
   * Get builders eligible for a specific project
   */
  private async getEligibleBuilders(
    postcode: string,
    projectType: ProjectType
  ): Promise<BuilderProfile[]> {
    try {
      // Extract postcode area (first part before space)
      const postcodeArea = postcode.split(' ')[0];
      
      // Query builders by postcode area and specialization
      const command = new QueryCommand({
        TableName: this.buildersTableName,
        IndexName: 'PostcodeSpecializationIndex',
        KeyConditionExpression: 'postcodeArea = :postcodeArea',
        FilterExpression: 'contains(specializations, :projectType) AND vettingStatus = :approved',
        ExpressionAttributeValues: {
          ':postcodeArea': postcodeArea,
          ':projectType': projectType,
          ':approved': 'approved'
        }
      });

      const result = await docClient.send(command);
      return result.Items as BuilderProfile[] || [];
    } catch (error) {
      console.error('Error getting eligible builders:', error);
      // Fallback to scan if index query fails
      return this.fallbackGetEligibleBuilders(postcode, projectType);
    }
  }

  /**
   * Fallback method to get eligible builders using scan
   */
  private async fallbackGetEligibleBuilders(
    postcode: string,
    projectType: ProjectType
  ): Promise<BuilderProfile[]> {
    try {
      const postcodeArea = postcode.split(' ')[0];
      
      const command = new ScanCommand({
        TableName: this.buildersTableName,
        FilterExpression: 'contains(serviceAreas, :postcodeArea) AND contains(specializations, :projectType) AND vettingStatus = :approved',
        ExpressionAttributeValues: {
          ':postcodeArea': postcodeArea,
          ':projectType': projectType,
          ':approved': 'approved'
        }
      });

      const result = await docClient.send(command);
      return result.Items as BuilderProfile[] || [];
    } catch (error) {
      console.error('Error in fallback get eligible builders:', error);
      return [];
    }
  }

  /**
   * Get builder performance metrics
   */
  private async getBuilderMetrics(builderId: string): Promise<{
    responseTime: number;
    acceptanceRate: number;
    completionRate: number;
    lastActive: Date;
  }> {
    try {
      // In a real implementation, this would query historical data
      // For now, return default values that would be calculated from:
      // - Lead offer response times
      // - Lead acceptance vs rejection rates
      // - Project completion rates
      // - Last login/activity timestamps
      
      return {
        responseTime: 12, // Average hours to respond to leads
        acceptanceRate: 75, // Percentage of leads accepted
        completionRate: 95, // Percentage of projects completed successfully
        lastActive: new Date() // Last activity timestamp
      };
    } catch (error) {
      console.error('Error getting builder metrics:', error);
      return {
        responseTime: 24,
        acceptanceRate: 50,
        completionRate: 80,
        lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      };
    }
  }

  /**
   * Calculate builder priority score
   */
  private calculateBuilderPriority(
    builder: BuilderProfile,
    rating: BuilderRating | null,
    metrics: {
      responseTime: number;
      acceptanceRate: number;
      completionRate: number;
      lastActive: Date;
    }
  ): BuilderLeadPriority {
    let priority = 0;

    // Rating component (40% of total score)
    if (rating) {
      const ratingScore = (rating.overallRating / 5) * 40;
      const reviewBonus = Math.min(rating.totalReviews / 10, 1) * 10; // Bonus for having reviews
      priority += ratingScore + reviewBonus;
    } else {
      priority += 20; // Default score for new builders
    }

    // Response time component (20% of total score)
    const responseScore = Math.max(0, 20 - (metrics.responseTime / 24) * 20);
    priority += responseScore;

    // Acceptance rate component (15% of total score)
    const acceptanceScore = (metrics.acceptanceRate / 100) * 15;
    priority += acceptanceScore;

    // Completion rate component (15% of total score)
    const completionScore = (metrics.completionRate / 100) * 15;
    priority += completionScore;

    // Activity recency component (10% of total score)
    const daysSinceActive = (Date.now() - metrics.lastActive.getTime()) / (1000 * 60 * 60 * 24);
    const activityScore = Math.max(0, 10 - (daysSinceActive / 30) * 10);
    priority += activityScore;

    return {
      builderId: builder.id,
      priority: Math.round(priority),
      rating: rating?.overallRating || 0,
      totalReviews: rating?.totalReviews || 0,
      responseTime: metrics.responseTime,
      acceptanceRate: metrics.acceptanceRate,
      completionRate: metrics.completionRate,
      lastActive: metrics.lastActive,
      serviceAreas: builder.serviceAreas,
      specializations: builder.specializations
    };
  }

  /**
   * Update builder metrics after lead interaction
   */
  async updateBuilderMetrics(
    builderId: string,
    action: 'offered' | 'accepted' | 'rejected' | 'completed',
    responseTime?: number
  ): Promise<void> {
    try {
      // In a real implementation, this would update metrics in the database
      // Track:
      // - Lead offers sent
      // - Lead acceptances/rejections
      // - Response times
      // - Project completions
      
      console.log(`Updating builder ${builderId} metrics for action: ${action}`);
      
      // This would update aggregated metrics used for prioritization
    } catch (error) {
      console.error('Error updating builder metrics:', error);
    }
  }

  /**
   * Get builder priority explanation for debugging
   */
  async getBuilderPriorityExplanation(builderId: string): Promise<{
    totalScore: number;
    breakdown: {
      rating: number;
      responseTime: number;
      acceptanceRate: number;
      completionRate: number;
      activity: number;
    };
  }> {
    try {
      const builder = await this.getBuilderProfile(builderId);
      if (!builder) {
        throw new Error('Builder not found');
      }

      const rating = await feedbackService.getBuilderRating(builderId);
      const metrics = await this.getBuilderMetrics(builderId);
      const priority = this.calculateBuilderPriority(builder, rating, metrics);

      // Calculate individual component scores
      const ratingScore = rating ? (rating.overallRating / 5) * 40 + Math.min(rating.totalReviews / 10, 1) * 10 : 20;
      const responseScore = Math.max(0, 20 - (metrics.responseTime / 24) * 20);
      const acceptanceScore = (metrics.acceptanceRate / 100) * 15;
      const completionScore = (metrics.completionRate / 100) * 15;
      const daysSinceActive = (Date.now() - metrics.lastActive.getTime()) / (1000 * 60 * 60 * 24);
      const activityScore = Math.max(0, 10 - (daysSinceActive / 30) * 10);

      return {
        totalScore: priority.priority,
        breakdown: {
          rating: Math.round(ratingScore),
          responseTime: Math.round(responseScore),
          acceptanceRate: Math.round(acceptanceScore),
          completionRate: Math.round(completionScore),
          activity: Math.round(activityScore)
        }
      };
    } catch (error) {
      console.error('Error getting builder priority explanation:', error);
      throw new Error('Failed to get builder priority explanation');
    }
  }

  /**
   * Get builder profile by ID
   */
  private async getBuilderProfile(builderId: string): Promise<BuilderProfile | null> {
    try {
      const command = new QueryCommand({
        TableName: this.buildersTableName,
        KeyConditionExpression: 'id = :builderId',
        ExpressionAttributeValues: {
          ':builderId': builderId
        }
      });

      const result = await docClient.send(command);
      return result.Items?.[0] as BuilderProfile || null;
    } catch (error) {
      console.error('Error getting builder profile:', error);
      return null;
    }
  }
}

export const builderPrioritizationService = new BuilderPrioritizationService();