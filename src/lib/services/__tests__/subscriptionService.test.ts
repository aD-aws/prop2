import { SubscriptionService } from '../subscriptionService';
import { SubscriptionPlan, UserSubscription, SubscriptionTier } from '../../types';
import { paymentService } from '../paymentService';

// Mock the payment service
jest.mock('../paymentService', () => ({
  paymentService: {
    createSubscription: jest.fn(),
    updateSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
    getPaymentHistory: jest.fn(),
  },
}));

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  const mockPaymentService = paymentService as jest.Mocked<typeof paymentService>;

  beforeEach(() => {
    subscriptionService = new SubscriptionService();
    jest.clearAllMocks();
  });

  describe('getAvailablePlans', () => {
    it('should return homeowner plans when userType is homeowner', () => {
      const plans = subscriptionService.getAvailablePlans('homeowner');
      
      expect(plans).toHaveLength(2);
      expect(plans.every(plan => plan.userType === 'homeowner')).toBe(true);
      expect(plans.some(plan => plan.tier === 'free')).toBe(true);
      expect(plans.some(plan => plan.tier === 'premium')).toBe(true);
    });

    it('should return builder plans when userType is builder', () => {
      const plans = subscriptionService.getAvailablePlans('builder');
      
      expect(plans).toHaveLength(2);
      expect(plans.every(plan => plan.userType === 'builder')).toBe(true);
      expect(plans.some(plan => plan.tier === 'basic')).toBe(true);
      expect(plans.some(plan => plan.tier === 'premium')).toBe(true);
    });

    it('should only return active plans', () => {
      const plans = subscriptionService.getAvailablePlans('homeowner');
      
      expect(plans.every(plan => plan.isActive)).toBe(true);
    });
  });

  describe('getPlanById', () => {
    it('should return the correct plan by ID', () => {
      const plan = subscriptionService.getPlanById('homeowner_free');
      
      expect(plan).toBeDefined();
      expect(plan?.id).toBe('homeowner_free');
      expect(plan?.userType).toBe('homeowner');
      expect(plan?.tier).toBe('free');
    });

    it('should return null for non-existent plan ID', () => {
      const plan = subscriptionService.getPlanById('non_existent_plan');
      
      expect(plan).toBeNull();
    });
  });

  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      const mockStripeSubscription = {
        id: 'sub_test123',
        current_period_start: 1640995200,
        current_period_end: 1643673600,
        latest_invoice: {
          payment_intent: {
            client_secret: 'pi_test123_secret',
          },
        },
      };

      mockPaymentService.createSubscription.mockResolvedValue(mockStripeSubscription as any);

      const saveSubscriptionSpy = jest.spyOn(subscriptionService as any, 'saveSubscription').mockResolvedValue(undefined);

      const result = await subscriptionService.createSubscription(
        'user123',
        'homeowner_premium',
        'cus_test123'
      );

      expect(result.subscription.userId).toBe('user123');
      expect(result.subscription.planId).toBe('homeowner_premium');
      expect(result.subscription.stripeSubscriptionId).toBe('sub_test123');
      expect(result.clientSecret).toBe('pi_test123_secret');
      expect(saveSubscriptionSpy).toHaveBeenCalled();
    });

    it('should throw error for invalid plan ID', async () => {
      await expect(
        subscriptionService.createSubscription(
          'user123',
          'invalid_plan',
          'cus_test123'
        )
      ).rejects.toThrow('Invalid plan ID');
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription successfully', async () => {
      const mockCurrentSubscription: UserSubscription = {
        id: 'sub123',
        userId: 'user123',
        planId: 'homeowner_free',
        status: 'active',
        stripeSubscriptionId: 'sub_test123',
        stripeCustomerId: 'cus_test123',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockStripeSubscription = {
        id: 'sub_test123',
        current_period_start: 1640995200,
        current_period_end: 1643673600,
      };

      jest.spyOn(subscriptionService, 'getUserSubscription').mockResolvedValue(mockCurrentSubscription);
      mockPaymentService.updateSubscription.mockResolvedValue(mockStripeSubscription as any);
      const saveSubscriptionSpy = jest.spyOn(subscriptionService as any, 'saveSubscription').mockResolvedValue(undefined);

      const result = await subscriptionService.updateSubscription('user123', 'homeowner_premium');

      expect(result.planId).toBe('homeowner_premium');
      expect(saveSubscriptionSpy).toHaveBeenCalled();
    });

    it('should throw error when no active subscription found', async () => {
      jest.spyOn(subscriptionService, 'getUserSubscription').mockResolvedValue(null);

      await expect(
        subscriptionService.updateSubscription('user123', 'homeowner_premium')
      ).rejects.toThrow('No active subscription found');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription at period end by default', async () => {
      const mockSubscription: UserSubscription = {
        id: 'sub123',
        userId: 'user123',
        planId: 'homeowner_premium',
        status: 'active',
        stripeSubscriptionId: 'sub_test123',
        stripeCustomerId: 'cus_test123',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(subscriptionService, 'getUserSubscription').mockResolvedValue(mockSubscription);
      mockPaymentService.cancelSubscription.mockResolvedValue({} as any);
      const saveSubscriptionSpy = jest.spyOn(subscriptionService as any, 'saveSubscription').mockResolvedValue(undefined);

      const result = await subscriptionService.cancelSubscription('user123');

      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.status).toBe('active');
      expect(saveSubscriptionSpy).toHaveBeenCalled();
    });

    it('should cancel subscription immediately when specified', async () => {
      const mockSubscription: UserSubscription = {
        id: 'sub123',
        userId: 'user123',
        planId: 'homeowner_premium',
        status: 'active',
        stripeSubscriptionId: 'sub_test123',
        stripeCustomerId: 'cus_test123',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(subscriptionService, 'getUserSubscription').mockResolvedValue(mockSubscription);
      mockPaymentService.cancelSubscription.mockResolvedValue({} as any);
      const saveSubscriptionSpy = jest.spyOn(subscriptionService as any, 'saveSubscription').mockResolvedValue(undefined);

      const result = await subscriptionService.cancelSubscription('user123', false);

      expect(result.cancelAtPeriodEnd).toBe(false);
      expect(result.status).toBe('cancelled');
      expect(result.cancelledAt).toBeDefined();
      expect(saveSubscriptionSpy).toHaveBeenCalled();
    });
  });

  describe('hasFeatureAccess', () => {
    it('should return true for free plan features when no subscription', async () => {
      jest.spyOn(subscriptionService, 'getUserSubscription').mockResolvedValue(null);

      const hasAccess = await subscriptionService.hasFeatureAccess('user123', 'basic_sow');

      expect(hasAccess).toBe(true);
    });

    it('should return false for premium features when no subscription', async () => {
      jest.spyOn(subscriptionService, 'getUserSubscription').mockResolvedValue(null);

      const hasAccess = await subscriptionService.hasFeatureAccess('user123', 'detailed_sow');

      expect(hasAccess).toBe(false);
    });

    it('should return true for included features in current plan', async () => {
      const mockSubscription: UserSubscription = {
        id: 'sub123',
        userId: 'user123',
        planId: 'homeowner_premium',
        status: 'active',
        stripeSubscriptionId: 'sub_test123',
        stripeCustomerId: 'cus_test123',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(subscriptionService, 'getUserSubscription').mockResolvedValue(mockSubscription);

      const hasAccess = await subscriptionService.hasFeatureAccess('user123', 'detailed_sow');

      expect(hasAccess).toBe(true);
    });
  });

  describe('checkUsageLimit', () => {
    it('should return true for unlimited features', async () => {
      const mockSubscription: UserSubscription = {
        id: 'sub123',
        userId: 'user123',
        planId: 'homeowner_premium',
        status: 'active',
        stripeSubscriptionId: 'sub_test123',
        stripeCustomerId: 'cus_test123',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(subscriptionService, 'getUserSubscription').mockResolvedValue(mockSubscription);

      const withinLimit = await subscriptionService.checkUsageLimit('user123', 'maxProjects');

      expect(withinLimit).toBe(true); // Premium plan has unlimited projects
    });

    it('should return boolean value for boolean limits', async () => {
      const mockSubscription: UserSubscription = {
        id: 'sub123',
        userId: 'user123',
        planId: 'homeowner_premium',
        status: 'active',
        stripeSubscriptionId: 'sub_test123',
        stripeCustomerId: 'cus_test123',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(subscriptionService, 'getUserSubscription').mockResolvedValue(mockSubscription);

      const withinLimit = await subscriptionService.checkUsageLimit('user123', 'pdfDownloads');

      expect(withinLimit).toBe(true); // Premium plan allows PDF downloads
    });

    it('should check numeric limits against current usage', async () => {
      jest.spyOn(subscriptionService, 'getUserSubscription').mockResolvedValue(null); // Free plan
      jest.spyOn(subscriptionService as any, 'getCurrentUsage').mockResolvedValue(0);

      const withinLimit = await subscriptionService.checkUsageLimit('user123', 'maxProjects');

      expect(withinLimit).toBe(true); // 0 < 1 (free plan limit)
    });
  });

  describe('getFinancialSummary', () => {
    it('should generate financial summary successfully', async () => {
      const mockSubscription: UserSubscription = {
        id: 'sub123',
        userId: 'user123',
        planId: 'homeowner_premium',
        status: 'active',
        stripeSubscriptionId: 'sub_test123',
        stripeCustomerId: 'cus_test123',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPayments = [
        {
          id: 'pay123',
          userId: 'user123',
          type: 'subscription' as const,
          amount: 29.99,
          currency: 'gbp',
          status: 'completed' as const,
          stripePaymentIntentId: 'pi_test123',
          description: 'Premium subscription',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(subscriptionService, 'getUserSubscription').mockResolvedValue(mockSubscription);
      mockPaymentService.getPaymentHistory.mockResolvedValue(mockPayments);

      const summary = await subscriptionService.getFinancialSummary('user123');

      expect(summary.userId).toBe('user123');
      expect(summary.currentSubscription).toEqual(mockSubscription);
      expect(summary.totalSpent).toBe(29.99);
      expect(summary.upcomingCharges).toHaveLength(1);
      expect(summary.upcomingCharges[0].description).toContain('Premium subscription renewal');
    });
  });

  describe('Plan Configuration', () => {
    it('should have correct homeowner free plan configuration', () => {
      const plan = subscriptionService.getPlanById('homeowner_free');
      
      expect(plan).toBeDefined();
      expect(plan?.monthlyPrice).toBe(0);
      expect(plan?.yearlyPrice).toBe(0);
      expect(plan?.limits.maxProjects).toBe(1);
      expect(plan?.limits.maxBuilderInvitations).toBe(3);
      expect(plan?.limits.pdfDownloads).toBe(false);
      expect(plan?.limits.detailedCosting).toBe(false);
    });

    it('should have correct homeowner premium plan configuration', () => {
      const plan = subscriptionService.getPlanById('homeowner_premium');
      
      expect(plan).toBeDefined();
      expect(plan?.monthlyPrice).toBe(29.99);
      expect(plan?.yearlyPrice).toBe(299.99);
      expect(plan?.limits.maxProjects).toBeUndefined(); // unlimited
      expect(plan?.limits.maxBuilderInvitations).toBeUndefined(); // unlimited
      expect(plan?.limits.pdfDownloads).toBe(true);
      expect(plan?.limits.detailedCosting).toBe(true);
    });

    it('should have correct builder plans configuration', () => {
      const basicPlan = subscriptionService.getPlanById('builder_basic');
      const premiumPlan = subscriptionService.getPlanById('builder_premium');
      
      expect(basicPlan?.limits.maxAnalyticsAccess).toBe(false);
      expect(basicPlan?.limits.professionalQuoteGeneration).toBe(false);
      
      expect(premiumPlan?.limits.maxAnalyticsAccess).toBe(true);
      expect(premiumPlan?.limits.professionalQuoteGeneration).toBe(true);
    });
  });
});