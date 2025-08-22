import { 
  UserSubscription, 
  SubscriptionPlan, 
  LeadPurchase,
  FinancialSummary,
  Payment,
  UpcomingCharge,
  SubscriptionStatus
} from '../types';
import { subscriptionService } from './subscriptionService';
import { leadPurchaseService } from './leadPurchaseService';
import { paymentService } from './paymentService';

export interface BuilderAnalytics {
  totalLeadsPurchased: number;
  totalSpentOnLeads: number;
  monthlyLeadSpend: number;
  averageLeadCost: number;
  conversionRate: number;
  projectsWon: number;
  totalRevenue: number;
  averageProjectValue: number;
  topProjectTypes: { projectType: string; count: number; winRate: number }[];
  geographicPerformance: { area: string; leadsCount: number; winRate: number }[];
  professionalQuotesGenerated: number;
  monthlyQuoteGeneration: number;
}

export interface UsageTracking {
  id: string;
  builderId: string;
  featureType: 'quote_generation' | 'lead_purchase' | 'analytics_access';
  quantity: number;
  timestamp: Date;
  billingPeriod: string; // YYYY-MM format
}

export interface BuilderFinancialSummary extends FinancialSummary {
  analytics: BuilderAnalytics;
  leadPurchaseHistory: LeadPurchase[];
  subscriptionHistory: UserSubscription[];
}

export class BuilderSubscriptionService {
  /**
   * Get builder-specific subscription plans
   */
  getBuilderPlans(): SubscriptionPlan[] {
    return subscriptionService.getAvailablePlans('builder');
  }

  /**
   * Create builder subscription with trial period
   */
  async createBuilderSubscription(
    builderId: string,
    planId: string,
    stripeCustomerId: string,
    trialDays: number = 14
  ): Promise<{ subscription: UserSubscription; clientSecret: string }> {
    try {
      const plan = subscriptionService.getPlanById(planId);
      if (!plan || plan.userType !== 'builder') {
        throw new Error('Invalid builder plan ID');
      }

      // Create subscription with trial
      const result = await subscriptionService.createSubscription(
        builderId,
        planId,
        stripeCustomerId
      );

      // Set trial period
      if (trialDays > 0) {
        result.subscription.trialStart = new Date();
        result.subscription.trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
      }

      return result;
    } catch (error) {
      console.error('Error creating builder subscription:', error);
      throw error;
    }
  }

  /**
   * Handle subscription expiration and feature restrictions
   */
  async handleSubscriptionExpiration(builderId: string): Promise<void> {
    try {
      const subscription = await subscriptionService.getUserSubscription(builderId);
      
      if (!subscription) {
        return;
      }

      const now = new Date();
      const isExpired = now > subscription.currentPeriodEnd;
      const isTrialExpired = subscription.trialEnd && now > subscription.trialEnd;

      if (isExpired || isTrialExpired) {
        // Update subscription status
        subscription.status = 'expired';
        await this.updateSubscriptionStatus(subscription);

        // Restrict access to premium features
        await this.restrictPremiumFeatures(builderId);

        // Notify builder of expiration
        await this.notifyBuilderOfExpiration(builderId, subscription);
      }
    } catch (error) {
      console.error('Error handling subscription expiration:', error);
      throw error;
    }
  }

  /**
   * Process lead purchase for builder
   */
  async purchaseLeadForBuilder(
    builderId: string,
    projectId: string,
    stripeCustomerId: string
  ): Promise<{ leadPurchase: LeadPurchase; clientSecret: string }> {
    try {
      // Check if builder has active subscription or sufficient credits
      const canPurchase = await this.canBuilderPurchaseLeads(builderId);
      if (!canPurchase) {
        throw new Error('Builder subscription required to purchase leads');
      }

      // Process the lead purchase
      const result = await leadPurchaseService.purchaseLead({
        builderId,
        projectId,
        stripeCustomerId,
      });

      // Update builder's lead purchase analytics
      await this.updateLeadPurchaseAnalytics(builderId, result.leadPurchase);

      return result;
    } catch (error) {
      console.error('Error processing builder lead purchase:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive financial summary for builder
   */
  async getBuilderFinancialSummary(builderId: string): Promise<BuilderFinancialSummary> {
    try {
      const baseSummary = await subscriptionService.getFinancialSummary(builderId);
      const analytics = await this.getBuilderAnalytics(builderId);
      const leadPurchaseHistory = await leadPurchaseService.getBuilderLeadHistory(builderId);
      const subscriptionHistory = await this.getBuilderSubscriptionHistory(builderId);

      return {
        ...baseSummary,
        userType: 'builder',
        analytics,
        leadPurchaseHistory,
        subscriptionHistory,
      };
    } catch (error) {
      console.error('Error generating builder financial summary:', error);
      throw error;
    }
  }

  /**
   * Get builder analytics and insights
   */
  async getBuilderAnalytics(builderId: string): Promise<BuilderAnalytics> {
    try {
      const leadPurchases = await leadPurchaseService.getBuilderLeadHistory(builderId);
      const projects = await this.getBuilderProjects(builderId);

      const totalLeadsPurchased = leadPurchases.length;
      const totalSpentOnLeads = leadPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
      
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyLeadSpend = leadPurchases
        .filter(purchase => purchase.purchasedAt >= monthStart)
        .reduce((sum, purchase) => sum + purchase.amount, 0);

      const averageLeadCost = totalLeadsPurchased > 0 ? totalSpentOnLeads / totalLeadsPurchased : 0;

      const projectsWon = projects.filter(p => p.status === 'won').length;
      const conversionRate = totalLeadsPurchased > 0 ? (projectsWon / totalLeadsPurchased) * 100 : 0;

      const totalRevenue = projects
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.contractValue || 0), 0);

      const averageProjectValue = projectsWon > 0 ? totalRevenue / projectsWon : 0;

      const topProjectTypes = await this.getTopProjectTypes(builderId);
      const geographicPerformance = await this.getGeographicPerformance(builderId);

      // Get professional quote generation stats
      const allUsage = await this.getAllUsageForBuilder(builderId);
      const quoteUsage = allUsage.filter(u => u.featureType === 'quote_generation');
      const professionalQuotesGenerated = quoteUsage.reduce((sum, u) => sum + u.quantity, 0);
      
      const monthlyQuoteUsage = quoteUsage.filter(u => u.timestamp >= monthStart);
      const monthlyQuoteGeneration = monthlyQuoteUsage.reduce((sum, u) => sum + u.quantity, 0);

      return {
        totalLeadsPurchased,
        totalSpentOnLeads,
        monthlyLeadSpend,
        averageLeadCost,
        conversionRate,
        projectsWon,
        totalRevenue,
        averageProjectValue,
        topProjectTypes,
        geographicPerformance,
        professionalQuotesGenerated,
        monthlyQuoteGeneration,
      };
    } catch (error) {
      console.error('Error generating builder analytics:', error);
      throw error;
    }
  }

  /**
   * Check if builder can purchase leads
   */
  async canBuilderPurchaseLeads(builderId: string): Promise<boolean> {
    try {
      const subscription = await subscriptionService.getUserSubscription(builderId);
      
      if (!subscription) {
        return false; // No subscription
      }

      if (subscription.status !== 'active') {
        return false; // Inactive subscription
      }

      const now = new Date();
      
      // Check if trial is still valid
      if (subscription.trialEnd && now <= subscription.trialEnd) {
        return true;
      }

      // Check if subscription is current
      if (now <= subscription.currentPeriodEnd) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking builder lead purchase eligibility:', error);
      return false;
    }
  }

  /**
   * Get builder's subscription usage and limits
   */
  async getBuilderUsageStats(builderId: string): Promise<{
    currentPlan: SubscriptionPlan | null;
    subscription: UserSubscription | null;
    leadsPurchasedThisMonth: number;
    analyticsAccess: boolean;
    professionalQuoteGeneration: boolean;
    daysUntilRenewal: number;
  }> {
    try {
      const subscription = await subscriptionService.getUserSubscription(builderId);
      const currentPlan = subscription ? subscriptionService.getPlanById(subscription.planId) : null;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const leadPurchases = await leadPurchaseService.getBuilderLeadHistory(builderId);
      const leadsPurchasedThisMonth = leadPurchases.filter(
        purchase => purchase.purchasedAt >= monthStart
      ).length;

      const analyticsAccess = await subscriptionService.hasFeatureAccess(builderId, 'advanced_analytics');
      const professionalQuoteGeneration = await subscriptionService.hasFeatureAccess(builderId, 'professional_quotes');

      const daysUntilRenewal = subscription 
        ? Math.ceil((subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        currentPlan,
        subscription,
        leadsPurchasedThisMonth,
        analyticsAccess,
        professionalQuoteGeneration,
        daysUntilRenewal,
      };
    } catch (error) {
      console.error('Error getting builder usage stats:', error);
      throw error;
    }
  }

  /**
   * Track usage for billing purposes
   */
  async trackUsage(
    builderId: string,
    featureType: 'quote_generation' | 'lead_purchase' | 'analytics_access',
    quantity: number = 1
  ): Promise<void> {
    try {
      const now = new Date();
      const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const usage: UsageTracking = {
        id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        builderId,
        featureType,
        quantity,
        timestamp: now,
        billingPeriod
      };

      // Store usage tracking record
      await this.storeUsageRecord(usage);

      // Check if usage exceeds plan limits
      await this.checkUsageLimits(builderId, featureType);
    } catch (error) {
      console.error('Error tracking usage:', error);
      throw error;
    }
  }

  /**
   * Get builder subscription with usage validation
   */
  async getBuilderSubscription(builderId: string): Promise<UserSubscription | null> {
    try {
      const subscription = await subscriptionService.getUserSubscription(builderId);
      
      if (!subscription) {
        return null;
      }

      // Check if subscription is still valid
      const now = new Date();
      const isExpired = now > subscription.currentPeriodEnd;
      const isTrialExpired = subscription.trialEnd && now > subscription.trialEnd;

      if (isExpired || isTrialExpired) {
        subscription.status = 'expired';
      }

      return subscription;
    } catch (error) {
      console.error('Error getting builder subscription:', error);
      return null;
    }
  }

  /**
   * Get usage statistics for current billing period
   */
  async getUsageStats(builderId: string): Promise<{
    quotesGenerated: number;
    leadsAccessed: number;
    analyticsAccessed: number;
    billingPeriod: string;
  }> {
    try {
      const now = new Date();
      const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const usage = await this.getUsageForPeriod(builderId, billingPeriod);

      return {
        quotesGenerated: usage.filter(u => u.featureType === 'quote_generation').reduce((sum, u) => sum + u.quantity, 0),
        leadsAccessed: usage.filter(u => u.featureType === 'lead_purchase').reduce((sum, u) => sum + u.quantity, 0),
        analyticsAccessed: usage.filter(u => u.featureType === 'analytics_access').reduce((sum, u) => sum + u.quantity, 0),
        billingPeriod
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      throw error;
    }
  }

  /**
   * Generate builder performance insights using AI
   */
  async generateBuilderInsights(builderId: string): Promise<{
    insights: string[];
    recommendations: string[];
    competitiveAdvantages: string[];
    improvementAreas: string[];
  }> {
    try {
      const analytics = await this.getBuilderAnalytics(builderId);
      const usageStats = await this.getBuilderUsageStats(builderId);

      const insights: string[] = [];
      const recommendations: string[] = [];
      const competitiveAdvantages: string[] = [];
      const improvementAreas: string[] = [];

      // Analyze conversion rate
      if (analytics.conversionRate > 30) {
        competitiveAdvantages.push(`Excellent conversion rate of ${analytics.conversionRate.toFixed(1)}% - well above industry average`);
      } else if (analytics.conversionRate < 15) {
        improvementAreas.push('Low conversion rate suggests need to improve quote competitiveness or response time');
        recommendations.push('Consider reviewing your pricing strategy and quote presentation');
      }

      // Analyze lead spending efficiency
      if (analytics.averageLeadCost > 0 && analytics.averageProjectValue > 0) {
        const roi = (analytics.averageProjectValue - analytics.averageLeadCost) / analytics.averageLeadCost * 100;
        if (roi > 500) {
          insights.push(`Strong ROI of ${roi.toFixed(0)}% on lead purchases`);
        } else if (roi < 200) {
          recommendations.push('Consider focusing on higher-value projects to improve lead purchase ROI');
        }
      }

      // Geographic performance insights
      if (analytics.geographicPerformance.length > 0) {
        const bestArea = analytics.geographicPerformance.reduce((best, current) => 
          current.winRate > best.winRate ? current : best
        );
        insights.push(`Strongest performance in ${bestArea.area} with ${bestArea.winRate.toFixed(1)}% win rate`);
      }

      // Project type specialization
      if (analytics.topProjectTypes.length > 0) {
        const topType = analytics.topProjectTypes[0];
        if (topType.winRate > 40) {
          competitiveAdvantages.push(`Strong specialization in ${topType.projectType} with ${topType.winRate.toFixed(1)}% win rate`);
        }
      }

      // Subscription utilization
      if (!usageStats.analyticsAccess && analytics.totalLeadsPurchased > 10) {
        recommendations.push('Upgrade to Premium to access detailed analytics and AI insights');
      }

      return {
        insights,
        recommendations,
        competitiveAdvantages,
        improvementAreas,
      };
    } catch (error) {
      console.error('Error generating builder insights:', error);
      throw error;
    }
  }

  // Private helper methods
  private async updateSubscriptionStatus(subscription: UserSubscription): Promise<void> {
    // This would update the subscription in your database
    console.log('Updating subscription status:', subscription.id);
  }

  private async restrictPremiumFeatures(builderId: string): Promise<void> {
    // This would restrict access to premium features
    console.log('Restricting premium features for builder:', builderId);
  }

  private async notifyBuilderOfExpiration(builderId: string, subscription: UserSubscription): Promise<void> {
    // This would send notification to builder about subscription expiration
    console.log('Notifying builder of subscription expiration:', builderId);
  }

  private async updateLeadPurchaseAnalytics(builderId: string, leadPurchase: LeadPurchase): Promise<void> {
    // This would update analytics data in your database
    console.log('Updating lead purchase analytics for builder:', builderId);
  }

  private async getBuilderProjects(builderId: string): Promise<any[]> {
    // This would query your database for builder's projects
    return [];
  }

  private async getBuilderSubscriptionHistory(builderId: string): Promise<UserSubscription[]> {
    // This would query your database for builder's subscription history
    return [];
  }

  private async getTopProjectTypes(builderId: string): Promise<{ projectType: string; count: number; winRate: number }[]> {
    // This would analyze builder's project type performance
    return [];
  }

  private async getGeographicPerformance(builderId: string): Promise<{ area: string; leadsCount: number; winRate: number }[]> {
    // This would analyze builder's geographic performance
    return [];
  }

  private async storeUsageRecord(usage: UsageTracking): Promise<void> {
    // This would store the usage record in DynamoDB
    console.log('Storing usage record:', usage);
  }

  private async checkUsageLimits(builderId: string, featureType: string): Promise<void> {
    // This would check if usage exceeds plan limits and handle accordingly
    console.log('Checking usage limits for builder:', builderId, 'feature:', featureType);
  }

  private async getUsageForPeriod(builderId: string, billingPeriod: string): Promise<UsageTracking[]> {
    // This would query usage records for the specified billing period
    return [];
  }

  private async getAllUsageForBuilder(builderId: string): Promise<UsageTracking[]> {
    // This would query all usage records for the builder
    return [];
  }
}

export const builderSubscriptionService = new BuilderSubscriptionService();