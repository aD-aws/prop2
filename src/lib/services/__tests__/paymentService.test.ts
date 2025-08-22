import { PaymentService } from '../paymentService';
import { DiscountCode } from '../../types';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
    },
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        amount: 2999,
        currency: 'gbp',
      }),
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue({
        id: 'sub_test123',
        customer: 'cus_test123',
        current_period_start: 1640995200,
        current_period_end: 1643673600,
        latest_invoice: {
          payment_intent: {
            client_secret: 'pi_test123_secret',
          },
        },
      }),
      update: jest.fn().mockResolvedValue({
        id: 'sub_test123',
        current_period_start: 1640995200,
        current_period_end: 1643673600,
      }),
      cancel: jest.fn().mockResolvedValue({
        id: 'sub_test123',
        status: 'canceled',
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'sub_test123',
        items: {
          data: [{ id: 'si_test123' }],
        },
      }),
    },
    coupons: {
      create: jest.fn().mockResolvedValue({
        id: 'coupon_test123',
        percent_off: 10,
      }),
    },
  }));
});

describe('PaymentService', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
    jest.clearAllMocks();
  });

  describe('createCustomer', () => {
    it('should create a Stripe customer successfully', async () => {
      const customerId = await paymentService.createCustomer(
        'user123',
        'test@example.com',
        'John Doe'
      );

      expect(customerId).toBe('cus_test123');
    });

    it('should handle customer creation errors', async () => {
      const mockStripe = require('stripe');
      mockStripe().customers.create.mockRejectedValueOnce(new Error('Stripe error'));

      await expect(
        paymentService.createCustomer('user123', 'test@example.com', 'John Doe')
      ).rejects.toThrow('Failed to create customer');
    });
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      const paymentIntent = await paymentService.createPaymentIntent(
        29.99,
        'gbp',
        'cus_test123',
        'Test payment'
      );

      expect(paymentIntent.id).toBe('pi_test123');
      expect(paymentIntent.amount).toBe(2999); // Amount in pence
    });

    it('should convert amount to pence correctly', async () => {
      const mockStripe = require('stripe');
      
      await paymentService.createPaymentIntent(
        25.50,
        'gbp',
        'cus_test123',
        'Test payment'
      );

      expect(mockStripe().paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2550, // 25.50 * 100
        })
      );
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription successfully', async () => {
      const subscription = await paymentService.createSubscription(
        'cus_test123',
        'price_test123'
      );

      expect(subscription.id).toBe('sub_test123');
    });

    it('should apply discount code when provided', async () => {
      const mockDiscountCode: DiscountCode = {
        id: 'discount123',
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        description: '10% off',
        maxUses: 100,
        usedCount: 5,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        applicablePlans: ['plan123'],
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the private method
      jest.spyOn(paymentService as any, 'getDiscountCode').mockResolvedValue(mockDiscountCode);
      jest.spyOn(paymentService as any, 'isDiscountCodeValid').mockReturnValue(true);

      await paymentService.createSubscription(
        'cus_test123',
        'price_test123',
        'discount123'
      );

      const mockStripe = require('stripe');
      expect(mockStripe().coupons.create).toHaveBeenCalled();
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription at period end by default', async () => {
      const subscription = await paymentService.cancelSubscription('sub_test123');

      const mockStripe = require('stripe');
      expect(mockStripe().subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        { cancel_at_period_end: true }
      );
    });

    it('should cancel subscription immediately when specified', async () => {
      await paymentService.cancelSubscription('sub_test123', false);

      const mockStripe = require('stripe');
      expect(mockStripe().subscriptions.cancel).toHaveBeenCalledWith('sub_test123');
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription plan successfully', async () => {
      const subscription = await paymentService.updateSubscription(
        'sub_test123',
        'price_new123'
      );

      const mockStripe = require('stripe');
      expect(mockStripe().subscriptions.retrieve).toHaveBeenCalledWith('sub_test123');
      expect(mockStripe().subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        expect.objectContaining({
          items: [{
            id: 'si_test123',
            price: 'price_new123',
          }],
        })
      );
    });
  });

  describe('processLeadPurchase', () => {
    it('should process lead purchase successfully', async () => {
      jest.spyOn(paymentService as any, 'createLeadPurchaseRecord').mockResolvedValue('lead123');

      const result = await paymentService.processLeadPurchase(
        'cus_test123',
        'project123',
        25.00,
        'builder123'
      );

      expect(result.paymentIntent.id).toBe('pi_test123');
      expect(result.leadPurchaseId).toBe('lead123');
    });
  });

  describe('validateDiscountCode', () => {
    it('should validate discount code successfully', async () => {
      const mockDiscountCode: DiscountCode = {
        id: 'discount123',
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        description: '10% off',
        maxUses: 100,
        usedCount: 5,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        applicablePlans: ['plan123'],
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(paymentService as any, 'getDiscountCodeByCode').mockResolvedValue(mockDiscountCode);
      jest.spyOn(paymentService as any, 'isDiscountCodeValid').mockReturnValue(true);

      const result = await paymentService.validateDiscountCode('SAVE10', 'plan123');

      expect(result).toEqual(mockDiscountCode);
    });

    it('should return null for invalid discount code', async () => {
      jest.spyOn(paymentService as any, 'getDiscountCodeByCode').mockResolvedValue(null);

      const result = await paymentService.validateDiscountCode('INVALID', 'plan123');

      expect(result).toBeNull();
    });
  });

  describe('calculateDiscountedPrice', () => {
    it('should calculate percentage discount correctly', () => {
      const discountCode: DiscountCode = {
        id: 'discount123',
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        description: '10% off',
        maxUses: 100,
        usedCount: 5,
        validFrom: new Date(),
        validUntil: new Date(),
        applicablePlans: ['plan123'],
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const discountedPrice = paymentService.calculateDiscountedPrice(100, discountCode);
      expect(discountedPrice).toBe(90);
    });

    it('should calculate fixed amount discount correctly', () => {
      const discountCode: DiscountCode = {
        id: 'discount123',
        code: 'SAVE500',
        type: 'fixed_amount',
        value: 500, // £5.00 in pence
        description: '£5 off',
        maxUses: 100,
        usedCount: 5,
        validFrom: new Date(),
        validUntil: new Date(),
        applicablePlans: ['plan123'],
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const discountedPrice = paymentService.calculateDiscountedPrice(20, discountCode);
      expect(discountedPrice).toBe(15); // £20 - £5
    });
  });

  describe('handleWebhook', () => {
    it('should handle payment_intent.succeeded event', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            status: 'succeeded',
          },
        },
      };

      const handlePaymentSuccessSpy = jest.spyOn(paymentService as any, 'handlePaymentSuccess').mockResolvedValue(undefined);

      await paymentService.handleWebhook(mockEvent as any);

      expect(handlePaymentSuccessSpy).toHaveBeenCalledWith(mockEvent.data.object);
    });

    it('should handle unknown event types gracefully', async () => {
      const mockEvent = {
        type: 'unknown.event',
        data: { object: {} },
      };

      // Should not throw an error
      await expect(paymentService.handleWebhook(mockEvent as any)).resolves.toBeUndefined();
    });
  });
});