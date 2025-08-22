import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Select } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { MarketingCampaign, PlanningApplication } from './planningPermissionDataMiningService';
import { gdprComplianceService } from './gdprComplianceService';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

export interface CampaignTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  channel: 'email' | 'sms' | 'postal';
  variables: string[]; // Available template variables like {name}, {address}, {projectType}
  createdAt: Date;
  isActive: boolean;
}

export interface CampaignMetrics {
  campaignId: string;
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  optedOut: number;
  bounced: number;
  complained: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  optOutRate: number;
}

export interface CampaignAudience {
  id: string;
  name: string;
  description: string;
  criteria: {
    councilAreas?: string[];
    projectTypes?: string[];
    postcodes?: string[];
    dateRange?: {
      from: Date;
      to: Date;
    };
    excludeOptedOut: boolean;
    excludeRecentContacts: boolean;
    recentContactDays?: number;
  };
  estimatedSize: number;
  lastUpdated: Date;
}

export class MarketingCampaignService {
  private readonly campaignTableName = 'MarketingCampaigns';
  private readonly templateTableName = 'CampaignTemplates';
  private readonly audienceTableName = 'CampaignAudiences';
  private readonly metricsTableName = 'CampaignMetrics';
  private readonly deliveryTableName = 'CampaignDeliveries';

  /**
   * Create a new marketing campaign
   */
  async createCampaign(campaign: Omit<MarketingCampaign, 'id' | 'createdAt' | 'sentCount' | 'responseCount' | 'optOutCount'>): Promise<MarketingCampaign> {
    // Validate GDPR compliance
    await this.validateCampaignCompliance(campaign);

    const newCampaign: MarketingCampaign = {
      id: uuidv4(),
      createdAt: new Date(),
      sentCount: 0,
      responseCount: 0,
      optOutCount: 0,
      ...campaign
    };

    await dynamodb.send(new PutCommand({
      TableName: this.campaignTableName,
      Item: newCampaign
    }));

    return newCampaign;
  }

  /**
   * Create campaign template
   */
  async createTemplate(template: Omit<CampaignTemplate, 'id' | 'createdAt'>): Promise<CampaignTemplate> {
    const newTemplate: CampaignTemplate = {
      id: uuidv4(),
      createdAt: new Date(),
      ...template
    };

    await dynamodb.send(new PutCommand({
      TableName: this.templateTableName,
      Item: newTemplate
    }));

    return newTemplate;
  }

  /**
   * Create campaign audience
   */
  async createAudience(audience: Omit<CampaignAudience, 'id' | 'estimatedSize' | 'lastUpdated'>): Promise<CampaignAudience> {
    // Calculate estimated audience size
    const estimatedSize = await this.calculateAudienceSize(audience.criteria);

    const newAudience: CampaignAudience = {
      id: uuidv4(),
      estimatedSize,
      lastUpdated: new Date(),
      ...audience
    };

    await dynamodb.send(new PutCommand({
      TableName: this.audienceTableName,
      Item: newAudience
    }));

    return newAudience;
  }

  /**
   * Execute marketing campaign with GDPR compliance
   */
  async executeCampaign(campaignId: string, templateId: string, audienceId: string): Promise<CampaignMetrics> {
    try {
      // Get campaign, template, and audience
      const [campaign, template, audience] = await Promise.all([
        this.getCampaign(campaignId),
        this.getTemplate(templateId),
        this.getAudience(audienceId)
      ]);

      if (!campaign || !template || !audience) {
        throw new Error('Campaign, template, or audience not found');
      }

      if (campaign.status !== 'active') {
        throw new Error('Campaign is not active');
      }

      // Get target prospects
      const prospects = await this.getAudienceProspects(audience);

      // Filter for GDPR compliance
      const eligibleProspects = await this.filterForCompliance(prospects, template.channel);

      // Initialize metrics
      const metrics: CampaignMetrics = {
        campaignId,
        totalSent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        optedOut: 0,
        bounced: 0,
        complained: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
        optOutRate: 0
      };

      // Send messages
      for (const prospect of eligibleProspects) {
        try {
          const success = await this.sendCampaignMessage(prospect, template, campaign);
          
          if (success) {
            metrics.totalSent++;
            metrics.delivered++;
            
            // Record delivery
            await this.recordDelivery(campaignId, prospect.id, template.channel, 'delivered');
            
            // Update contact tracking
            await this.updateProspectContactTracking(prospect.id);
          } else {
            metrics.bounced++;
            await this.recordDelivery(campaignId, prospect.id, template.channel, 'bounced');
          }

          // Rate limiting
          await this.delay(500); // 500ms between sends

        } catch (error) {
          console.error(`Error sending to prospect ${prospect.id}:`, error);
          metrics.bounced++;
          await this.recordDelivery(campaignId, prospect.id, template.channel, 'failed');
        }
      }

      // Calculate rates
      metrics.deliveryRate = metrics.totalSent > 0 ? (metrics.delivered / metrics.totalSent) * 100 : 0;

      // Store metrics
      await this.storeMetrics(metrics);

      // Update campaign stats
      await this.updateCampaignStats(campaignId, metrics.totalSent);

      return metrics;

    } catch (error) {
      console.error(`Error executing campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Handle campaign interactions (opens, clicks, conversions)
   */
  async recordInteraction(campaignId: string, prospectId: string, interactionType: 'open' | 'click' | 'convert' | 'opt_out' | 'complain'): Promise<void> {
    try {
      // Record the interaction
      await dynamodb.send(new PutCommand({
        TableName: 'CampaignInteractions',
        Item: {
          id: uuidv4(),
          campaignId,
          prospectId,
          interactionType,
          timestamp: new Date().toISOString(),
          ipAddress: '', // Would be captured from request
          userAgent: ''  // Would be captured from request
        }
      }));

      // Update metrics
      await this.updateMetrics(campaignId, interactionType);

      // Handle opt-out
      if (interactionType === 'opt_out') {
        const prospect = await this.getProspect(prospectId);
        if (prospect && prospect.applicantEmail) {
          await gdprComplianceService.recordOptOut({
            email: prospect.applicantEmail,
            phone: prospect.applicantPhone,
            optOutType: 'marketing',
            optOutSource: 'campaign_link',
            isGlobal: false
          });
        }
      }

    } catch (error) {
      console.error('Error recording interaction:', error);
      throw error;
    }
  }

  /**
   * Generate opt-out link for campaigns
   */
  generateOptOutLink(campaignId: string, prospectId: string): string {
    const token = this.generateSecureToken(campaignId, prospectId);
    return `https://platform.com/opt-out?campaign=${campaignId}&prospect=${prospectId}&token=${token}`;
  }

  /**
   * Generate tracking pixel for email opens
   */
  generateTrackingPixel(campaignId: string, prospectId: string): string {
    const token = this.generateSecureToken(campaignId, prospectId);
    return `https://platform.com/track/open?campaign=${campaignId}&prospect=${prospectId}&token=${token}`;
  }

  /**
   * Generate tracked links for click tracking
   */
  generateTrackedLink(campaignId: string, prospectId: string, originalUrl: string): string {
    const token = this.generateSecureToken(campaignId, prospectId);
    const encodedUrl = encodeURIComponent(originalUrl);
    return `https://platform.com/track/click?campaign=${campaignId}&prospect=${prospectId}&token=${token}&url=${encodedUrl}`;
  }

  /**
   * Get campaign performance metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics | null> {
    try {
      const result = await dynamodb.send(new GetCommand({
        TableName: this.metricsTableName,
        Key: { campaignId }
      }));

      return result.Item as CampaignMetrics || null;
    } catch (error) {
      console.error('Error getting campaign metrics:', error);
      return null;
    }
  }

  /**
   * Get campaign performance report
   */
  async getCampaignReport(campaignId: string): Promise<any> {
    try {
      const [campaign, metrics, interactions] = await Promise.all([
        this.getCampaign(campaignId),
        this.getCampaignMetrics(campaignId),
        this.getCampaignInteractions(campaignId)
      ]);

      return {
        campaign,
        metrics,
        interactions: {
          timeline: this.groupInteractionsByTime(interactions),
          breakdown: this.getInteractionBreakdown(interactions)
        },
        recommendations: this.generateRecommendations(metrics)
      };
    } catch (error) {
      console.error('Error generating campaign report:', error);
      throw error;
    }
  }

  // Private helper methods

  private async validateCampaignCompliance(campaign: Partial<MarketingCampaign>): Promise<void> {
    // Ensure campaign includes required GDPR elements
    if (!campaign.messageTemplate?.includes('opt-out') && !campaign.messageTemplate?.includes('unsubscribe')) {
      throw new Error('Campaign template must include opt-out mechanism');
    }

    // Validate targeting criteria don't violate GDPR
    if (campaign.targetCriteria && Object.keys(campaign.targetCriteria).length === 0) {
      throw new Error('Campaign must have specific targeting criteria');
    }
  }

  private async calculateAudienceSize(criteria: CampaignAudience['criteria']): Promise<number> {
    // Build query based on criteria
    let filterExpression = 'personalDataDeleted <> :deleted';
    const expressionValues: any = { ':deleted': true };

    if (criteria.excludeOptedOut) {
      filterExpression += ' AND marketingOptOut <> :optedOut';
      expressionValues[':optedOut'] = true;
    }

    if (criteria.councilAreas && criteria.councilAreas.length > 0) {
      filterExpression += ' AND councilArea IN (' + 
        criteria.councilAreas.map((_, i) => `:council${i}`).join(', ') + ')';
      criteria.councilAreas.forEach((area, i) => {
        expressionValues[`:council${i}`] = area;
      });
    }

    if (criteria.projectTypes && criteria.projectTypes.length > 0) {
      filterExpression += ' AND projectType IN (' + 
        criteria.projectTypes.map((_, i) => `:type${i}`).join(', ') + ')';
      criteria.projectTypes.forEach((type, i) => {
        expressionValues[`:type${i}`] = type;
      });
    }

    if (criteria.dateRange) {
      filterExpression += ' AND submissionDate BETWEEN :fromDate AND :toDate';
      expressionValues[':fromDate'] = criteria.dateRange.from.toISOString();
      expressionValues[':toDate'] = criteria.dateRange.to.toISOString();
    }

    const params = {
      TableName: 'PlanningApplications',
      Select: Select.COUNT,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionValues
    };

    const result = await dynamodb.send(new ScanCommand(params));
    return result.Count || 0;
  }

  private async getAudienceProspects(audience: CampaignAudience): Promise<PlanningApplication[]> {
    // Similar to calculateAudienceSize but returns actual records
    let filterExpression = 'personalDataDeleted <> :deleted';
    const expressionValues: any = { ':deleted': true };

    if (audience.criteria.excludeOptedOut) {
      filterExpression += ' AND marketingOptOut <> :optedOut';
      expressionValues[':optedOut'] = true;
    }

    // Add other criteria filters...

    const params = {
      TableName: 'PlanningApplications',
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionValues
    };

    const result = await dynamodb.send(new ScanCommand(params));
    return result.Items as PlanningApplication[] || [];
  }

  private async filterForCompliance(prospects: PlanningApplication[], channel: string): Promise<PlanningApplication[]> {
    const compliantProspects: PlanningApplication[] = [];

    for (const prospect of prospects) {
      // Check opt-out status
      const isOptedOut = await gdprComplianceService.isOptedOut(
        prospect.applicantEmail || '', 
        prospect.applicantPhone,
        'marketing'
      );

      if (!isOptedOut) {
        // Check if we have valid contact info for the channel
        if (channel === 'email' && prospect.applicantEmail) {
          compliantProspects.push(prospect);
        } else if (channel === 'sms' && prospect.applicantPhone) {
          compliantProspects.push(prospect);
        } else if (channel === 'postal' && prospect.applicantAddress) {
          compliantProspects.push(prospect);
        }
      }
    }

    return compliantProspects;
  }

  private async sendCampaignMessage(prospect: PlanningApplication, template: CampaignTemplate, campaign: MarketingCampaign): Promise<boolean> {
    try {
      // Personalize message
      const personalizedMessage = this.personalizeMessage(template.content, prospect, campaign.id);
      
      // Add tracking and opt-out links
      const finalMessage = this.addTrackingElements(personalizedMessage, campaign.id, prospect.id);

      // Send via appropriate channel
      switch (template.channel) {
        case 'email':
          return await this.sendEmail(prospect.applicantEmail!, template.subject, finalMessage);
        case 'sms':
          return await this.sendSMS(prospect.applicantPhone!, finalMessage);
        case 'postal':
          return await this.sendPostal(prospect.applicantAddress!, finalMessage);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error sending campaign message:', error);
      return false;
    }
  }

  private personalizeMessage(template: string, prospect: PlanningApplication, campaignId: string): string {
    let message = template;
    
    // Replace template variables
    message = message.replace(/{name}/g, prospect.applicantName || 'Homeowner');
    message = message.replace(/{address}/g, prospect.address || '');
    message = message.replace(/{projectType}/g, prospect.projectType || 'home improvement');
    message = message.replace(/{councilArea}/g, prospect.councilArea || '');
    
    return message;
  }

  private addTrackingElements(message: string, campaignId: string, prospectId: string): string {
    // Add opt-out link
    const optOutLink = this.generateOptOutLink(campaignId, prospectId);
    message += `\n\nTo opt out of future communications, click here: ${optOutLink}`;
    
    // Add tracking pixel for emails
    const trackingPixel = this.generateTrackingPixel(campaignId, prospectId);
    message += `<img src="${trackingPixel}" width="1" height="1" style="display:none;">`;
    
    return message;
  }

  private async sendEmail(email: string, subject: string, content: string): Promise<boolean> {
    // Implement email sending logic (SES, SendGrid, etc.)
    console.log(`Sending email to ${email}: ${subject}`);
    return true; // Mock success
  }

  private async sendSMS(phone: string, content: string): Promise<boolean> {
    // Implement SMS sending logic (SNS, Twilio, etc.)
    console.log(`Sending SMS to ${phone}: ${content}`);
    return true; // Mock success
  }

  private async sendPostal(address: string, content: string): Promise<boolean> {
    // Implement postal mail logic (print service integration)
    console.log(`Sending postal mail to ${address}: ${content}`);
    return true; // Mock success
  }

  private generateSecureToken(campaignId: string, prospectId: string): string {
    // Generate secure token for tracking and opt-out
    return Buffer.from(`${campaignId}:${prospectId}:${Date.now()}`).toString('base64');
  }

  private async recordDelivery(campaignId: string, prospectId: string, channel: string, status: string): Promise<void> {
    await dynamodb.send(new PutCommand({
      TableName: this.deliveryTableName,
      Item: {
        id: uuidv4(),
        campaignId,
        prospectId,
        channel,
        status,
        timestamp: new Date().toISOString()
      }
    }));
  }

  private async updateProspectContactTracking(prospectId: string): Promise<void> {
    await dynamodb.send(new UpdateCommand({
      TableName: 'PlanningApplications',
      Key: { id: prospectId },
      UpdateExpression: 'SET lastContactedAt = :date, contactAttempts = contactAttempts + :inc',
      ExpressionAttributeValues: {
        ':date': new Date().toISOString(),
        ':inc': 1
      }
    }));
  }

  private async storeMetrics(metrics: CampaignMetrics): Promise<void> {
    await dynamodb.send(new PutCommand({
      TableName: this.metricsTableName,
      Item: metrics
    }));
  }

  private async updateCampaignStats(campaignId: string, sentCount: number): Promise<void> {
    await dynamodb.send(new UpdateCommand({
      TableName: this.campaignTableName,
      Key: { id: campaignId },
      UpdateExpression: 'SET sentCount = sentCount + :count',
      ExpressionAttributeValues: {
        ':count': sentCount
      }
    }));
  }

  private async updateMetrics(campaignId: string, interactionType: string): Promise<void> {
    const updateExpression = `SET ${interactionType} = ${interactionType} + :inc`;
    
    await dynamodb.send(new UpdateCommand({
      TableName: this.metricsTableName,
      Key: { campaignId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: {
        ':inc': 1
      }
    }));
  }

  private async getCampaign(id: string): Promise<MarketingCampaign | null> {
    try {
      const result = await dynamodb.send(new GetCommand({
        TableName: this.campaignTableName,
        Key: { id }
      }));

      return result.Item as MarketingCampaign || null;
    } catch (error) {
      return null;
    }
  }

  private async getTemplate(id: string): Promise<CampaignTemplate | null> {
    try {
      const result = await dynamodb.send(new GetCommand({
        TableName: this.templateTableName,
        Key: { id }
      }));

      return result.Item as CampaignTemplate || null;
    } catch (error) {
      return null;
    }
  }

  private async getAudience(id: string): Promise<CampaignAudience | null> {
    try {
      const result = await dynamodb.send(new GetCommand({
        TableName: this.audienceTableName,
        Key: { id }
      }));

      return result.Item as CampaignAudience || null;
    } catch (error) {
      return null;
    }
  }

  private async getProspect(id: string): Promise<PlanningApplication | null> {
    try {
      const result = await dynamodb.send(new GetCommand({
        TableName: 'PlanningApplications',
        Key: { id }
      }));

      return result.Item as PlanningApplication || null;
    } catch (error) {
      return null;
    }
  }

  private async getCampaignInteractions(campaignId: string): Promise<any[]> {
    const params = {
      TableName: 'CampaignInteractions',
      FilterExpression: 'campaignId = :campaignId',
      ExpressionAttributeValues: {
        ':campaignId': campaignId
      }
    };

    const result = await dynamodb.send(new ScanCommand(params));
    return result.Items || [];
  }

  private groupInteractionsByTime(interactions: any[]): any {
    // Group interactions by time periods for timeline visualization
    return interactions.reduce((acc, interaction) => {
      const date = new Date(interaction.timestamp).toDateString();
      if (!acc[date]) acc[date] = {};
      if (!acc[date][interaction.interactionType]) acc[date][interaction.interactionType] = 0;
      acc[date][interaction.interactionType]++;
      return acc;
    }, {});
  }

  private getInteractionBreakdown(interactions: any[]): any {
    // Get breakdown of interaction types
    return interactions.reduce((acc, interaction) => {
      if (!acc[interaction.interactionType]) acc[interaction.interactionType] = 0;
      acc[interaction.interactionType]++;
      return acc;
    }, {});
  }

  private generateRecommendations(metrics: CampaignMetrics | null): string[] {
    const recommendations: string[] = [];
    
    if (!metrics) return recommendations;

    if (metrics.deliveryRate < 95) {
      recommendations.push('Consider cleaning your contact list to improve delivery rates');
    }
    
    if (metrics.openRate < 20) {
      recommendations.push('Try improving your subject lines to increase open rates');
    }
    
    if (metrics.clickRate < 2) {
      recommendations.push('Consider adding more compelling calls-to-action');
    }
    
    if (metrics.optOutRate > 5) {
      recommendations.push('Review your targeting criteria and message frequency');
    }

    return recommendations;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const marketingCampaignService = new MarketingCampaignService();