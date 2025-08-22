import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { aiService } from './aiService';

// Create client instance that can be mocked in tests
let docClient: DynamoDBDocumentClient;

// Initialize client (can be overridden in tests)
export const initializeClient = (client?: DynamoDBDocumentClient) => {
  if (client) {
    docClient = client;
  } else {
    const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
    docClient = DynamoDBDocumentClient.from(dynamoClient);
  }
};

// Initialize with default client
initializeClient();

export interface ProjectWinData {
  projectId: string;
  projectType: string;
  category: string;
  location: string;
  postcode: string;
  winDate: Date;
  projectValue: number;
  quoteValue: number;
  responseTime: number; // hours
  proposalQuality: number; // 1-10 rating
  builderRating: number; // 1-5 rating
  competitorCount: number;
  timelineOffered: number; // days
  averageCompetitorTimeline: number; // days
}

export interface GeographicAnalytics {
  postcode: string;
  area: string;
  totalProjects: number;
  wonProjects: number;
  winRate: number;
  averageProjectValue: number;
  totalRevenue: number;
  competitiveAdvantage: string[];
}

export interface CategoryAnalytics {
  category: string;
  projectTypes: string[];
  totalProjects: number;
  wonProjects: number;
  winRate: number;
  averageProjectValue: number;
  totalRevenue: number;
  averageResponseTime: number;
  averageRating: number;
  competitiveFactors: string[];
}

export interface AIInsights {
  overallPerformance: {
    totalWinRate: number;
    averageProjectValue: number;
    totalRevenue: number;
    strongestCategories: string[];
    strongestAreas: string[];
  };
  competitiveAdvantages: {
    factor: string;
    impact: 'high' | 'medium' | 'low';
    description: string;
    recommendation: string;
  }[];
  successPatterns: {
    pattern: string;
    frequency: number;
    impact: string;
    actionable: string;
  }[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    action: string;
    expectedImpact: string;
  }[];
  marketOpportunities: {
    area: string;
    projectType: string;
    opportunity: string;
    potentialValue: number;
  }[];
}

export interface BuilderAnalyticsDashboard {
  builderId: string;
  subscriptionStatus: 'active' | 'expired' | 'none';
  analyticsAccess: boolean;
  geographicAnalytics: GeographicAnalytics[];
  categoryAnalytics: CategoryAnalytics[];
  aiInsights: AIInsights;
  lastUpdated: Date;
}

class BuilderAnalyticsService {
  /**
   * Get comprehensive analytics dashboard for a subscribed builder
   */
  async getBuilderAnalytics(builderId: string): Promise<BuilderAnalyticsDashboard> {
    try {
      // Check subscription status first
      const subscriptionStatus = await this.checkSubscriptionStatus(builderId);
      
      if (!subscriptionStatus.analyticsAccess) {
        throw new Error('Analytics access requires active subscription');
      }

      // Get project win data
      const projectWins = await this.getProjectWinData(builderId);
      
      // Generate geographic analytics
      const geographicAnalytics = await this.generateGeographicAnalytics(projectWins);
      
      // Generate category analytics
      const categoryAnalytics = await this.generateCategoryAnalytics(projectWins);
      
      // Generate AI insights
      const aiInsights = await this.generateAIInsights(projectWins, geographicAnalytics, categoryAnalytics);

      return {
        builderId,
        subscriptionStatus: subscriptionStatus.status,
        analyticsAccess: subscriptionStatus.analyticsAccess,
        geographicAnalytics,
        categoryAnalytics,
        aiInsights,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error generating builder analytics:', error);
      throw error;
    }
  }

  /**
   * Check if builder has active subscription with analytics access
   */
  private async checkSubscriptionStatus(builderId: string): Promise<{
    status: 'active' | 'expired' | 'none';
    analyticsAccess: boolean;
  }> {
    try {
      const command = new QueryCommand({
        TableName: 'Subscriptions',
        IndexName: 'BuilderIdIndex',
        KeyConditionExpression: 'builderId = :builderId',
        ExpressionAttributeValues: {
          ':builderId': builderId
        },
        ScanIndexForward: false,
        Limit: 1
      });

      const result = await docClient.send(command);
      
      if (!result.Items || result.Items.length === 0) {
        return { status: 'none', analyticsAccess: false };
      }

      const subscription = result.Items[0];
      const now = new Date();
      const expiryDate = new Date(subscription.expiryDate);
      
      const isActive = subscription.status === 'active' && expiryDate > now;
      const hasAnalyticsAccess = isActive && (subscription.tier === 'premium' || subscription.tier === 'professional');

      return {
        status: isActive ? 'active' : 'expired',
        analyticsAccess: hasAnalyticsAccess
      };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return { status: 'none', analyticsAccess: false };
    }
  }

  /**
   * Get project win data for the builder
   */
  private async getProjectWinData(builderId: string): Promise<ProjectWinData[]> {
    try {
      // Get all quotes by this builder
      const quotesCommand = new QueryCommand({
        TableName: 'Quotes',
        IndexName: 'BuilderIdIndex',
        KeyConditionExpression: 'builderId = :builderId',
        ExpressionAttributeValues: {
          ':builderId': builderId
        }
      });

      const quotesResult = await docClient.send(quotesCommand);
      
      if (!quotesResult.Items) {
        return [];
      }

      const winData: ProjectWinData[] = [];

      // Process each quote to determine wins and gather data
      for (const quote of quotesResult.Items) {
        if (quote.status === 'selected' || quote.status === 'won') {
          // Get project details
          const projectCommand = new QueryCommand({
            TableName: 'Projects',
            KeyConditionExpression: 'projectId = :projectId',
            ExpressionAttributeValues: {
              ':projectId': quote.projectId
            }
          });

          const projectResult = await docClient.send(projectCommand);
          
          if (projectResult.Items && projectResult.Items.length > 0) {
            const project = projectResult.Items[0];
            
            // Get property details for location
            const propertyCommand = new QueryCommand({
              TableName: 'Properties',
              KeyConditionExpression: 'propertyId = :propertyId',
              ExpressionAttributeValues: {
                ':propertyId': project.propertyId
              }
            });

            const propertyResult = await docClient.send(propertyCommand);
            
            if (propertyResult.Items && propertyResult.Items.length > 0) {
              const property = propertyResult.Items[0];
              
              // Get competitor count for this project
              const competitorCommand = new QueryCommand({
                TableName: 'Quotes',
                IndexName: 'ProjectIdIndex',
                KeyConditionExpression: 'projectId = :projectId',
                ExpressionAttributeValues: {
                  ':projectId': quote.projectId
                }
              });

              const competitorResult = await docClient.send(competitorCommand);
              const competitorCount = (competitorResult.Items?.length || 1) - 1; // Exclude own quote
              
              // Calculate average competitor timeline
              const competitorTimelines = competitorResult.Items
                ?.filter(q => q.builderId !== builderId)
                .map(q => q.timeline || 0) || [];
              
              const averageCompetitorTimeline = competitorTimelines.length > 0
                ? competitorTimelines.reduce((sum, timeline) => sum + timeline, 0) / competitorTimelines.length
                : 0;

              winData.push({
                projectId: quote.projectId,
                projectType: project.projectType,
                category: this.categorizeProjectType(project.projectType),
                location: `${property.address.city}, ${property.address.county}`,
                postcode: property.address.postcode,
                winDate: new Date(quote.selectedAt || quote.updatedAt),
                projectValue: project.estimatedValue || 0,
                quoteValue: quote.pricing.totalAmount,
                responseTime: this.calculateResponseTime(quote.createdAt, quote.submittedAt),
                proposalQuality: quote.qualityScore || 7, // Default if not available
                builderRating: quote.builderRating || 4, // Default if not available
                competitorCount,
                timelineOffered: quote.timeline,
                averageCompetitorTimeline
              });
            }
          }
        }
      }

      return winData;
    } catch (error) {
      console.error('Error getting project win data:', error);
      return [];
    }
  }

  /**
   * Generate geographic analytics from project win data
   */
  private async generateGeographicAnalytics(projectWins: ProjectWinData[]): Promise<GeographicAnalytics[]> {
    const geographicMap = new Map<string, {
      area: string;
      projects: ProjectWinData[];
      totalProjects: number;
    }>();

    // Group by postcode area (first part of postcode)
    projectWins.forEach(win => {
      const postcodeArea = win.postcode.split(' ')[0];
      
      if (!geographicMap.has(postcodeArea)) {
        geographicMap.set(postcodeArea, {
          area: win.location,
          projects: [],
          totalProjects: 0
        });
      }
      
      geographicMap.get(postcodeArea)!.projects.push(win);
    });

    // TODO: Get total projects invited to in each area (not just wins)
    // For now, we'll estimate based on win rate assumptions

    const analytics: GeographicAnalytics[] = [];

    for (const [postcode, data] of geographicMap) {
      const wonProjects = data.projects.length;
      const estimatedTotalProjects = Math.round(wonProjects / 0.3); // Assume 30% win rate
      const totalRevenue = data.projects.reduce((sum, p) => sum + p.quoteValue, 0);
      const averageProjectValue = totalRevenue / wonProjects;
      
      // Identify competitive advantages for this area
      const competitiveAdvantage = this.identifyGeographicAdvantages(data.projects);

      analytics.push({
        postcode,
        area: data.area,
        totalProjects: estimatedTotalProjects,
        wonProjects,
        winRate: wonProjects / estimatedTotalProjects,
        averageProjectValue,
        totalRevenue,
        competitiveAdvantage
      });
    }

    return analytics.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  /**
   * Generate category analytics from project win data
   */
  private async generateCategoryAnalytics(projectWins: ProjectWinData[]): Promise<CategoryAnalytics[]> {
    const categoryMap = new Map<string, ProjectWinData[]>();

    // Group by category
    projectWins.forEach(win => {
      if (!categoryMap.has(win.category)) {
        categoryMap.set(win.category, []);
      }
      categoryMap.get(win.category)!.push(win);
    });

    const analytics: CategoryAnalytics[] = [];

    for (const [category, projects] of categoryMap) {
      const wonProjects = projects.length;
      const estimatedTotalProjects = Math.round(wonProjects / 0.3); // Assume 30% win rate
      const totalRevenue = projects.reduce((sum, p) => sum + p.quoteValue, 0);
      const averageProjectValue = totalRevenue / wonProjects;
      const averageResponseTime = projects.reduce((sum, p) => sum + p.responseTime, 0) / wonProjects;
      const averageRating = projects.reduce((sum, p) => sum + p.builderRating, 0) / wonProjects;
      
      // Get unique project types in this category
      const projectTypes = [...new Set(projects.map(p => p.projectType))];
      
      // Identify competitive factors for this category
      const competitiveFactors = this.identifyCategoryAdvantages(projects);

      analytics.push({
        category,
        projectTypes,
        totalProjects: estimatedTotalProjects,
        wonProjects,
        winRate: wonProjects / estimatedTotalProjects,
        averageProjectValue,
        totalRevenue,
        averageResponseTime,
        averageRating,
        competitiveFactors
      });
    }

    return analytics.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  /**
   * Generate AI-driven insights and recommendations
   */
  private async generateAIInsights(
    projectWins: ProjectWinData[],
    geographicAnalytics: GeographicAnalytics[],
    categoryAnalytics: CategoryAnalytics[]
  ): Promise<AIInsights> {
    try {
      // Prepare data for AI analysis
      const analysisData = {
        totalProjects: projectWins.length,
        totalRevenue: projectWins.reduce((sum, p) => sum + p.quoteValue, 0),
        averageProjectValue: projectWins.reduce((sum, p) => sum + p.quoteValue, 0) / projectWins.length,
        averageResponseTime: projectWins.reduce((sum, p) => sum + p.responseTime, 0) / projectWins.length,
        averageRating: projectWins.reduce((sum, p) => sum + p.builderRating, 0) / projectWins.length,
        strongestCategories: categoryAnalytics.slice(0, 3).map(c => c.category),
        strongestAreas: geographicAnalytics.slice(0, 3).map(g => g.postcode),
        projectWins,
        geographicAnalytics,
        categoryAnalytics
      };

      const prompt = `
        Analyze the following builder performance data and provide AI-driven insights:

        ${JSON.stringify(analysisData, null, 2)}

        Please provide insights in the following format:
        1. Competitive Advantages: Identify key factors that contribute to this builder's success
        2. Success Patterns: Identify recurring patterns in winning projects
        3. Recommendations: Provide actionable recommendations for improvement
        4. Market Opportunities: Identify potential growth areas

        Focus on:
        - Response time impact on win rates
        - Pricing strategies vs competitors
        - Geographic strengths and opportunities
        - Project type specializations
        - Timeline competitiveness
        - Quality and rating trends

        Provide specific, actionable insights that can help improve business performance.
      `;

      const aiResponse = await aiService.generateInsights(prompt);
      
      // Parse AI response and structure it
      return this.parseAIInsights(aiResponse, analysisData);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      
      // Return fallback insights if AI fails
      return this.generateFallbackInsights(projectWins, geographicAnalytics, categoryAnalytics);
    }
  }

  /**
   * Parse AI response into structured insights
   */
  private parseAIInsights(aiResponse: string, analysisData: any): AIInsights {
    // This would parse the AI response and structure it properly
    // For now, return structured fallback insights
    return this.generateFallbackInsights(
      analysisData.projectWins,
      analysisData.geographicAnalytics,
      analysisData.categoryAnalytics
    );
  }

  /**
   * Generate fallback insights when AI is unavailable
   */
  private generateFallbackInsights(
    projectWins: ProjectWinData[],
    geographicAnalytics: GeographicAnalytics[],
    categoryAnalytics: CategoryAnalytics[]
  ): AIInsights {
    const totalWinRate = projectWins.length / (projectWins.length / 0.3); // Estimated
    const averageProjectValue = projectWins.reduce((sum, p) => sum + p.quoteValue, 0) / projectWins.length;
    const totalRevenue = projectWins.reduce((sum, p) => sum + p.quoteValue, 0);

    return {
      overallPerformance: {
        totalWinRate,
        averageProjectValue,
        totalRevenue,
        strongestCategories: categoryAnalytics.slice(0, 3).map(c => c.category),
        strongestAreas: geographicAnalytics.slice(0, 3).map(g => g.postcode)
      },
      competitiveAdvantages: [
        {
          factor: 'Response Time',
          impact: 'high',
          description: 'Fast response times correlate with higher win rates',
          recommendation: 'Maintain quick response times to quotes and inquiries'
        },
        {
          factor: 'Geographic Focus',
          impact: 'medium',
          description: 'Strong performance in specific geographic areas',
          recommendation: 'Focus marketing efforts on strongest performing areas'
        }
      ],
      successPatterns: [
        {
          pattern: 'Quick Response + Competitive Timeline',
          frequency: 0.7,
          impact: 'High win rate when responding within 2 hours with competitive timeline',
          actionable: 'Set up notifications for new project invitations'
        }
      ],
      recommendations: [
        {
          priority: 'high',
          category: 'Response Time',
          action: 'Implement automated quote acknowledgment system',
          expectedImpact: 'Increase win rate by 15-20%'
        },
        {
          priority: 'medium',
          category: 'Geographic Expansion',
          action: 'Expand into adjacent high-value postcodes',
          expectedImpact: 'Increase project volume by 25%'
        }
      ],
      marketOpportunities: geographicAnalytics.slice(0, 3).map(area => ({
        area: area.postcode,
        projectType: 'Kitchen Renovation',
        opportunity: 'High-value projects with low competition',
        potentialValue: area.averageProjectValue * 1.2
      }))
    };
  }

  /**
   * Helper methods
   */
  private categorizeProjectType(projectType: string): string {
    const categories = {
      'Kitchen': ['kitchen', 'cooking', 'culinary'],
      'Bathroom': ['bathroom', 'shower', 'toilet', 'wet room'],
      'Extension': ['extension', 'addition', 'expand'],
      'Loft Conversion': ['loft', 'attic', 'roof'],
      'Electrical': ['electrical', 'wiring', 'lighting'],
      'Plumbing': ['plumbing', 'pipes', 'heating'],
      'External': ['external', 'garden', 'driveway', 'patio'],
      'Structural': ['structural', 'foundation', 'wall']
    };

    const lowerType = projectType.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerType.includes(keyword))) {
        return category;
      }
    }
    
    return 'Other';
  }

  private calculateResponseTime(createdAt: string, submittedAt: string): number {
    const created = new Date(createdAt);
    const submitted = new Date(submittedAt);
    return (submitted.getTime() - created.getTime()) / (1000 * 60 * 60); // Hours
  }

  private identifyGeographicAdvantages(projects: ProjectWinData[]): string[] {
    const advantages: string[] = [];
    
    const avgResponseTime = projects.reduce((sum, p) => sum + p.responseTime, 0) / projects.length;
    if (avgResponseTime < 2) {
      advantages.push('Fast Response Time');
    }
    
    const avgRating = projects.reduce((sum, p) => sum + p.builderRating, 0) / projects.length;
    if (avgRating > 4.5) {
      advantages.push('High Customer Satisfaction');
    }
    
    const competitiveTimelines = projects.filter(p => p.timelineOffered < p.averageCompetitorTimeline);
    if (competitiveTimelines.length / projects.length > 0.7) {
      advantages.push('Competitive Timelines');
    }
    
    return advantages;
  }

  private identifyCategoryAdvantages(projects: ProjectWinData[]): string[] {
    const advantages: string[] = [];
    
    const avgResponseTime = projects.reduce((sum, p) => sum + p.responseTime, 0) / projects.length;
    if (avgResponseTime < 3) {
      advantages.push('Quick Response');
    }
    
    const competitivePricing = projects.filter(p => p.quoteValue < p.projectValue * 1.1);
    if (competitivePricing.length / projects.length > 0.6) {
      advantages.push('Competitive Pricing');
    }
    
    const qualityProposals = projects.filter(p => p.proposalQuality > 8);
    if (qualityProposals.length / projects.length > 0.7) {
      advantages.push('High Quality Proposals');
    }
    
    return advantages;
  }
}

export const builderAnalyticsService = new BuilderAnalyticsService();