'use client';

import React, { useState, useEffect } from 'react';
import { SubscriptionPlan, DiscountCode } from '../../lib/types';
import { subscriptionService } from '../../lib/services/subscriptionService';
import { discountService } from '../../lib/services/discountService';

interface SubscriptionPlansProps {
  userType: 'homeowner' | 'builder';
  currentPlanId?: string;
  onPlanSelect: (planId: string, discountCode?: string) => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  userType,
  currentPlanId,
  onPlanSelect,
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState('');
  const [validatedDiscount, setValidatedDiscount] = useState<DiscountCode | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadPlans();
  }, [userType]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const availablePlans = subscriptionService.getAvailablePlans(userType);
      setPlans(availablePlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateDiscountCode = async (code: string, planId: string) => {
    if (!code.trim()) {
      setValidatedDiscount(null);
      setDiscountError('');
      return;
    }

    try {
      const result = await discountService.validateDiscountCode(code.trim(), planId);
      if (result.valid && result.discountCode) {
        setValidatedDiscount(result.discountCode);
        setDiscountError('');
      } else {
        setValidatedDiscount(null);
        setDiscountError(result.error || 'Invalid discount code');
      }
    } catch (error) {
      setValidatedDiscount(null);
      setDiscountError('Error validating discount code');
    }
  };

  const calculateDiscountedPrice = (originalPrice: number, discount: DiscountCode): number => {
    return discountService.calculateDiscountedPrice(originalPrice, discount);
  };

  const getPrice = (plan: SubscriptionPlan): number => {
    return billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  };

  const getSavings = (plan: SubscriptionPlan): number => {
    if (billingCycle === 'yearly' && plan.yearlyPrice > 0) {
      const monthlyTotal = plan.monthlyPrice * 12;
      return monthlyTotal - plan.yearlyPrice;
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your {userType === 'homeowner' ? 'Homeowner' : 'Builder'} Plan
        </h2>
        <p className="text-lg text-gray-600">
          {userType === 'homeowner' 
            ? 'Get detailed project planning and connect with verified builders'
            : 'Access qualified leads and grow your business'
          }
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs text-green-600 font-semibold">Save up to 17%</span>
          </button>
        </div>
      </div>

      {/* Discount Code Input */}
      <div className="max-w-md mx-auto mb-8">
        <label htmlFor="discount-code" className="block text-sm font-medium text-gray-700 mb-2">
          Discount Code (Optional)
        </label>
        <input
          type="text"
          id="discount-code"
          value={discountCode}
          onChange={(e) => {
            setDiscountCode(e.target.value);
            if (e.target.value.trim()) {
              // Validate against the first paid plan for now
              const firstPaidPlan = plans.find(p => p.monthlyPrice > 0);
              if (firstPaidPlan) {
                validateDiscountCode(e.target.value, firstPaidPlan.id);
              }
            } else {
              setValidatedDiscount(null);
              setDiscountError('');
            }
          }}
          placeholder="Enter discount code"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {discountError && (
          <p className="mt-1 text-sm text-red-600">{discountError}</p>
        )}
        {validatedDiscount && (
          <p className="mt-1 text-sm text-green-600">
            ✓ {validatedDiscount.description}
          </p>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price = getPrice(plan);
          const savings = getSavings(plan);
          const discountedPrice = validatedDiscount && validatedDiscount.applicablePlans.includes(plan.id)
            ? calculateDiscountedPrice(price, validatedDiscount)
            : price;
          const isCurrentPlan = currentPlanId === plan.id;
          const isFree = plan.tier === 'free';
          const isPopular = plan.tier === 'premium';

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-lg shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
                isPopular ? 'border-blue-500' : 'border-gray-200'
              } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    {isFree ? (
                      <span className="text-3xl font-bold text-gray-900">Free</span>
                    ) : (
                      <div>
                        <div className="flex items-baseline justify-center">
                          {validatedDiscount && validatedDiscount.applicablePlans.includes(plan.id) && (
                            <span className="text-lg text-gray-500 line-through mr-2">
                              £{price.toFixed(2)}
                            </span>
                          )}
                          <span className="text-3xl font-bold text-gray-900">
                            £{discountedPrice.toFixed(2)}
                          </span>
                          <span className="text-gray-500 ml-1">
                            /{billingCycle === 'yearly' ? 'year' : 'month'}
                          </span>
                        </div>
                        {billingCycle === 'yearly' && savings > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            Save £{savings.toFixed(2)} per year
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature.id} className="flex items-start">
                      <svg
                        className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <span className="text-gray-900 font-medium">{feature.name}</span>
                        <p className="text-sm text-gray-500">{feature.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onPlanSelect(plan.id, validatedDiscount?.id)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    isCurrentPlan
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : isFree
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      : isPopular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : isFree ? 'Get Started' : 'Subscribe'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-900">Feature</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center py-2 font-medium text-gray-900">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {userType === 'homeowner' ? (
                <>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-700">Projects</td>
                    <td className="text-center py-2">1</td>
                    <td className="text-center py-2">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-700">Builder Invitations</td>
                    <td className="text-center py-2">3</td>
                    <td className="text-center py-2">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-700">Detailed Costing</td>
                    <td className="text-center py-2">✗</td>
                    <td className="text-center py-2">✓</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-700">PDF Downloads</td>
                    <td className="text-center py-2">✗</td>
                    <td className="text-center py-2">✓</td>
                  </tr>
                </>
              ) : (
                <>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-700">Lead Purchasing</td>
                    <td className="text-center py-2">✓</td>
                    <td className="text-center py-2">✓</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-700">Advanced Analytics</td>
                    <td className="text-center py-2">✗</td>
                    <td className="text-center py-2">✓</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-700">Professional Quote Generation</td>
                    <td className="text-center py-2">✗</td>
                    <td className="text-center py-2">✓</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;