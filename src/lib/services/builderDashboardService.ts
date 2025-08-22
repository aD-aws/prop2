import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Project, Quote, BuilderProfile, ProjectStatus, QuoteStatus } from '@/lib/types';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-2' });
const docClient = DynamoDBDocumentClient.from(client);

export interface BuilderDashboardData {
  builder: BuilderProfile;
  projectsInvitedTo: Project[];
  projectsQuotedFor: Project[];
  projectsWon: Project[];
  projectsCompleted: Project[];
  quotes: Quote[];
  analytics: BuilderAnalytics;
}

export interface BuilderAnalytics {
  totalProjectsInvited: number;
  totalQuotesSubmitted: number;
  totalProjectsWon: number;
  totalProjectsCompleted: number;
  winRate: number; // percentage
  averageQuoteValue: number;
  totalRevenue: number;
  currentMonthInvitations: number;
  currentMonthQuotes: number;
  currentMonthWins: number;
  topProjectTypes: Array<{
    projectType: string;
    count: number;
    winRate: number;
  }>;
  recentActivity: Array<{
    type: 'invitation' | 'quote_submitted' | 'project_won' | 'project_completed';
    projectId: string;
    date: Date;
    description: string;
  }>;
}

export interface QuoteSubmissionData {
  projectId: string;
  builderId: string;
  pricing: {
    totalAmount: number;
    laborCosts: number;
    materialCosts: number;
    breakdown: Array<{
      category: string;
      description: string;
      amount: number;
      unit?: string;
      quantity?: number;
    }>;
  };
  timeline: number; // working days
  startDate: Date;
  amendments?: Array<{
    section: string;
    originalText: string;
    proposedText: string;
    reason: string;
  }>;
  termsAndConditions: string;
  insuranceDocuments: string[]; // Document IDs
  referenceProjects: Array<{
    address: string;
    projectType: string;
    completionDate: Date;
    contactAllowed: boolean;
    visitAllowed: boolean;
    description: string;
  }>;
}

export class BuilderDashboardService {
  private readonly projectsTable = process.env.PROJECTS_TABLE || 'uk-home-improvement-projects';
  private readonly quotesTable = process.env.QUOTES_TABLE || 'uk-home-improvement-quotes';
  private readonly usersTable = process.env.USERS_TABLE || 'uk-home-improvement-users';
  private readonly invitationsTable = process.env.INVITATIONS_TABLE || 'uk-home-improvement-invitations';

  /**
   * Get comprehensive dashboard data for a builder
   */
  async getDashboardData(builderId: string): Promise<BuilderDashboardData> {
    const [builder, projects, quotes] = await Promise.all([
      this.getBuilderProfile(builderId),
      this.getBuilderProjects(builderId),
      this.getBuilderQuotes(builderId),
    ]);

    if (!builder) {
      throw new Error('Builder not found');
    }

    const analytics = this.calculateAnalytics(projects, quotes);

    return {
      builder,
      projectsInvitedTo: projects.filter(p => this.isInvitedToProject(builderId, p)),
      projectsQuotedFor: projects.filter(p => this.hasQuotedForProject(builderId, p, quotes)),
      projectsWon: projects.filter(p => p.selectedBuilderId === builderId),
      projectsCompleted: projects.filter(p => p.selectedBuilderId === builderId && p.status === 'completion'),
      quotes,
      analytics,
    };
  }

  /**
   * Get builder profile
   */
  private async getBuilderProfile(builderId: string): Promise<BuilderProfile | null> {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: this.usersTable,
        Key: { userId: builderId },
      }));

      return result.Item?.profile as BuilderProfile || null;
    } catch (error) {
      console.error('Error fetching builder profile:', error);
      return null;
    }
  }

  /**
   * Get all projects where builder has been invited or has access
   */
  private async getBuilderProjects(builderId: string): Promise<Project[]> {
    try {
      // Get all projects where builder is invited
      const invitationsResult = await docClient.send(new QueryCommand({
        TableName: this.invitationsTable,
        IndexName: 'BuilderIndex',
        KeyConditionExpression: 'builderId = :builderId',
        ExpressionAttributeValues: {
          ':builderId': builderId,
        },
      }));

      const projectIds = invitationsResult.Items?.map(inv => inv.projectId) || [];

      if (projectIds.length === 0) {
        return [];
      }

      // Get project details for all invited projects
      const projects: Project[] = [];
      for (const projectId of projectIds) {
        try {
          const projectResult = await docClient.send(new GetCommand({
            TableName: this.projectsTable,
            Key: { projectId },
          }));

          if (projectResult.Item) {
            projects.push(projectResult.Item as Project);
          }
        } catch (error) {
          console.error(`Error fetching project ${projectId}:`, error);
        }
      }

      return projects;
    } catch (error) {
      console.error('Error fetching builder projects:', error);
      return [];
    }
  }

  /**
   * Get all quotes submitted by builder
   */
  private async getBuilderQuotes(builderId: string): Promise<Quote[]> {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: this.quotesTable,
        IndexName: 'BuilderIndex',
        KeyConditionExpression: 'builderId = :builderId',
        ExpressionAttributeValues: {
          ':builderId': builderId,
        },
      }));

      return result.Items as Quote[] || [];
    } catch (error) {
      console.error('Error fetching builder quotes:', error);
      return [];
    }
  }

  /**
   * Submit a new quote for a project
   */
  async submitQuote(quoteData: QuoteSubmissionData): Promise<Quote> {
    const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const quote: Quote = {
      id: quoteId,
      projectId: quoteData.projectId,
      builderId: quoteData.builderId,
      pricing: quoteData.pricing,
      timeline: quoteData.timeline,
      startDate: quoteData.startDate,
      projectedCompletionDate: this.calculateCompletionDate(quoteData.startDate, quoteData.timeline),
      amendments: quoteData.amendments || [],
      termsAndConditions: quoteData.termsAndConditions,
      insuranceDocuments: [], // Will be populated with actual Document objects
      referenceProjects: quoteData.referenceProjects,
      status: 'submitted',
      submittedAt: new Date(),
    };

    try {
      await docClient.send(new UpdateCommand({
        TableName: this.quotesTable,
        Key: { quoteId },
        UpdateExpression: 'SET #quote = :quote',
        ExpressionAttributeNames: {
          '#quote': 'quote',
        },
        ExpressionAttributeValues: {
          ':quote': quote,
        },
      }));

      // Update project with quote information
      await this.updateProjectWithQuote(quoteData.projectId, quoteData.builderId, quoteId);

      return quote;
    } catch (error) {
      console.error('Error submitting quote:', error);
      throw new Error('Failed to submit quote');
    }
  }

  /**
   * Update an existing quote
   */
  async updateQuote(quoteId: string, updates: Partial<QuoteSubmissionData>): Promise<Quote> {
    try {
      const existingQuote = await this.getQuote(quoteId);
      if (!existingQuote) {
        throw new Error('Quote not found');
      }

      const updatedQuote: Quote = {
        ...existingQuote,
        ...(updates.pricing && { pricing: updates.pricing }),
        ...(updates.timeline && { 
          timeline: updates.timeline,
          projectedCompletionDate: this.calculateCompletionDate(
            updates.startDate || existingQuote.startDate, 
            updates.timeline
          ),
        }),
        ...(updates.startDate && { startDate: updates.startDate }),
        ...(updates.amendments && { amendments: updates.amendments }),
        ...(updates.termsAndConditions && { termsAndConditions: updates.termsAndConditions }),
        ...(updates.referenceProjects && { referenceProjects: updates.referenceProjects }),
        status: 'submitted', // Reset to submitted when updated
        submittedAt: new Date(),
      };

      await docClient.send(new UpdateCommand({
        TableName: this.quotesTable,
        Key: { quoteId },
        UpdateExpression: 'SET #quote = :quote',
        ExpressionAttributeNames: {
          '#quote': 'quote',
        },
        ExpressionAttributeValues: {
          ':quote': updatedQuote,
        },
      }));

      return updatedQuote;
    } catch (error) {
      console.error('Error updating quote:', error);
      throw new Error('Failed to update quote');
    }
  }

  /**
   * Get a specific quote
   */
  async getQuote(quoteId: string): Promise<Quote | null> {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: this.quotesTable,
        Key: { quoteId },
      }));

      return result.Item as Quote || null;
    } catch (error) {
      console.error('Error fetching quote:', error);
      return null;
    }
  }

  /**
   * Get project details that builder has access to
   */
  async getProjectDetails(projectId: string, builderId: string): Promise<Project | null> {
    try {
      // Verify builder has access to this project
      const hasAccess = await this.verifyProjectAccess(projectId, builderId);
      if (!hasAccess) {
        throw new Error('Access denied to this project');
      }

      const result = await docClient.send(new GetCommand({
        TableName: this.projectsTable,
        Key: { projectId },
      }));

      return result.Item as Project || null;
    } catch (error) {
      console.error('Error fetching project details:', error);
      return null;
    }
  }

  /**
   * Calculate analytics for builder dashboard
   */
  private calculateAnalytics(projects: Project[], quotes: Quote[]): BuilderAnalytics {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const projectsWon = projects.filter(p => p.selectedBuilderId);
    const projectsCompleted = projects.filter(p => p.status === 'completion');
    
    const winRate = quotes.length > 0 ? (projectsWon.length / quotes.length) * 100 : 0;
    const averageQuoteValue = quotes.length > 0 
      ? quotes.reduce((sum, q) => sum + q.pricing.totalAmount, 0) / quotes.length 
      : 0;
    
    const totalRevenue = projectsWon.reduce((sum, p) => {
      const quote = quotes.find(q => q.projectId === p.id);
      return sum + (quote?.pricing.totalAmount || 0);
    }, 0);

    // Current month statistics
    const currentMonthInvitations = projects.filter(p => {
      const createdDate = new Date(p.createdAt);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    }).length;

    const currentMonthQuotes = quotes.filter(q => {
      const submittedDate = new Date(q.submittedAt);
      return submittedDate.getMonth() === currentMonth && submittedDate.getFullYear() === currentYear;
    }).length;

    const currentMonthWins = projectsWon.filter(p => {
      const updatedDate = new Date(p.updatedAt);
      return updatedDate.getMonth() === currentMonth && updatedDate.getFullYear() === currentYear;
    }).length;

    // Top project types
    const projectTypeCounts: Record<string, { count: number; wins: number }> = {};
    projects.forEach(p => {
      if (!projectTypeCounts[p.projectType]) {
        projectTypeCounts[p.projectType] = { count: 0, wins: 0 };
      }
      projectTypeCounts[p.projectType].count++;
      if (p.selectedBuilderId) {
        projectTypeCounts[p.projectType].wins++;
      }
    });

    const topProjectTypes = Object.entries(projectTypeCounts)
      .map(([type, data]) => ({
        projectType: type,
        count: data.count,
        winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent activity
    const recentActivity = [
      ...projects.map(p => ({
        type: 'invitation' as const,
        projectId: p.id,
        date: new Date(p.createdAt),
        description: `Invited to ${p.projectType} project`,
      })),
      ...quotes.map(q => ({
        type: 'quote_submitted' as const,
        projectId: q.projectId,
        date: new Date(q.submittedAt),
        description: `Submitted quote for £${q.pricing.totalAmount.toLocaleString()}`,
      })),
      ...projectsWon.map(p => ({
        type: 'project_won' as const,
        projectId: p.id,
        date: new Date(p.updatedAt),
        description: `Won ${p.projectType} project`,
      })),
      ...projectsCompleted.map(p => ({
        type: 'project_completed' as const,
        projectId: p.id,
        date: new Date(p.updatedAt),
        description: `Completed ${p.projectType} project`,
      })),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);

    return {
      totalProjectsInvited: projects.length,
      totalQuotesSubmitted: quotes.length,
      totalProjectsWon: projectsWon.length,
      totalProjectsCompleted: projectsCompleted.length,
      winRate,
      averageQuoteValue,
      totalRevenue,
      currentMonthInvitations,
      currentMonthQuotes,
      currentMonthWins,
      topProjectTypes,
      recentActivity,
    };
  }

  /**
   * Helper methods
   */
  private isInvitedToProject(builderId: string, project: Project): boolean {
    return project.invitedBuilders.some(inv => inv.builderId === builderId);
  }

  private hasQuotedForProject(builderId: string, project: Project, quotes: Quote[]): boolean {
    return quotes.some(q => q.projectId === project.id && q.builderId === builderId);
  }

  private calculateCompletionDate(startDate: Date, workingDays: number): Date {
    const completionDate = new Date(startDate);
    let daysAdded = 0;
    
    while (daysAdded < workingDays) {
      completionDate.setDate(completionDate.getDate() + 1);
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (completionDate.getDay() !== 0 && completionDate.getDay() !== 6) {
        daysAdded++;
      }
    }
    
    return completionDate;
  }

  private async updateProjectWithQuote(projectId: string, builderId: string, quoteId: string): Promise<void> {
    try {
      await docClient.send(new UpdateCommand({
        TableName: this.projectsTable,
        Key: { projectId },
        UpdateExpression: 'SET invitedBuilders[0].quoteSubmitted = :submitted, invitedBuilders[0].quoteId = :quoteId',
        ConditionExpression: 'attribute_exists(projectId)',
        ExpressionAttributeValues: {
          ':submitted': true,
          ':quoteId': quoteId,
        },
      }));
    } catch (error) {
      console.error('Error updating project with quote:', error);
    }
  }

  private async verifyProjectAccess(projectId: string, builderId: string): Promise<boolean> {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: this.invitationsTable,
        IndexName: 'ProjectIndex',
        KeyConditionExpression: 'projectId = :projectId',
        FilterExpression: 'builderId = :builderId',
        ExpressionAttributeValues: {
          ':projectId': projectId,
          ':builderId': builderId,
        },
      }));

      return (result.Items?.length || 0) > 0;
    } catch (error) {
      console.error('Error verifying project access:', error);
      return false;
    }
  }
}

export const builderDashboardService = new BuilderDashboardService();