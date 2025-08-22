import { 
  LeadPurchase, 
  Project, 
  BuilderProfile,
  PaymentStatus,
  ProjectType 
} from '../types';
import { paymentService } from './paymentService';

export interface LeadOffer {
  id: string;
  projectId: string;
  builderId: string;
  price: number;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'declined';
  offeredAt: Date;
}

export interface LeadPurchaseRequest {
  builderId: string;
  projectId: string;
  stripeCustomerId: string;
}

export class LeadPurchaseService {
  private readonly LEAD_OFFER_TIMEOUT_HOURS = 12;
  private readonly BASE_LEAD_PRICE = 25.00; // £25 base price
  
  /**
   * Calculate lead price based on project type and value
   */
  calculateLeadPrice(projectType: ProjectType, estimatedValue?: number): number {
    let basePrice = this.BASE_LEAD_PRICE;
    
    // Adjust price based on project complexity and value
    const highValueProjects = [
      'loft_conversion_mansard',
      'rear_extension_double_storey',
      'rear_extension_wrap_around',
      'basement_conversion_full',
      'swimming_pool_indoor',
      'swimming_pool_outdoor',
    ];
    
    const mediumValueProjects = [
      'kitchen_full_refit',
      'bathroom_full_refit',
      'loft_conversion_dormer',
      'rear_extension_single_storey',
      'garage_conversion_living_space',
    ];

    if (highValueProjects.includes(projectType)) {
      basePrice *= 2.5; // £62.50
    } else if (mediumValueProjects.includes(projectType)) {
      basePrice *= 1.5; // £37.50
    }

    // Further adjust based on estimated project value
    if (estimatedValue) {
      if (estimatedValue > 100000) {
        basePrice *= 1.5;
      } else if (estimatedValue > 50000) {
        basePrice *= 1.2;
      }
    }

    return Math.round(basePrice * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Offer lead to builders sequentially based on ratings and preferences
   */
  async offerLeadToBuilders(
    projectId: string,
    maxOffers: number = 5
  ): Promise<LeadOffer[]> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const eligibleBuilders = await this.getEligibleBuilders(project);
      const leadPrice = this.calculateLeadPrice(
        project.projectType,
        project.sowDocument?.estimatedCosts.totalEstimate
      );

      const offers: LeadOffer[] = [];
      const expiresAt = new Date(Date.now() + this.LEAD_OFFER_TIMEOUT_HOURS * 60 * 60 * 1000);

      // Offer to top-rated builders first
      for (let i = 0; i < Math.min(maxOffers, eligibleBuilders.length); i++) {
        const builder = eligibleBuilders[i];
        const offer: LeadOffer = {
          id: `offer_${Date.now()}_${i}`,
          projectId,
          builderId: builder.id,
          price: leadPrice,
          expiresAt,
          status: 'pending',
          offeredAt: new Date(),
        };

        await this.saveLeadOffer(offer);
        await this.notifyBuilderOfLeadOffer(builder, offer, project);
        offers.push(offer);
      }

      // Start timeout monitoring
      this.scheduleOfferTimeouts(offers);

      return offers;
    } catch (error) {
      console.error('Error offering lead to builders:', error);
      throw error;
    }
  }

  /**
   * Process lead purchase by builder
   */
  async purchaseLead(request: LeadPurchaseRequest): Promise<{
    leadPurchase: LeadPurchase;
    clientSecret: string;
  }> {
    try {
      const offer = await this.getActiveLeadOffer(request.builderId, request.projectId);
      if (!offer) {
        throw new Error('No active lead offer found');
      }

      if (offer.status !== 'pending') {
        throw new Error('Lead offer is no longer available');
      }

      if (new Date() > offer.expiresAt) {
        throw new Error('Lead offer has expired');
      }

      // Create payment intent
      const paymentIntent = await paymentService.createPaymentIntent(
        offer.price,
        'gbp',
        request.stripeCustomerId,
        `Lead purchase for project ${request.projectId}`,
        {
          type: 'lead_purchase',
          projectId: request.projectId,
          builderId: request.builderId,
          offerId: offer.id,
        }
      );

      // Create lead purchase record
      const leadPurchase: LeadPurchase = {
        id: `lead_${Date.now()}`,
        builderId: request.builderId,
        projectId: request.projectId,
        amount: offer.price,
        status: 'pending',
        paymentId: paymentIntent.id,
        purchasedAt: new Date(),
      };

      await this.saveLeadPurchase(leadPurchase);

      // Mark offer as accepted
      await this.updateLeadOfferStatus(offer.id, 'accepted');

      // Cancel other pending offers for this project
      await this.cancelOtherOffers(request.projectId, offer.id);

      return {
        leadPurchase,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error) {
      console.error('Error processing lead purchase:', error);
      throw error;
    }
  }

  /**
   * Grant access to project after successful payment
   */
  async grantProjectAccess(leadPurchaseId: string): Promise<void> {
    try {
      const leadPurchase = await this.getLeadPurchase(leadPurchaseId);
      if (!leadPurchase) {
        throw new Error('Lead purchase not found');
      }

      // Update lead purchase status
      leadPurchase.status = 'completed';
      leadPurchase.accessGrantedAt = new Date();
      await this.saveLeadPurchase(leadPurchase);

      // Add builder to project's invited builders list
      await this.addBuilderToProject(leadPurchase.projectId, leadPurchase.builderId);

      // Notify homeowner of new builder interest
      await this.notifyHomeownerOfNewBuilder(leadPurchase.projectId, leadPurchase.builderId);

      console.log(`Access granted to builder ${leadPurchase.builderId} for project ${leadPurchase.projectId}`);
    } catch (error) {
      console.error('Error granting project access:', error);
      throw error;
    }
  }

  /**
   * Get builder's lead purchase history
   */
  async getBuilderLeadHistory(builderId: string, limit: number = 50): Promise<LeadPurchase[]> {
    try {
      // This would query your database for builder's lead purchases
      // Placeholder implementation
      return [];
    } catch (error) {
      console.error('Error fetching builder lead history:', error);
      throw new Error('Failed to fetch lead history');
    }
  }

  /**
   * Get lead purchase analytics for admin
   */
  async getLeadPurchaseAnalytics(): Promise<{
    totalLeadsSold: number;
    totalRevenue: number;
    averageLeadPrice: number;
    conversionRate: number;
    topBuyingBuilders: { builderId: string; purchaseCount: number; totalSpent: number }[];
    revenueByProjectType: Record<ProjectType, number>;
  }> {
    try {
      // This would query your database for analytics
      // Placeholder implementation
      return {
        totalLeadsSold: 0,
        totalRevenue: 0,
        averageLeadPrice: 0,
        conversionRate: 0,
        topBuyingBuilders: [],
        revenueByProjectType: {} as Record<ProjectType, number>,
      };
    } catch (error) {
      console.error('Error fetching lead purchase analytics:', error);
      throw new Error('Failed to fetch analytics');
    }
  }

  /**
   * Handle expired lead offers
   */
  async handleExpiredOffers(): Promise<void> {
    try {
      const expiredOffers = await this.getExpiredOffers();
      
      for (const offer of expiredOffers) {
        await this.updateLeadOfferStatus(offer.id, 'expired');
        
        // Offer to next builder in queue
        const nextBuilders = await this.getNextEligibleBuilders(offer.projectId, 1);
        if (nextBuilders.length > 0) {
          await this.offerLeadToBuilders(offer.projectId, 1);
        }
      }
    } catch (error) {
      console.error('Error handling expired offers:', error);
    }
  }

  // Private helper methods
  private async getProject(projectId: string): Promise<Project | null> {
    // This would query your database for the project
    // Placeholder implementation
    return null;
  }

  private async getEligibleBuilders(project: Project): Promise<BuilderProfile[]> {
    // This would query your database for eligible builders
    // Sort by rating, specialization match, and service area
    // Placeholder implementation
    return [];
  }

  private async saveLeadOffer(offer: LeadOffer): Promise<void> {
    // This would save the lead offer to your database
    // Placeholder implementation
    console.log('Saving lead offer:', offer.id);
  }

  private async saveLeadPurchase(leadPurchase: LeadPurchase): Promise<void> {
    // This would save the lead purchase to your database
    // Placeholder implementation
    console.log('Saving lead purchase:', leadPurchase.id);
  }

  private async getLeadPurchase(id: string): Promise<LeadPurchase | null> {
    // This would query your database for the lead purchase
    // Placeholder implementation
    return null;
  }

  private async getActiveLeadOffer(builderId: string, projectId: string): Promise<LeadOffer | null> {
    // This would query your database for active lead offers
    // Placeholder implementation
    return null;
  }

  private async updateLeadOfferStatus(offerId: string, status: LeadOffer['status']): Promise<void> {
    // This would update the offer status in your database
    // Placeholder implementation
    console.log(`Updating offer ${offerId} status to ${status}`);
  }

  private async cancelOtherOffers(projectId: string, excludeOfferId: string): Promise<void> {
    // This would cancel other pending offers for the project
    // Placeholder implementation
    console.log(`Cancelling other offers for project ${projectId}`);
  }

  private async addBuilderToProject(projectId: string, builderId: string): Promise<void> {
    // This would add the builder to the project's invited builders list
    // Placeholder implementation
    console.log(`Adding builder ${builderId} to project ${projectId}`);
  }

  private async notifyBuilderOfLeadOffer(
    builder: BuilderProfile, 
    offer: LeadOffer, 
    project: Project
  ): Promise<void> {
    // This would send notification to builder about the lead offer
    // Placeholder implementation
    console.log(`Notifying builder ${builder.id} of lead offer ${offer.id}`);
  }

  private async notifyHomeownerOfNewBuilder(projectId: string, builderId: string): Promise<void> {
    // This would notify the homeowner of new builder interest
    // Placeholder implementation
    console.log(`Notifying homeowner of new builder ${builderId} for project ${projectId}`);
  }

  private scheduleOfferTimeouts(offers: LeadOffer[]): void {
    // This would schedule timeout handling for the offers
    // In a real implementation, you might use a job queue or scheduled function
    offers.forEach(offer => {
      setTimeout(() => {
        this.handleExpiredOffers();
      }, offer.expiresAt.getTime() - Date.now());
    });
  }

  private async getExpiredOffers(): Promise<LeadOffer[]> {
    // This would query your database for expired offers
    // Placeholder implementation
    return [];
  }

  private async getNextEligibleBuilders(projectId: string, count: number): Promise<BuilderProfile[]> {
    // This would get the next eligible builders for the project
    // Placeholder implementation
    return [];
  }
}

export const leadPurchaseService = new LeadPurchaseService();