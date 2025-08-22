// Quote management service for builder quote submission and analysis

import { DynamoDBService } from '@/lib/aws/dynamodb';
import { Quote, QuoteStatus, QuotePricing, ReferenceProject, QuoteAnalysis, RedFlag, TimelineAnalysis, PricingAnalysis, SoWDocument } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export class QuoteManagementService {
  private static readonly QUOTES_TABLE = 'uk-home-improvement-quotes';
  private static readonly PROJECTS_TABLE = 'uk-home-improvement-projects';

  /**
   * Submit a new quote for a project
   */
  static async submitQuote(
    projectId: string,
    builderId: string,
    quoteData: {
      pricing: QuotePricing;
      timeline: number; // working days
      startDate: Date;
      termsAndConditions: string;
      insuranceDocuments: string[]; // Document IDs
      referenceProjects: ReferenceProject[];
      amendments?: any[];
    }
  ): Promise<{ success: boolean; quoteId?: string; error?: string }> {
    try {
      // Validate required fields
      if (!quoteData.pricing || !quoteData.timeline || !quoteData.startDate || !quoteData.termsAndConditions) {
        return { success: false, error: 'Missing required fields' };
      }

      // Validate pricing
      if (quoteData.pricing.totalAmount <= 0) {
        return { success: false, error: 'Total amount must be greater than 0' };
      }

      const quoteId = uuidv4();
      
      // Calculate projected completion date
      const projectedCompletionDate = this.calculateCompletionDate(
        quoteData.startDate,
        quoteData.timeline
      );

      const quote: Quote = {
        id: quoteId,
        projectId,
        builderId,
        pricing: quoteData.pricing,
        timeline: quoteData.timeline,
        startDate: quoteData.startDate,
        projectedCompletionDate,
        amendments: quoteData.amendments || [],
        termsAndConditions: quoteData.termsAndConditions,
        insuranceDocuments: quoteData.insuranceDocuments.map(docId => ({
          id: docId,
          name: '',
          type: 'insurance',
          url: '',
          uploadedAt: new Date(),
          size: 0
        })),
        referenceProjects: quoteData.referenceProjects,
        status: 'submitted',
        submittedAt: new Date(),
      };

      // Store quote in DynamoDB
      await DynamoDBService.putItem(this.QUOTES_TABLE, {
        ...quote,
        startDate: quote.startDate.toISOString(),
        projectedCompletionDate: quote.projectedCompletionDate.toISOString(),
        submittedAt: quote.submittedAt.toISOString(),
        referenceProjects: quote.referenceProjects.map(ref => ({
          ...ref,
          completionDate: ref.completionDate.toISOString()
        }))
      });

      // Update project with new quote
      await this.updateProjectWithQuote(projectId, quoteId, builderId);

      // Trigger AI analysis asynchronously
      this.analyzeQuoteAsync(quoteId, projectId);

      return { success: true, quoteId };
    } catch (error) {
      console.error('Error submitting quote:', error);
      return { success: false, error: 'Failed to submit quote' };
    }
  }

  /**
   * Get quote by ID
   */
  static async getQuote(quoteId: string): Promise<{ success: boolean; quote?: Quote; error?: string }> {
    try {
      const result = await DynamoDBService.getItem(this.QUOTES_TABLE, { id: quoteId });
      
      if (!result.Item) {
        return { success: false, error: 'Quote not found' };
      }

      const quote: Quote = {
        ...result.Item,
        startDate: new Date(result.Item.startDate),
        projectedCompletionDate: new Date(result.Item.projectedCompletionDate),
        submittedAt: new Date(result.Item.submittedAt),
        referenceProjects: result.Item.referenceProjects?.map((ref: any) => ({
          ...ref,
          completionDate: new Date(ref.completionDate)
        })) || []
      } as Quote;

      return { success: true, quote };
    } catch (error) {
      console.error('Error getting quote:', error);
      return { success: false, error: 'Failed to get quote' };
    }
  }

  /**
   * Get all quotes for a project
   */
  static async getProjectQuotes(projectId: string): Promise<{ success: boolean; quotes?: Quote[]; error?: string }> {
    try {
      const result = await DynamoDBService.queryItems(
        this.QUOTES_TABLE,
        'ProjectIndex',
        { projectId }
      );

      const quotes: Quote[] = result.Items?.map(item => ({
        ...item,
        startDate: new Date(item.startDate),
        projectedCompletionDate: new Date(item.projectedCompletionDate),
        submittedAt: new Date(item.submittedAt),
        referenceProjects: item.referenceProjects?.map((ref: any) => ({
          ...ref,
          completionDate: new Date(ref.completionDate)
        })) || []
      })) as Quote[] || [];

      return { success: true, quotes };
    } catch (error) {
      console.error('Error getting project quotes:', error);
      return { success: false, error: 'Failed to get project quotes' };
    }
  }

  /**
   * Get all quotes for a builder
   */
  static async getBuilderQuotes(builderId: string): Promise<{ success: boolean; quotes?: Quote[]; error?: string }> {
    try {
      const result = await DynamoDBService.queryItems(
        this.QUOTES_TABLE,
        'BuilderIndex',
        { builderId }
      );

      const quotes: Quote[] = result.Items?.map(item => ({
        ...item,
        startDate: new Date(item.startDate),
        projectedCompletionDate: new Date(item.projectedCompletionDate),
        submittedAt: new Date(item.submittedAt),
        referenceProjects: item.referenceProjects?.map((ref: any) => ({
          ...ref,
          completionDate: new Date(ref.completionDate)
        })) || []
      })) as Quote[] || [];

      return { success: true, quotes };
    } catch (error) {
      console.error('Error getting builder quotes:', error);
      return { success: false, error: 'Failed to get builder quotes' };
    }
  }

  /**
   * Update quote status
   */
  static async updateQuoteStatus(
    quoteId: string,
    status: QuoteStatus
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await DynamoDBService.updateItem(
        this.QUOTES_TABLE,
        { id: quoteId },
        { status }
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating quote status:', error);
      return { success: false, error: 'Failed to update quote status' };
    }
  }

  /**
   * Calculate working days completion date (excluding weekends)
   */
  private static calculateCompletionDate(startDate: Date, workingDays: number): Date {
    const completionDate = new Date(startDate);
    let daysAdded = 0;
    
    // If start date is a weekend, move to next Monday
    while (completionDate.getDay() === 0 || completionDate.getDay() === 6) {
      completionDate.setDate(completionDate.getDate() + 1);
    }
    
    while (daysAdded < workingDays) {
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (completionDate.getDay() !== 0 && completionDate.getDay() !== 6) {
        daysAdded++;
      }
      
      if (daysAdded < workingDays) {
        completionDate.setDate(completionDate.getDate() + 1);
      }
    }
    
    return completionDate;
  }

  /**
   * Update project with new quote information
   */
  private static async updateProjectWithQuote(
    projectId: string,
    quoteId: string,
    builderId: string
  ): Promise<void> {
    try {
      // Get current project
      const projectResult = await DynamoDBService.getItem(this.PROJECTS_TABLE, { id: projectId });
      
      if (projectResult.Item) {
        const currentQuotes = projectResult.Item.quotes || [];
        const updatedQuotes = [...currentQuotes, quoteId];
        
        // Update builder invitation status
        const invitedBuilders = projectResult.Item.invitedBuilders || [];
        const updatedInvitedBuilders = invitedBuilders.map((invitation: any) => {
          if (invitation.builderId === builderId) {
            return {
              ...invitation,
              quoteSubmitted: true,
              quoteId,
              status: 'quoted'
            };
          }
          return invitation;
        });

        await DynamoDBService.updateItem(
          this.PROJECTS_TABLE,
          { id: projectId },
          {
            quotes: updatedQuotes,
            invitedBuilders: updatedInvitedBuilders,
            status: 'quote_collection'
          }
        );
      }
    } catch (error) {
      console.error('Error updating project with quote:', error);
    }
  }

  /**
   * Analyze quote using AI (async operation)
   */
  private static async analyzeQuoteAsync(quoteId: string, projectId: string): Promise<void> {
    try {
      // Get project SoW for comparison
      const projectResult = await DynamoDBService.getItem(this.PROJECTS_TABLE, { id: projectId });
      const sowDocument = projectResult.Item?.sowDocument as SoWDocument;
      
      // Get the quote
      const quoteResult = await this.getQuote(quoteId);
      if (!quoteResult.success || !quoteResult.quote) return;
      
      const quote = quoteResult.quote;
      
      // Perform AI analysis
      const analysis = await this.performQuoteAnalysis(quote, sowDocument);
      
      // Update quote with analysis
      await DynamoDBService.updateItem(
        this.QUOTES_TABLE,
        { id: quoteId },
        { aiAnalysis: analysis }
      );
      
    } catch (error) {
      console.error('Error analyzing quote:', error);
    }
  }

  /**
   * Perform AI-powered quote analysis
   */
  private static async performQuoteAnalysis(
    quote: Quote,
    sowDocument?: SoWDocument
  ): Promise<QuoteAnalysis> {
    const redFlags: RedFlag[] = [];
    
    // Timeline analysis
    const timelineAnalysis: TimelineAnalysis = {
      isRealistic: true,
      comparedToAverage: 0,
      concerns: [],
      recommendations: []
    };

    // Pricing analysis
    const pricingAnalysis: PricingAnalysis = {
      comparedToEstimate: 0,
      comparedToMarket: 0,
      unusualItems: [],
      recommendations: []
    };

    // Check for pricing red flags
    if (sowDocument?.estimatedCosts) {
      const variance = ((quote.pricing.totalAmount - sowDocument.estimatedCosts.totalEstimate) / sowDocument.estimatedCosts.totalEstimate) * 100;
      pricingAnalysis.comparedToEstimate = variance;
      
      if (Math.abs(variance) > 30) {
        redFlags.push({
          type: 'pricing',
          severity: variance > 50 ? 'high' : 'medium',
          description: `Quote is ${Math.abs(variance).toFixed(1)}% ${variance > 0 ? 'higher' : 'lower'} than estimated`,
          recommendation: variance > 0 ? 'Request detailed breakdown of additional costs' : 'Verify if all work is included in the lower quote'
        });
      }
    }

    // Check timeline red flags
    if (sowDocument?.timeline) {
      const estimatedDays = sowDocument.timeline.reduce((total, task) => total + task.duration, 0);
      const timelineVariance = ((quote.timeline - estimatedDays) / estimatedDays) * 100;
      timelineAnalysis.comparedToAverage = timelineVariance;
      
      if (Math.abs(timelineVariance) > 25) {
        redFlags.push({
          type: 'timeline',
          severity: Math.abs(timelineVariance) > 50 ? 'high' : 'medium',
          description: `Timeline is ${Math.abs(timelineVariance).toFixed(1)}% ${timelineVariance > 0 ? 'longer' : 'shorter'} than estimated`,
          recommendation: timelineVariance < 0 ? 'Verify if builder has adequate resources for accelerated timeline' : 'Ask for detailed project schedule'
        });
      }
    }

    // Check documentation red flags
    if (!quote.insuranceDocuments || quote.insuranceDocuments.length === 0) {
      redFlags.push({
        type: 'documentation',
        severity: 'high',
        description: 'No insurance documents provided',
        recommendation: 'Request valid public liability and employer liability insurance certificates'
      });
    }

    if (!quote.referenceProjects || quote.referenceProjects.length === 0) {
      redFlags.push({
        type: 'references',
        severity: 'medium',
        description: 'No reference projects provided',
        recommendation: 'Request recent project references with contact details'
      });
    }

    // Determine overall risk
    const highRiskFlags = redFlags.filter(flag => flag.severity === 'high').length;
    const mediumRiskFlags = redFlags.filter(flag => flag.severity === 'medium').length;
    
    let overallRisk: 'low' | 'medium' | 'high' = 'low';
    if (highRiskFlags > 0 || mediumRiskFlags > 2) {
      overallRisk = 'high';
    } else if (mediumRiskFlags > 0) {
      overallRisk = 'medium';
    }

    return {
      redFlags,
      timelineAnalysis,
      pricingAnalysis,
      overallRisk
    };
  }
}