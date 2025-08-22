import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

export interface QuoteVarianceMetrics {
  projectId: string;
  projectType: string;
  aiEstimate: number;
  actualQuotes: number[];
  averageQuote: number;
  variancePercentage: number;
  builderCount: number;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface BuilderPerformanceMetrics {
  builderId: string;
  builderName: string;
  totalProjectsQuoted: number;
  totalProjectsWon: number;
  winRate: number;
  averageQuoteVariance: number;
  averageRating: number;
  totalRatings: number;
  responseTime: number; // hours to submit quote
  completionRate: number;
  recentProjects: ProjectSummary[];
}

export interface PlatformUsageMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalProjects: number;
  completedProjects: number;
  projectsByType: Record<string, number>;
  conversionRate: number; // projects that get quotes
  contractSigningRate: number;
  averageProjectValue: number;
  monthlyGrowth: number;
}

export interface FinancialMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  subscriptionRevenue: number;
  leadSalesRevenue: number;
  discountUsage: number;
  churnRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  costPerAcquisition: number;
}

export interface ProjectSummary {
  projectId: string;
  projectType: string;
  status: string;
  createdAt: Date;
  completedAt?: Date;
  finalValue?: number;
  rating?: number;
}

export interface AdminInvitationData {
  projectId: string;
  homeownerName: string;
  projectType: string;
  postcode: string;
  estimatedValue: number;
  createdAt: Date;
  status: 'pending' | 'invited' | 'quoted' | 'contracted';
  invitedBuilders: string[];
  availableBuilders: string[];
}

class AdminAnalyticsService {
  private dynamoClient: DynamoDBDocumentClient;

  constructor(dynamoClient?: DynamoDBDocumentClient) {
    if (dynamoClient) {
      this.dynamoClient = dynamoClient;
    } else {
      const client = new DynamoDBClient({
        region: process.env.AWS_REGION || 'eu-west-2'
      });
      this.dynamoClient = DynamoDBDocumentClient.from(client);
    }
  }

  async getQuoteVarianceMetrics(
    startDate: Date,
    endDate: Date,
    projectType?: string
  ): Promise<QuoteVarianceMetrics[]> {
    try {
      const params = {
        TableName: 'Projects',
        FilterExpression: 'createdAt BETWEEN :start AND :end',
        ExpressionAttributeValues: {
          ':start': startDate.toISOString(),
          ':end': endDate.toISOString()
        }
      };

      if (projectType) {
        params.FilterExpression += ' AND projectType = :projectType';
        params.ExpressionAttributeValues[':projectType'] = projectType;
      }

      const result = await this.dynamoClient.send(new ScanCommand(params));
      const projects = result.Items || [];

      const metrics: QuoteVarianceMetrics[] = [];

      for (const project of projects) {
        if (project.aiEstimate && project.quotes && project.quotes.length > 0) {
          const quotes = project.quotes.map((q: any) => q.totalAmount);
          const averageQuote = quotes.reduce((sum: number, quote: number) => sum + quote, 0) / quotes.length;
          const variancePercentage = ((averageQuote - project.aiEstimate) / project.aiEstimate) * 100;

          metrics.push({
            projectId: project.id,
            projectType: project.projectType,
            aiEstimate: project.aiEstimate,
            actualQuotes: quotes,
            averageQuote,
            variancePercentage,
            builderCount: quotes.length,
            dateRange: {
              start: new Date(project.createdAt),
              end: new Date(project.updatedAt)
            }
          });
        }
      }

      return metrics;
    } catch (error) {
      console.error('Error getting quote variance metrics:', error);
      throw new Error('Failed to retrieve quote variance metrics');
    }
  }

  async getBuilderPerformanceMetrics(
    builderId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<BuilderPerformanceMetrics[]> {
    try {
      let builders: any[] = [];

      if (builderId) {
        const builderResult = await this.dynamoClient.send(new QueryCommand({
          TableName: 'Builders',
          KeyConditionExpression: 'id = :builderId',
          ExpressionAttributeValues: {
            ':builderId': builderId
          }
        }));
        builders = builderResult.Items || [];
      } else {
        const buildersResult = await this.dynamoClient.send(new ScanCommand({
          TableName: 'Builders'
        }));
        builders = buildersResult.Items || [];
      }

      const metrics: BuilderPerformanceMetrics[] = [];

      for (const builder of builders) {
        // Get quotes for this builder
        const quotesResult = await this.dynamoClient.send(new QueryCommand({
          TableName: 'Quotes',
          IndexName: 'BuilderIdIndex',
          KeyConditionExpression: 'builderId = :builderId',
          ExpressionAttributeValues: {
            ':builderId': builder.id
          }
        }));

        const quotes = quotesResult.Items || [];
        const quotedProjects = quotes.length;
        const wonProjects = quotes.filter(q => q.status === 'selected').length;
        const winRate = quotedProjects > 0 ? (wonProjects / quotedProjects) * 100 : 0;

        // Calculate average quote variance
        const varianceSum = quotes.reduce((sum, quote) => {
          return sum + (quote.varianceFromEstimate || 0);
        }, 0);
        const averageQuoteVariance = quotedProjects > 0 ? varianceSum / quotedProjects : 0;

        // Get ratings
        const ratingsResult = await this.dynamoClient.send(new QueryCommand({
          TableName: 'Ratings',
          IndexName: 'BuilderIdIndex',
          KeyConditionExpression: 'builderId = :builderId',
          ExpressionAttributeValues: {
            ':builderId': builder.id
          }
        }));

        const ratings = ratingsResult.Items || [];
        const totalRatings = ratings.length;
        const averageRating = totalRatings > 0 
          ? ratings.reduce((sum, rating) => sum + rating.score, 0) / totalRatings 
          : 0;

        // Calculate response time
        const responseTimes = quotes
          .filter(q => q.submittedAt && q.invitedAt)
          .map(q => {
            const invited = new Date(q.invitedAt);
            const submitted = new Date(q.submittedAt);
            return (submitted.getTime() - invited.getTime()) / (1000 * 60 * 60); // hours
          });
        
        const averageResponseTime = responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
          : 0;

        // Get recent projects
        const recentProjects: ProjectSummary[] = quotes
          .slice(0, 5)
          .map(quote => ({
            projectId: quote.projectId,
            projectType: quote.projectType || 'Unknown',
            status: quote.status,
            createdAt: new Date(quote.createdAt),
            completedAt: quote.completedAt ? new Date(quote.completedAt) : undefined,
            finalValue: quote.totalAmount,
            rating: ratings.find(r => r.projectId === quote.projectId)?.score
          }));

        metrics.push({
          builderId: builder.id,
          builderName: builder.companyName || builder.name,
          totalProjectsQuoted: quotedProjects,
          totalProjectsWon: wonProjects,
          winRate,
          averageQuoteVariance,
          averageRating,
          totalRatings,
          responseTime: averageResponseTime,
          completionRate: 0, // TODO: Calculate from project completion data
          recentProjects
        });
      }

      return metrics;
    } catch (error) {
      console.error('Error getting builder performance metrics:', error);
      throw new Error('Failed to retrieve builder performance metrics');
    }
  }

  async getPlatformUsageMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<PlatformUsageMetrics> {
    try {
      // Get user metrics
      const usersResult = await this.dynamoClient.send(new ScanCommand({
        TableName: 'Users'
      }));
      const users = usersResult.Items || [];
      
      const totalUsers = users.length;
      const activeUsers = users.filter(u => {
        const lastLogin = new Date(u.lastLogin);
        return lastLogin >= startDate && lastLogin <= endDate;
      }).length;

      const newUsersThisMonth = users.filter(u => {
        const createdAt = new Date(u.createdAt);
        return createdAt >= startDate && createdAt <= endDate;
      }).length;

      // Get project metrics
      const projectsResult = await this.dynamoClient.send(new ScanCommand({
        TableName: 'Projects'
      }));
      const projects = projectsResult.Items || [];

      const totalProjects = projects.length;
      const completedProjects = projects.filter(p => p.status === 'completed').length;

      // Projects by type
      const projectsByType: Record<string, number> = {};
      projects.forEach(project => {
        const type = project.projectType || 'Unknown';
        projectsByType[type] = (projectsByType[type] || 0) + 1;
      });

      // Conversion rates
      const projectsWithQuotes = projects.filter(p => p.quotes && p.quotes.length > 0).length;
      const conversionRate = totalProjects > 0 ? (projectsWithQuotes / totalProjects) * 100 : 0;

      const projectsWithContracts = projects.filter(p => p.contractId).length;
      const contractSigningRate = projectsWithQuotes > 0 ? (projectsWithContracts / projectsWithQuotes) * 100 : 0;

      // Average project value
      const projectValues = projects
        .filter(p => p.finalValue)
        .map(p => p.finalValue);
      const averageProjectValue = projectValues.length > 0
        ? projectValues.reduce((sum, value) => sum + value, 0) / projectValues.length
        : 0;

      return {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        totalProjects,
        completedProjects,
        projectsByType,
        conversionRate,
        contractSigningRate,
        averageProjectValue,
        monthlyGrowth: 0 // TODO: Calculate month-over-month growth
      };
    } catch (error) {
      console.error('Error getting platform usage metrics:', error);
      throw new Error('Failed to retrieve platform usage metrics');
    }
  }

  async getFinancialMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<FinancialMetrics> {
    try {
      // Get payment data
      const paymentsResult = await this.dynamoClient.send(new ScanCommand({
        TableName: 'Payments',
        FilterExpression: 'createdAt BETWEEN :start AND :end',
        ExpressionAttributeValues: {
          ':start': startDate.toISOString(),
          ':end': endDate.toISOString()
        }
      }));
      const payments = paymentsResult.Items || [];

      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      const subscriptionPayments = payments.filter(p => p.type === 'subscription');
      const subscriptionRevenue = subscriptionPayments.reduce((sum, payment) => sum + payment.amount, 0);

      const leadSalesPayments = payments.filter(p => p.type === 'lead_purchase');
      const leadSalesRevenue = leadSalesPayments.reduce((sum, payment) => sum + payment.amount, 0);

      // Get subscription data for MRR calculation
      const subscriptionsResult = await this.dynamoClient.send(new ScanCommand({
        TableName: 'Subscriptions',
        FilterExpression: '#status = :active',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':active': 'active'
        }
      }));
      const activeSubscriptions = subscriptionsResult.Items || [];
      const monthlyRecurringRevenue = activeSubscriptions.reduce((sum, sub) => sum + sub.monthlyAmount, 0);

      // Get discount usage
      const discountPayments = payments.filter(p => p.discountApplied);
      const discountUsage = discountPayments.reduce((sum, payment) => sum + payment.discountAmount, 0);

      return {
        totalRevenue,
        monthlyRecurringRevenue,
        subscriptionRevenue,
        leadSalesRevenue,
        discountUsage,
        churnRate: 0, // TODO: Calculate churn rate
        averageRevenuePerUser: 0, // TODO: Calculate ARPU
        lifetimeValue: 0, // TODO: Calculate LTV
        costPerAcquisition: 0 // TODO: Calculate CAC
      };
    } catch (error) {
      console.error('Error getting financial metrics:', error);
      throw new Error('Failed to retrieve financial metrics');
    }
  }

  async getProjectsForInvitation(
    postcode?: string,
    projectType?: string,
    status?: string
  ): Promise<AdminInvitationData[]> {
    try {
      let filterExpression = '';
      const expressionAttributeValues: any = {};

      if (postcode) {
        filterExpression += 'contains(postcode, :postcode)';
        expressionAttributeValues[':postcode'] = postcode;
      }

      if (projectType) {
        if (filterExpression) filterExpression += ' AND ';
        filterExpression += 'projectType = :projectType';
        expressionAttributeValues[':projectType'] = projectType;
      }

      if (status) {
        if (filterExpression) filterExpression += ' AND ';
        filterExpression += '#status = :status';
        expressionAttributeValues[':status'] = status;
      }

      const params: any = {
        TableName: 'Projects'
      };

      if (filterExpression) {
        params.FilterExpression = filterExpression;
        params.ExpressionAttributeValues = expressionAttributeValues;
        if (status) {
          params.ExpressionAttributeNames = { '#status': 'status' };
        }
      }

      const result = await this.dynamoClient.send(new ScanCommand(params));
      const projects = result.Items || [];

      const invitationData: AdminInvitationData[] = [];

      for (const project of projects) {
        // Get homeowner details
        const homeownerResult = await this.dynamoClient.send(new QueryCommand({
          TableName: 'Users',
          KeyConditionExpression: 'id = :homeownerId',
          ExpressionAttributeValues: {
            ':homeownerId': project.homeownerId
          }
        }));
        const homeowner = homeownerResult.Items?.[0];

        // Get available builders for this project
        const buildersResult = await this.dynamoClient.send(new ScanCommand({
          TableName: 'Builders',
          FilterExpression: 'contains(serviceAreas, :postcode) AND contains(specializations, :projectType)',
          ExpressionAttributeValues: {
            ':postcode': project.postcode,
            ':projectType': project.projectType
          }
        }));
        const availableBuilders = buildersResult.Items || [];

        invitationData.push({
          projectId: project.id,
          homeownerName: homeowner?.name || 'Unknown',
          projectType: project.projectType,
          postcode: project.postcode,
          estimatedValue: project.aiEstimate || 0,
          createdAt: new Date(project.createdAt),
          status: project.status,
          invitedBuilders: project.invitedBuilders || [],
          availableBuilders: availableBuilders.map(b => b.id)
        });
      }

      return invitationData;
    } catch (error) {
      console.error('Error getting projects for invitation:', error);
      throw new Error('Failed to retrieve projects for invitation');
    }
  }

  async inviteBuilderToProject(
    projectId: string,
    builderId: string,
    adminId: string
  ): Promise<void> {
    try {
      // Generate invitation code
      const invitationCode = Math.random().toString(36).substring(2, 15);

      // Update project with new invitation
      await this.dynamoClient.send(new QueryCommand({
        TableName: 'Projects',
        Key: { id: projectId },
        UpdateExpression: 'SET invitedBuilders = list_append(if_not_exists(invitedBuilders, :empty_list), :new_invitation)',
        ExpressionAttributeValues: {
          ':empty_list': [],
          ':new_invitation': [{
            builderId,
            invitationCode,
            invitedAt: new Date().toISOString(),
            invitedBy: adminId,
            status: 'invited'
          }]
        }
      }));

      // TODO: Send notification to builder
      console.log(`Builder ${builderId} invited to project ${projectId} with code ${invitationCode}`);
    } catch (error) {
      console.error('Error inviting builder to project:', error);
      throw new Error('Failed to invite builder to project');
    }
  }
}

export { AdminAnalyticsService };
export const adminAnalyticsService = new AdminAnalyticsService();