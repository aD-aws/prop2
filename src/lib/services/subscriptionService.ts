import { 
  SubscriptionPlan, 
  UserSubscription, 
  SubscriptionTier, 
  SubscriptionStatus,
  UserType,
  UsageLimits,
  PlanFeature,
  FinancialSummary,
  UpcomingCharge
} from '../types';
import { paymentService } from './paymentService';

export class SubscriptionService {
  private readonly defaultPlans: SubscriptionPlan[] = [
    // Homeowner Plans
    {
      id: 'homeowner_free',
      name: 'Free',
      tier: 'free',
      userType: 'homeowner',
      monthlyPrice: 0,
      yearlyPrice: 0,
      stripePriceId: '',
      features: [
        { id: 'basic_sow', name: 'Basic SoW Generation', description: 'Generate basic scope of work without detailed costs', included: true },
        { id: 'project_planning', name: 'AI Project Planning', description: 'Access to AI-guided project planning', included: true },
        { id: 'property_assessment', name: 'Property Assessment', description: 'Basic property compliance checking', included: true },
      ],
      limits: {
        maxProjects: 1,
        maxBuilderInvitations: 3,
        pdfDownloads: false,
        detailedCosting: false,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'homeowner_premium',
      name: 'Premium',
      tier: 'premium',
      userType: 'homeowner',
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      stripePriceId: process.env.STRIPE_HOMEOWNER_PREMIUM_PRICE_ID || '',
      stripeYearlyPriceId: process.env.STRIPE_HOMEOWNER_PREMIUM_YEARLY_PRICE_ID || '',
      features: [
        { id: 'detailed_sow', name: 'Detailed SoW with Costs', description: 'Complete scope of work with detailed cost breakdowns', included: true },
        { id: 'unlimited_projects', name: 'Unlimited Projects', description: 'Create unlimited home improvement projects', included: true },
        { id: 'builder_invitations', name: 'Builder Invitations', description: 'Invite multiple builders to quote', included: true },
        { id: 'pdf_downloads', name: 'PDF Downloads', description: 'Download SoW and contracts as PDF', included: true },
        { id: 'gantt_charts', name: 'Interactive Gantt Charts', description: 'Visual project timelines and dependencies', included: true },
        { id: 'quote_comparison', name: 'AI Quote Analysis', description: 'Advanced quote comparison and red flag detection', included: true },
        { id: 'lead_purchasing', name: 'Additional Builder Leads', description: 'Purchase additional builder leads', included: true },
      ],
      limits: {
        maxProjects: undefined, // unlimited
        maxBuilderInvitations: undefined, // unlimited
        pdfDownloads: true,
        detailedCosting: true,
        maxLeadPurchases: undefined,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Builder Plans
    {
      id: 'builder_basic',
      name: 'Basic',
      tier: 'basic',
      userType: 'builder',
      monthlyPrice: 49.99,
      yearlyPrice: 499.99,
      stripePriceId: process.env.STRIPE_BUILDER_BASIC_PRICE_ID || '',
      stripeYearlyPriceId: process.env.STRIPE_BUILDER_BASIC_YEARLY_PRICE_ID || '',
      features: [
        { id: 'project_access', name: 'Project Access', description: 'Access invited projects and submit quotes', included: true },
        { id: 'quote_submission', name: 'Quote Submission', description: 'Submit and modify quotes', included: true },
        { id: 'basic_dashboard', name: 'Basic Dashboard', description: 'View project status and basic metrics', included: true },
        { id: 'lead_purchasing', name: 'Lead Purchasing', description: 'Purchase qualified leads', included: true },
      ],
      limits: {
        maxAnalyticsAccess: false,
        professionalQuoteGeneration: false,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'builder_premium',
      name: 'Premium',
      tier: 'premium',
      userType: 'builder',
      monthlyPrice: 99.99,
      yearlyPrice: 999.99,
      stripePriceId: process.env.STRIPE_BUILDER_PREMIUM_PRICE_ID || '',
      stripeYearlyPriceId: process.env.STRIPE_BUILDER_PREMIUM_YEARLY_PRICE_ID || '',
      features: [
        { id: 'advanced_analytics', name: 'Advanced Analytics', description: 'Detailed performance analytics and insights', included: true },
        { id: 'ai_insights', name: 'AI Business Insights', description: 'AI-driven competitive analysis and recommendations', included: true },
        { id: 'professional_quotes', name: 'Professional Quote Generation', description: 'Generate quotes for external clients', included: true },
        { id: 'priority_leads', name: 'Priority Lead Access', description: 'First access to high-value leads', included: true },
        { id: 'advanced_dashboard', name: 'Advanced Dashboard', description: 'Comprehensive business metrics and reporting', included: true },
      ],
      limits: {
        maxAnalyticsAccess: true,
        professionalQuoteGeneration: true,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  /**
   * Get all available subscription plans for a user type
   */
  getAvailablePlans(userType: UserType): SubscriptionPlan[] {
    return this.defaultPlans.filter(plan => plan.userType === userType && plan.isActive);
  }

  /**
   * Get a specific subscription plan by ID
   */
  getPlanById(planId: string): SubscriptionPlan | null {
    return this.defaultPlans.find(plan => plan.id === planId) || null;
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      // This would query your database for the user's subscription
      // Placeholder implementation
      return null;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      throw new Error('Failed to fetch subscription');
    }
  }

  /**
   * Create a new subscription for a user
   */
  async createSubscription(
    userId: string,
    planId: string,
    stripeCustomerId: string,
    discountCodeId?: string
  ): Promise<{ subscription: UserSubscription; clientSecret: string }> {
    try {
      const plan = this.getPlanById(planId);
      if (!plan) {
        throw new Error('Invalid plan ID');
      }

      // Create Stripe subscription
      const stripeSubscription = await paymentService.createSubscription(
        stripeCustomerId,
        plan.stripePriceId,
        discountCodeId
      );

      // Create subscription record in database
      const subscription: UserSubscription = {
        id: `sub_${Date.now()}`,
        userId,
        planId,
        status: 'active',
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId,
        currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to database (placeholder)
      await this.saveSubscription(subscription);

      // Get client secret for frontend
      const clientSecret = (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret;

      return { subscription, clientSecret };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Upgrade or downgrade a subscription
   */
  async updateSubscription(userId: string, newPlanId: string): Promise<UserSubscription> {
    try {
      const currentSubscription = await this.getUserSubscription(userId);
      if (!currentSubscription) {
        throw new Error('No active subscription found');
      }

      const newPlan = this.getPlanById(newPlanId);
      if (!newPlan) {
        throw new Error('Invalid plan ID');
      }

      // Update Stripe subscription
      const stripeSubscription = await paymentService.updateSubscription(
        currentSubscription.stripeSubscriptionId,
        newPlan.stripePriceId
      );

      // Update subscription record
      const updatedSubscription: UserSubscription = {
        ...currentSubscription,
        planId: newPlanId,
        currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        updatedAt: new Date(),
      };

      await this.saveSubscription(updatedSubscription);

      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<UserSubscription> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      // Cancel Stripe subscription
      await paymentService.cancelSubscription(subscription.stripeSubscriptionId, cancelAtPeriodEnd);

      // Update subscription record
      const updatedSubscription: UserSubscription = {
        ...subscription,
        cancelAtPeriodEnd,
        cancelledAt: cancelAtPeriodEnd ? undefined : new Date(),
        status: cancelAtPeriodEnd ? 'active' : 'cancelled',
        updatedAt: new Date(),
      };

      await this.saveSubscription(updatedSubscription);

      return updatedSubscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  async hasFeatureAccess(userId: string, featureId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      // If no subscription, check free plan features
      if (!subscription) {
        const freePlan = this.defaultPlans.find(p => p.tier === 'free');
        return freePlan?.features.some(f => f.id === featureId && f.included) || false;
      }

      const plan = this.getPlanById(subscription.planId);
      if (!plan) {
        return false;
      }

      return plan.features.some(f => f.id === featureId && f.included);
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Check if user is within usage limits
   */
  async checkUsageLimit(userId: string, limitType: keyof UsageLimits): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const plan = subscription ? this.getPlanById(subscription.planId) : this.defaultPlans.find(p => p.tier === 'free');
      
      if (!plan) {
        return false;
      }

      const limit = plan.limits[limitType];
      
      // If limit is undefined, it means unlimited
      if (limit === undefined) {
        return true;
      }

      // If limit is boolean, return the boolean value
      if (typeof limit === 'boolean') {
        return limit;
      }

      // If limit is a number, check current usage
      if (typeof limit === 'number') {
        const currentUsage = await this.getCurrentUsage(userId, limitType);
        return currentUsage < limit;
      }

      return false;
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return false;
    }
  }

  /**
   * Get financial summary for a user
   */
  async getFinancialSummary(userId: string): Promise<FinancialSummary> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const payments = await paymentService.getPaymentHistory(userId, 12);
      
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const monthlySpend = payments
        .filter(p => p.createdAt >= monthStart && p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      const yearlySpend = payments
        .filter(p => p.createdAt >= yearStart && p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      const totalSpent = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      const upcomingCharges: UpcomingCharge[] = [];
      if (subscription && subscription.status === 'active') {
        const plan = this.getPlanById(subscription.planId);
        if (plan && plan.monthlyPrice > 0) {
          upcomingCharges.push({
            id: `upcoming_${subscription.id}`,
            description: `${plan.name} subscription renewal`,
            amount: plan.monthlyPrice,
            dueDate: subscription.currentPeriodEnd,
            type: 'subscription',
          });
        }
      }

      return {
        userId,
        userType: 'homeowner', // This should be fetched from user data
        currentSubscription: subscription || undefined,
        totalSpent,
        monthlySpend,
        yearlySpend,
        leadPurchases: [], // This should be fetched from database
        recentPayments: payments.slice(0, 10),
        upcomingCharges,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating financial summary:', error);
      throw new Error('Failed to generate financial summary');
    }
  }

  /**
   * Get subscription analytics for admin
   */
  async getSubscriptionAnalytics(): Promise<{
    totalSubscribers: number;
    activeSubscriptions: number;
    monthlyRecurringRevenue: number;
    churnRate: number;
    planDistribution: Record<string, number>;
  }> {
    try {
      // This would query your database for analytics
      // Placeholder implementation
      return {
        totalSubscribers: 0,
        activeSubscriptions: 0,
        monthlyRecurringRevenue: 0,
        churnRate: 0,
        planDistribution: {},
      };
    } catch (error) {
      console.error('Error fetching subscription analytics:', error);
      throw new Error('Failed to fetch analytics');
    }
  }

  // Private helper methods
  private async saveSubscription(subscription: UserSubscription): Promise<void> {
    // This would save the subscription to your database
    // Placeholder implementation
    console.log('Saving subscription:', subscription.id);
  }

  private async getCurrentUsage(userId: string, limitType: keyof UsageLimits): Promise<number> {
    // This would query your database for current usage
    // Placeholder implementation
    return 0;
  }
}

export const subscriptionService = new SubscriptionService();