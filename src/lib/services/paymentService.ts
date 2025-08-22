import Stripe from 'stripe';
import { 
  Payment, 
  UserSubscription, 
  SubscriptionPlan, 
  DiscountCode, 
  DiscountUsage,
  PaymentStatus,
  SubscriptionStatus,
  SubscriptionTier,
  UserType
} from '../types';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export class PaymentService {
  /**
   * Create a Stripe customer for a user
   */
  async createCustomer(userId: string, email: string, name: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });

      return customer.id;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Create a payment intent for one-time payments
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'gbp',
    customerId: string,
    description: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to pence
        currency,
        customer: customerId,
        description,
        metadata: metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Create a subscription for a user
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    discountCodeId?: string
  ): Promise<Stripe.Subscription> {
    try {
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      };

      // Apply discount if provided
      if (discountCodeId) {
        const discountCode = await this.getDiscountCode(discountCodeId);
        if (discountCode && this.isDiscountCodeValid(discountCode)) {
          // Create Stripe coupon for the discount
          const coupon = await this.createStripeCoupon(discountCode);
          subscriptionData.coupon = coupon.id;
        }
      }

      const subscription = await stripe.subscriptions.create(subscriptionData);
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<Stripe.Subscription> {
    try {
      if (cancelAtPeriodEnd) {
        return await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      } else {
        return await stripe.subscriptions.cancel(subscriptionId);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(subscriptionId: string, newPriceId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      return await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Process lead purchase payment
   */
  async processLeadPurchase(
    customerId: string,
    projectId: string,
    amount: number,
    builderId: string
  ): Promise<{ paymentIntent: Stripe.PaymentIntent; leadPurchaseId: string }> {
    try {
      const paymentIntent = await this.createPaymentIntent(
        amount,
        'gbp',
        customerId,
        `Lead purchase for project ${projectId}`,
        {
          type: 'lead_purchase',
          projectId,
          builderId,
        }
      );

      // Create lead purchase record
      const leadPurchaseId = await this.createLeadPurchaseRecord(
        builderId,
        projectId,
        amount,
        paymentIntent.id
      );

      return { paymentIntent, leadPurchaseId };
    } catch (error) {
      console.error('Error processing lead purchase:', error);
      throw new Error('Failed to process lead purchase');
    }
  }

  /**
   * Validate and apply discount code
   */
  async validateDiscountCode(code: string, planId: string): Promise<DiscountCode | null> {
    try {
      const discountCode = await this.getDiscountCodeByCode(code);
      
      if (!discountCode) {
        return null;
      }

      if (!this.isDiscountCodeValid(discountCode)) {
        return null;
      }

      if (!discountCode.applicablePlans.includes(planId)) {
        return null;
      }

      return discountCode;
    } catch (error) {
      console.error('Error validating discount code:', error);
      return null;
    }
  }

  /**
   * Calculate discounted price
   */
  calculateDiscountedPrice(originalPrice: number, discountCode: DiscountCode): number {
    if (discountCode.type === 'percentage') {
      return originalPrice * (1 - discountCode.value / 100);
    } else {
      return Math.max(0, originalPrice - discountCode.value / 100); // Convert pence to pounds
    }
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId: string, limit: number = 50): Promise<Payment[]> {
    try {
      // This would typically query your database
      // For now, returning empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw new Error('Failed to fetch payment history');
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;
        case 'invoice.payment_succeeded':
          await this.handleSubscriptionPaymentSuccess(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handleSubscriptionPaymentFailure(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object as Stripe.Subscription);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getDiscountCode(id: string): Promise<DiscountCode | null> {
    // This would query your database for the discount code
    // Placeholder implementation
    return null;
  }

  private async getDiscountCodeByCode(code: string): Promise<DiscountCode | null> {
    // This would query your database for the discount code by code
    // Placeholder implementation
    return null;
  }

  private isDiscountCodeValid(discountCode: DiscountCode): boolean {
    const now = new Date();
    return (
      discountCode.isActive &&
      now >= discountCode.validFrom &&
      now <= discountCode.validUntil &&
      (discountCode.maxUses === undefined || discountCode.usedCount < discountCode.maxUses)
    );
  }

  private async createStripeCoupon(discountCode: DiscountCode): Promise<Stripe.Coupon> {
    const couponData: Stripe.CouponCreateParams = {
      name: discountCode.description,
      metadata: { discountCodeId: discountCode.id },
    };

    if (discountCode.type === 'percentage') {
      couponData.percent_off = discountCode.value;
    } else {
      couponData.amount_off = Math.round(discountCode.value); // Already in pence
      couponData.currency = 'gbp';
    }

    return await stripe.coupons.create(couponData);
  }

  private async createLeadPurchaseRecord(
    builderId: string,
    projectId: string,
    amount: number,
    paymentIntentId: string
  ): Promise<string> {
    // This would create a record in your database
    // Placeholder implementation
    return `lead_${Date.now()}`;
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // Update payment record in database
    console.log('Payment succeeded:', paymentIntent.id);
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // Update payment record in database
    console.log('Payment failed:', paymentIntent.id);
  }

  private async handleSubscriptionPaymentSuccess(invoice: Stripe.Invoice): Promise<void> {
    // Update subscription record in database
    console.log('Subscription payment succeeded:', invoice.id);
  }

  private async handleSubscriptionPaymentFailure(invoice: Stripe.Invoice): Promise<void> {
    // Handle failed subscription payment
    console.log('Subscription payment failed:', invoice.id);
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    // Update subscription record in database
    console.log('Subscription updated:', subscription.id);
  }

  private async handleSubscriptionCancellation(subscription: Stripe.Subscription): Promise<void> {
    // Update subscription record in database
    console.log('Subscription cancelled:', subscription.id);
  }
}

export const paymentService = new PaymentService();