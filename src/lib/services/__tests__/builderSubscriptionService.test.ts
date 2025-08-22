import { BuilderSubscriptionService } from '../builderSubscriptionService';
import { subscriptionService } from '../subscriptionService';
import { leadPurchaseService } from '../leadPurchaseService';
import { UserSubscription, LeadPurchase } from '../../types';

// Mock dependencies
jest.mock('../subscriptionService');
jest.mock('../leadPurchaseService');

describe('BuilderSubscriptionService', () => {
  let builderSubscriptionService: BuilderSubscriptionService;
  const mockSubscriptionService = subscriptionService as jest.Mocked<typeof subscriptionService>;
  const mockLeadPurchaseService = leadPurchaseService as jest.Mocked<typeof leadPurchaseService>;

  beforeEach(() => {
    builderSubscriptionService = new BuilderSubscriptionService();
    jest.clearAllMocks();
  });

  describe('getBuilderPlans', () => {
    it('should return builder-specific plans', () => {
      const mockPlans = [
        {
          id: 'builder_basic',
          name: 'Basic',
          tier: 'basic' as const,
          userType: 'builder' as const,
          monthlyPrice: 49.99,
          yearlyPrice: 499.99,
          features: [],
          limits: {},
          stripePriceId: 'price_basic',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockSubscriptionService.getAvailablePlans.mockReturnValue(mockPlans);

      const result = builderSubscriptionService.getBuilderPlans();

      expect(mockSubscriptionService.getAvailablePlans).toHaveBeenCalledWith('builder');
      expect(result).toEqual(mockPlans);
    });
  });

  describe('createBuilderSubscription', () => {
    it('should create builder subscription with trial period', async () => {
      const mockSubscription: UserSubscription = {
        id: 'sub123',
        userId: 'builder123',
        planId: 'builder_basic',
        status: 'active',
        stripeSubscriptionId: 'sub_stripe123',
        stripeCustomerId: 'cus_stripe123',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPlan = {
        id: 'builder_basic',
        userType: 'builder' as const,
        tier: 'basic' as const,
        name: 'Basic',
        monthlyPrice: 49.99,
        yearlyPrice: 499.99,
        features: [],
        limits: {},
        stripePriceId: 'price_basic',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubscriptionService.getPlanById.mockReturnValue(mockPlan);
      mockSubscriptionService.createSubscription.mockResolvedValue({
        subscription: mockSubscription,
        clientSecret: 'pi_test_secret',
      });

      const result = await builderSubscriptionService.createBuilderSubscription(
        'builder123',
        'builder_basic',
        'cus_stripe123',
        14
      );

      expect(result.subscription.trialStart).toBeDefined();
      expect(result.subscription.trialEnd).toBeDefined();
      expect(result.clientSecret).toBe('pi_test_secret');
    });

    it('should throw error for invalid plan', async () => {
      mockSubscriptionService.getPlanById.mockReturnValue(null);

      await expect(
        builderSubscriptionService.createBuilderSubscription(
          'builder123',
          'invalid_plan',
          'cus_stripe123'
        )
      ).rejects.toThrow('Invalid builder plan ID');
    });

    it('should throw error for non-builder plan', async () => {
      const mockPlan = {
        id: 'homeowner_premium',
        userType: 'homeowner' as const,
        tier: 'premium' as const,
        name: 'Premium',
        monthlyPrice: 29.99,
        yearlyPrice: 299.99,
        features: [],
        limits: {},
        stripePriceId: 'price_premium',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubscriptionService.getPlanById.mockReturnValue(mockPlan);

      await expect(
        builderSubscriptionService.createBuilderSubscription(
          'builder123',
          'homeowner_premium',
          'cus_stripe123'
        )
      ).rejects.toThrow('Invalid builder plan ID');
    });
  });

  describe('canBuilderPurchaseLeads', () => {
    it('should return true for active subscription within period', async () => {
      const mockSubscription: UserSubscription = {
        id: 'sub123',
        userId: 'builder123',
        planId: 'builder_basic',
        status: 'active',
        stripeSubscriptionId: 'sub_stripe123',
        stripeCustomerId: 'cus_stripe123',
        currentPeriodStart: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubscriptionService.getUserSubscription.mockResolvedValue(mockSubscription);

      const result = await builderSubscriptionService.canBuilderPurchaseLeads('builder123');

      expect(result).toBe(true);
    });

    it('should return true for valid trial period', async () => {
      const mockSubscription: UserSubscription = {
        id: 'sub123',
        userId: 'builder123',
        planId: 'builder_basic',
        status: 'active',
        stripeSubscriptionId: 'sub_stripe123',
        stripeCustomerId: 'cus_stripe123',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (expired)
        cancelAtPeriodEnd: false,
        trialStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        trialEnd: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubscriptionService.getUserSubscription.mockResolvedValue(mockSubscription);

      const result = await builderSubscriptionService.canBuilderPurchaseLeads('builder123');

      expect(result).toBe(true);
    });

    it('should return false for no subscription', async () => {
      mockSubscriptionService.getUserSubscription.mockResolvedValue(null);

      const result = await builderSubscriptionService.canBuilderPurchaseLeads('builder123');

      expect(result).toBe(false);
    });

    it('should return false for inactive subscription', async () => {
      const mockSubscription: UserSubscription = {
        id: 'sub123',
        userId: 'builder123',
        planId: 'builder_basic',
        status: 'cancelled',
        stripeSubscriptionId: 'sub_stripe123',
        stripeCustomerId: 'cus_stripe123',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubscriptionService.getUserSubscription.mockResolvedValue(mockSubscription);

      const result = await builderSubscriptionService.canBuilderPurchaseLeads('builder123');

      expect(result).toBe(false);
    });

    it('should return false for expired subscription and trial', async () => {
      const mockSubscription: UserSubscription = {
        id: 'sub123',
        userId: 'builder123',
        planId: 'builder_basic',
        status: 'active',
        stripeSubscriptionId: 'sub_stripe123',
        stripeCustomerId: 'cus_stripe123',
        currentPeriodStart: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
        currentPeriodEnd: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (expired)
        cancelAtPeriodEnd: false,
        trialStart: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // 50 days ago
        trialEnd: new Date(Date.now() - 36 * 24 * 60 * 60 * 1000), // 36 days ago (expired)
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubscriptionService.getUserSubscription.mockResolvedValue(mockSubscription);

      const result = await builderSubscriptionService.canBuilderPurchaseLeads('builder123');

      expect(result).toBe(false);
    });
  });

  describe('purchaseLeadForBuilder', () => {
    it('should process lead purchase successfully', async () => {
      const mockLeadPurchase: LeadPurchase = {
        id: 'lead123',
        builderId: 'builder123',
        projectId: 'project123',
        amount: 25.00,
        status: 'completed',
        paymentId: 'pi_test123',
        purchasedAt: new Date(),
      };

      // Mock canBuilderPurchaseLeads to return true
      jest.spyOn(builderSubscriptionService, 'canBuilderPurchaseLeads').mockResolvedValue(true);
      
      mockLeadPurchaseService.purchaseLead.mockResolvedValue({
        leadPurchase: mockLeadPurchase,
        clientSecret: 'pi_test_secret',
      });

      // Mock private method
      jest.spyOn(builderSubscriptionService as any, 'updateLeadPurchaseAnalytics').mockResolvedValue(undefined);

      const result = await builderSubscriptionService.purchaseLeadForBuilder(
        'builder123',
        'project123',
        'cus_stripe123'
      );

      expect(result.leadPurchase).toEqual(mockLeadPurchase);
      expect(result.clientSecret).toBe('pi_test_secret');
    });

    it('should throw error when builder cannot purchase leads', async () => {
      jest.spyOn(builderSubscriptionService, 'canBuilderPurchaseLeads').mockResolvedValue(false);

      await expect(
        builderSubscriptionService.purchaseLeadForBuilder(
          'builder123',
          'project123',
          'cus_stripe123'
        )
      ).rejects.toThrow('Builder subscription required to purchase leads');
    });
  });

  describe('getBuilderAnalytics', () => {
    it('should calculate analytics correctly', async () => {
      const mockLeadPurchases: LeadPurchase[] = [
        {
          id: 'lead1',
          builderId: 'builder123',
          projectId: 'project1',
          amount: 25.00,
          status: 'completed',
          paymentId: 'pi_1',
          purchasedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        },
        {
          id: 'lead2',
          builderId: 'builder123',
          projectId: 'project2',
          amount: 30.00,
          status: 'completed',
          paymentId: 'pi_2',
          purchasedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago (last month)
        },
      ];

      const mockProjects = [
        { id: 'project1', status: 'won', contractValue: 5000 },
        { id: 'project2', status: 'completed', contractValue: 8000 },
      ];

      mockLeadPurchaseService.getBuilderLeadHistory.mockResolvedValue(mockLeadPurchases);
      jest.spyOn(builderSubscriptionService as any, 'getBuilderProjects').mockResolvedValue(mockProjects);
      jest.spyOn(builderSubscriptionService as any, 'getTopProjectTypes').mockResolvedValue([]);
      jest.spyOn(builderSubscriptionService as any, 'getGeographicPerformance').mockResolvedValue([]);

      const analytics = await builderSubscriptionService.getBuilderAnalytics('builder123');

      expect(analytics.totalLeadsPurchased).toBe(2);
      expect(analytics.totalSpentOnLeads).toBe(55.00);
      expect(analytics.monthlyLeadSpend).toBe(25.00); // Only the recent purchase
      expect(analytics.averageLeadCost).toBe(27.50);
      expect(analytics.projectsWon).toBe(1);
      expect(analytics.conversionRate).toBe(50); // 1 won out of 2 leads
      expect(analytics.totalRevenue).toBe(8000); // Only completed projects
      expect(analytics.averageProjectValue).toBe(8000); // 8000 / 1 won project
    });

    it('should handle empty data gracefully', async () => {
      mockLeadPurchaseService.getBuilderLeadHistory.mockResolvedValue([]);
      jest.spyOn(builderSubscriptionService as any, 'getBuilderProjects').mockResolvedValue([]);
      jest.spyOn(builderSubscriptionService as any, 'getTopProjectTypes').mockResolvedValue([]);
      jest.spyOn(builderSubscriptionService as any, 'getGeographicPerformance').mockResolvedValue([]);

      const analytics = await builderSubscriptionService.getBuilderAnalytics('builder123');

      expect(analytics.totalLeadsPurchased).toBe(0);
      expect(analytics.totalSpentOnLeads).toBe(0);
      expect(analytics.averageLeadCost).toBe(0);
      expect(analytics.conversionRate).toBe(0);
      expect(analytics.projectsWon).toBe(0);
      expect(analytics.totalRevenue).toBe(0);
      expect(analytics.averageProjectValue).toBe(0);
    });
  });

  describe('generateBuilderInsights', () => {
    it('should generate insights based on analytics', async () => {
      const mockAnalytics = {
        totalLeadsPurchased: 10,
        totalSpentOnLeads: 250,
        monthlyLeadSpend: 75,
        averageLeadCost: 25,
        conversionRate: 35, // Above 30%
        projectsWon: 3,
        totalRevenue: 25000,
        averageProjectValue: 8333,
        topProjectTypes: [
          { projectType: 'kitchen_full_refit', count: 5, winRate: 45 }
        ],
        geographicPerformance: [
          { area: 'London', leadsCount: 6, winRate: 40 }
        ],
      };

      const mockUsageStats = {
        currentPlan: null,
        subscription: null,
        leadsPurchasedThisMonth: 3,
        analyticsAccess: false,
        professionalQuoteGeneration: false,
        daysUntilRenewal: 0,
      };

      jest.spyOn(builderSubscriptionService, 'getBuilderAnalytics').mockResolvedValue(mockAnalytics);
      jest.spyOn(builderSubscriptionService, 'getBuilderUsageStats').mockResolvedValue(mockUsageStats);

      const insights = await builderSubscriptionService.generateBuilderInsights('builder123');

      expect(insights.competitiveAdvantages).toContain(
        expect.stringContaining('Excellent conversion rate of 35.0%')
      );
      expect(insights.insights).toContain(
        expect.stringContaining('Strongest performance in London')
      );
      expect(insights.competitiveAdvantages).toContain(
        expect.stringContaining('Strong specialization in kitchen_full_refit')
      );
      expect(insights.recommendations).toContain(
        expect.stringContaining('Upgrade to Premium to access detailed analytics')
      );
    });

    it('should identify improvement areas for low conversion rate', async () => {
      const mockAnalytics = {
        totalLeadsPurchased: 20,
        totalSpentOnLeads: 500,
        monthlyLeadSpend: 100,
        averageLeadCost: 25,
        conversionRate: 10, // Below 15%
        projectsWon: 2,
        totalRevenue: 10000,
        averageProjectValue: 5000,
        topProjectTypes: [],
        geographicPerformance: [],
      };

      const mockUsageStats = {
        currentPlan: null,
        subscription: null,
        leadsPurchasedThisMonth: 4,
        analyticsAccess: true,
        professionalQuoteGeneration: true,
        daysUntilRenewal: 15,
      };

      jest.spyOn(builderSubscriptionService, 'getBuilderAnalytics').mockResolvedValue(mockAnalytics);
      jest.spyOn(builderSubscriptionService, 'getBuilderUsageStats').mockResolvedValue(mockUsageStats);

      const insights = await builderSubscriptionService.generateBuilderInsights('builder123');

      expect(insights.improvementAreas).toContain(
        expect.stringContaining('Low conversion rate suggests need to improve')
      );
      expect(insights.recommendations).toContain(
        expect.stringContaining('Consider reviewing your pricing strategy')
      );
    });
  });

  describe('handleSubscriptionExpiration', () => {
    it('should handle expired subscription', async () => {
      const expiredSubscription: UserSubscription = {
        id: 'sub123',
        userId: 'builder123',
        planId: 'builder_basic',
        status: 'active',
        stripeSubscriptionId: 'sub_stripe123',
        stripeCustomerId: 'cus_stripe123',
        currentPeriodStart: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Expired
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubscriptionService.getUserSubscription.mockResolvedValue(expiredSubscription);
      
      const updateStatusSpy = jest.spyOn(builderSubscriptionService as any, 'updateSubscriptionStatus').mockResolvedValue(undefined);
      const restrictFeaturesSpy = jest.spyOn(builderSubscriptionService as any, 'restrictPremiumFeatures').mockResolvedValue(undefined);
      const notifyBuilderSpy = jest.spyOn(builderSubscriptionService as any, 'notifyBuilderOfExpiration').mockResolvedValue(undefined);

      await builderSubscriptionService.handleSubscriptionExpiration('builder123');

      expect(updateStatusSpy).toHaveBeenCalled();
      expect(restrictFeaturesSpy).toHaveBeenCalledWith('builder123');
      expect(notifyBuilderSpy).toHaveBeenCalledWith('builder123', expect.any(Object));
    });

    it('should not process non-expired subscription', async () => {
      const activeSubscription: UserSubscription = {
        id: 'sub123',
        userId: 'builder123',
        planId: 'builder_basic',
        status: 'active',
        stripeSubscriptionId: 'sub_stripe123',
        stripeCustomerId: 'cus_stripe123',
        currentPeriodStart: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // Not expired
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubscriptionService.getUserSubscription.mockResolvedValue(activeSubscription);
      
      const updateStatusSpy = jest.spyOn(builderSubscriptionService as any, 'updateSubscriptionStatus').mockResolvedValue(undefined);

      await builderSubscriptionService.handleSubscriptionExpiration('builder123');

      expect(updateStatusSpy).not.toHaveBeenCalled();
    });
  });
});