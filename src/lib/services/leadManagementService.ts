import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { paymentService } from './paymentService';
import { invitationService } from './invitationService';

interface Builder {
  id: string;
  email: string;
  companyName: string;
  postcode: string;
  serviceAreas: string[];
  specializations: string[];
  rating: number;
  totalProjects: number;
  subscriptionStatus: 'active' | 'inactive' | 'expired';
  leadPreferences: {
    maxLeadsPerMonth: number;
    preferredProjectTypes: string[];
    excludedProjectTypes: string[];
    maxBudgetRange?: number;
    minBudgetRange?: number;
  };
  createdAt: Date;
  lastActive: Date;
}

interface Lead {
  id: string;
  projectId: string;
  homeownerId: string;
  projectType: string;
  postcode: string;
  estimatedBudget: number;
  description: string;
  status: 'available' | 'offered' | 'accepted' | 'expired' | 'sold';
  createdAt: Date;
  expiresAt?: Date;
  currentOfferId?: string;
  offerHistory: LeadOffer[];
  price: number;
}

interface LeadOffer {
  id: string;
  leadId: string;
  builderId: string;
  offeredAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'declined';
  paymentIntentId?: string;
  acceptedAt?: Date;
}

interface LeadDistributionCriteria {
  postcode: string;
  projectType: string;
  estimatedBudget: number;
  urgency: 'low' | 'medium' | 'high';
}

class LeadManagementService {
  private dynamoClient: DynamoDBDocumentClient;
  private eventBridge: EventBridge;
  private readonly LEAD_OFFER_TIMEOUT_HOURS = 12;
  private readonly BUILDERS_TABLE = 'Builders';
  private readonly LEADS_TABLE = 'Leads';
  private readonly LEAD_OFFERS_TABLE = 'LeadOffers';

  constructor() {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    this.eventBridge = new EventBridge({ region: process.env.AWS_REGION });
  }

  /**
   * Create a new lead from a project
   */
  async createLead(projectData: {
    projectId: string;
    homeownerId: string;
    projectType: string;
    postcode: string;
    estimatedBudget: number;
    description: string;
  }): Promise<Lead> {
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate lead price based on project value (e.g., 2% of estimated budget, min £50, max £500)
    const leadPrice = Math.min(Math.max(projectData.estimatedBudget * 0.02, 50), 500);

    const lead: Lead = {
      id: leadId,
      projectId: projectData.projectId,
      homeownerId: projectData.homeownerId,
      projectType: projectData.projectType,
      postcode: projectData.postcode,
      estimatedBudget: projectData.estimatedBudget,
      description: projectData.description,
      status: 'available',
      createdAt: new Date(),
      offerHistory: [],
      price: leadPrice
    };

    await this.dynamoClient.send(new PutCommand({
      TableName: this.LEADS_TABLE,
      Item: lead
    }));

    // Start the lead distribution process
    await this.initiateLeadDistribution(leadId);

    return lead;
  }

  /**
   * Get eligible builders for a lead based on postcode, project type, and ratings
   */
  async getEligibleBuilders(criteria: LeadDistributionCriteria): Promise<Builder[]> {
    // Query builders by postcode and project type
    const response = await this.dynamoClient.send(new QueryCommand({
      TableName: this.BUILDERS_TABLE,
      IndexName: 'PostcodeProjectTypeIndex',
      KeyConditionExpression: 'postcode = :postcode',
      FilterExpression: 'contains(specializations, :projectType) AND subscriptionStatus = :active AND rating >= :minRating',
      ExpressionAttributeValues: {
        ':postcode': criteria.postcode,
        ':projectType': criteria.projectType,
        ':active': 'active',
        ':minRating': 3.0 // Minimum rating threshold
      }
    }));

    const builders = response.Items as Builder[];

    // Sort builders by rating (highest first), then by total projects, then by last active
    return builders.sort((a, b) => {
      if (a.rating !== b.rating) {
        return b.rating - a.rating;
      }
      if (a.totalProjects !== b.totalProjects) {
        return b.totalProjects - a.totalProjects;
      }
      return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    });
  }

  /**
   * Initiate lead distribution to eligible builders
   */
  async initiateLeadDistribution(leadId: string): Promise<void> {
    const lead = await this.getLead(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const eligibleBuilders = await this.getEligibleBuilders({
      postcode: lead.postcode,
      projectType: lead.projectType,
      estimatedBudget: lead.estimatedBudget,
      urgency: 'medium'
    });

    if (eligibleBuilders.length === 0) {
      // No eligible builders found - notify homeowner
      await this.notifyHomeownerNoBuilders(lead);
      return;
    }

    // Offer to the first (highest-rated) builder
    await this.offerLeadToBuilder(leadId, eligibleBuilders[0].id);
  }

  /**
   * Offer a lead to a specific builder
   */
  async offerLeadToBuilder(leadId: string, builderId: string): Promise<LeadOffer> {
    const offerId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + this.LEAD_OFFER_TIMEOUT_HOURS * 60 * 60 * 1000);

    const offer: LeadOffer = {
      id: offerId,
      leadId,
      builderId,
      offeredAt: new Date(),
      expiresAt,
      status: 'pending'
    };

    // Store the offer
    await this.dynamoClient.send(new PutCommand({
      TableName: this.LEAD_OFFERS_TABLE,
      Item: offer
    }));

    // Update lead with current offer
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.LEADS_TABLE,
      Key: { id: leadId },
      UpdateExpression: 'SET currentOfferId = :offerId, #status = :status, expiresAt = :expiresAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':offerId': offerId,
        ':status': 'offered',
        ':expiresAt': expiresAt
      }
    }));

    // Schedule automatic expiration
    await this.scheduleOfferExpiration(offerId);

    // Notify builder about the lead
    await this.notifyBuilderOfLead(builderId, leadId);

    return offer;
  }

  /**
   * Builder accepts a lead offer
   */
  async acceptLeadOffer(offerId: string, builderId: string): Promise<{ success: boolean; paymentIntentId?: string; error?: string }> {
    const offer = await this.getLeadOffer(offerId);
    if (!offer) {
      return { success: false, error: 'Offer not found' };
    }

    if (offer.builderId !== builderId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (offer.status !== 'pending') {
      return { success: false, error: 'Offer no longer available' };
    }

    if (new Date() > offer.expiresAt) {
      return { success: false, error: 'Offer has expired' };
    }

    const lead = await this.getLead(offer.leadId);
    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }

    try {
      // Process payment for the lead
      const paymentResult = await paymentService.createPaymentIntent(
        lead.price * 100, // Convert to pence
        'gbp',
        builderId,
        `Lead purchase for project ${lead.projectId}`,
        {
          leadId: lead.id,
          offerId: offer.id,
          projectType: lead.projectType
        }
      );

      // Update offer with payment intent
      await this.dynamoClient.send(new UpdateCommand({
        TableName: this.LEAD_OFFERS_TABLE,
        Key: { id: offerId },
        UpdateExpression: 'SET paymentIntentId = :paymentIntentId',
        ExpressionAttributeValues: {
          ':paymentIntentId': paymentResult.id
        }
      }));

      return { 
        success: true, 
        paymentIntentId: paymentResult.id 
      };
    } catch (error) {
      console.error('Error processing lead payment:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

  /**
   * Complete lead purchase after successful payment
   */
  async completeLeadPurchase(paymentIntentId: string): Promise<void> {
    // Find the offer by payment intent ID
    const response = await this.dynamoClient.send(new QueryCommand({
      TableName: this.LEAD_OFFERS_TABLE,
      IndexName: 'PaymentIntentIndex',
      KeyConditionExpression: 'paymentIntentId = :paymentIntentId',
      ExpressionAttributeValues: {
        ':paymentIntentId': paymentIntentId
      }
    }));

    const offer = response.Items?.[0] as LeadOffer;
    if (!offer) {
      throw new Error('Offer not found for payment intent');
    }

    // Update offer status
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.LEAD_OFFERS_TABLE,
      Key: { id: offer.id },
      UpdateExpression: 'SET #status = :status, acceptedAt = :acceptedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'accepted',
        ':acceptedAt': new Date()
      }
    }));

    // Update lead status
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.LEADS_TABLE,
      Key: { id: offer.leadId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'sold'
      }
    }));

    const lead = await this.getLead(offer.leadId);
    if (lead) {
      // Generate invitation code for the builder
      const invitationResult = await invitationService.generateInvitationCode(
        lead.projectId,
        offer.builderId
      );

      // Notify homeowner that builder has been found
      await this.notifyHomeownerBuilderFound(lead, offer.builderId);

      // Notify builder with project access
      if (invitationResult.success && invitationResult.invitationCode) {
        await this.notifyBuilderProjectAccess(offer.builderId, lead.projectId, invitationResult.invitationCode);
      }
    }
  }

  /**
   * Handle expired lead offers
   */
  async handleExpiredOffer(offerId: string): Promise<void> {
    const offer = await this.getLeadOffer(offerId);
    if (!offer || offer.status !== 'pending') {
      return;
    }

    // Mark offer as expired
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.LEAD_OFFERS_TABLE,
      Key: { id: offerId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'expired'
      }
    }));

    const lead = await this.getLead(offer.leadId);
    if (!lead) {
      return;
    }

    // Find next eligible builder
    const eligibleBuilders = await this.getEligibleBuilders({
      postcode: lead.postcode,
      projectType: lead.projectType,
      estimatedBudget: lead.estimatedBudget,
      urgency: 'medium'
    });

    // Filter out builders who have already been offered this lead
    const offeredBuilderIds = lead.offerHistory.map(o => o.builderId);
    const nextBuilders = eligibleBuilders.filter(b => !offeredBuilderIds.includes(b.id));

    if (nextBuilders.length > 0) {
      // Offer to next builder
      await this.offerLeadToBuilder(lead.id, nextBuilders[0].id);
    } else {
      // No more builders available
      await this.dynamoClient.send(new UpdateCommand({
        TableName: this.LEADS_TABLE,
        Key: { id: lead.id },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'expired'
        }
      }));

      await this.notifyHomeownerNoMoreBuilders(lead);
    }
  }

  /**
   * Get builder's available leads in their area
   */
  async getBuilderAvailableLeads(builderId: string): Promise<Lead[]> {
    const builder = await this.getBuilder(builderId);
    if (!builder) {
      return [];
    }

    const response = await this.dynamoClient.send(new QueryCommand({
      TableName: this.LEADS_TABLE,
      IndexName: 'StatusPostcodeIndex',
      KeyConditionExpression: '#status = :status',
      FilterExpression: 'contains(:serviceAreas, postcode) AND contains(:specializations, projectType)',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'available',
        ':serviceAreas': builder.serviceAreas,
        ':specializations': builder.specializations
      }
    }));

    return response.Items as Lead[];
  }

  /**
   * Get builder's current lead offers
   */
  async getBuilderCurrentOffers(builderId: string): Promise<LeadOffer[]> {
    const response = await this.dynamoClient.send(new QueryCommand({
      TableName: this.LEAD_OFFERS_TABLE,
      IndexName: 'BuilderStatusIndex',
      KeyConditionExpression: 'builderId = :builderId',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':builderId': builderId,
        ':status': 'pending'
      }
    }));

    return response.Items as LeadOffer[];
  }

  // Helper methods
  private async getLead(leadId: string): Promise<Lead | null> {
    const response = await this.dynamoClient.send(new GetCommand({
      TableName: this.LEADS_TABLE,
      Key: { id: leadId }
    }));
    return response.Item as Lead || null;
  }

  private async getLeadOffer(offerId: string): Promise<LeadOffer | null> {
    const response = await this.dynamoClient.send(new GetCommand({
      TableName: this.LEAD_OFFERS_TABLE,
      Key: { id: offerId }
    }));
    return response.Item as LeadOffer || null;
  }

  private async getBuilder(builderId: string): Promise<Builder | null> {
    const response = await this.dynamoClient.send(new GetCommand({
      TableName: this.BUILDERS_TABLE,
      Key: { id: builderId }
    }));
    return response.Item as Builder || null;
  }

  private async scheduleOfferExpiration(offerId: string): Promise<void> {
    // Schedule EventBridge event for offer expiration
    await this.eventBridge.putEvents({
      Entries: [{
        Source: 'lead-management',
        DetailType: 'Lead Offer Expiration',
        Detail: JSON.stringify({ offerId }),
        Time: new Date(Date.now() + this.LEAD_OFFER_TIMEOUT_HOURS * 60 * 60 * 1000)
      }]
    });
  }

  private async notifyBuilderOfLead(builderId: string, leadId: string): Promise<void> {
    // Implementation for notifying builder (email, SMS, push notification)
    console.log(`Notifying builder ${builderId} of lead ${leadId}`);
  }

  private async notifyHomeownerNoBuilders(lead: Lead): Promise<void> {
    // Implementation for notifying homeowner that no builders are available
    console.log(`Notifying homeowner ${lead.homeownerId} that no builders are available`);
  }

  private async notifyHomeownerBuilderFound(lead: Lead, builderId: string): Promise<void> {
    // Implementation for notifying homeowner that a builder has been found
    console.log(`Notifying homeowner ${lead.homeownerId} that builder ${builderId} has been found`);
  }

  private async notifyBuilderProjectAccess(builderId: string, projectId: string, invitationCode: string): Promise<void> {
    // Implementation for notifying builder with project access details
    console.log(`Notifying builder ${builderId} with access to project ${projectId}`);
  }

  private async notifyHomeownerNoMoreBuilders(lead: Lead): Promise<void> {
    // Implementation for notifying homeowner that no more builders are available
    console.log(`Notifying homeowner ${lead.homeownerId} that no more builders are available`);
  }
}

export const leadManagementService = new LeadManagementService();