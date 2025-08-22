'use client';

import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../../lib/types';
import { builderSubscriptionService } from '../../lib/services/builderSubscriptionService';

interface BuilderSubscriptionPlansProps {
  builderId: string;
  currentPlanId?: string;
  onPlanSelect: (planId: string) => void;
}

export const BuilderSubscriptionPlans: React.FC<BuilderSubscriptionPlansProps> = ({
  builderId,
  currentPlanId,
  onPlanSelect,
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadPlansAndUsage();
  }, [builderId]);

  const loadPlansAndUsage = async () => {
    try {
      setLoading(true);
      const [builderPlans, builderUsage] = await Promise.all([
        Promise.resolve(builderSubscriptionService.getBuilderPlans()),
        builderSubscriptionService.getBuilderUsageStats(builderId),
      ]);
      
      setPlans(builderPlans);
      setUsageStats(builderUsage);
    } catch (error) {
      console.error('Error loading plans and usage:', error);
    } finally {
      setLoading(false);
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
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
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Builder Subscription Plans</h2>
        <p className="text-lg text-gray-600">
          Choose the plan that fits your business needs and growth goals
        </p>
      </div>

      {/* Current Usage Summary */}
      {usageStats && (
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Your Current Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">{usageStats.leadsPurchasedThisMonth}</p>
              <p className="text-sm text-blue-700">Leads this month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">{usageStats.daysUntilRenewal}</p>
              <p className="text-sm text-blue-700">Days until renewal</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">
                {usageStats.analyticsAccess ? '✓' : '✗'}
              </p>
              <p className="text-sm text-blue-700">Analytics access</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">
                {usageStats.professionalQuoteGeneration ? '✓' : '✗'}
              </p>
              <p className="text-sm text-blue-700">Quote generation</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => {
          const price = getPrice(plan);
          const savings = getSavings(plan);
          const isCurrentPlan = currentPlanId === plan.id;
          const isPremium = plan.tier === 'premium';

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-lg shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
                isPremium ? 'border-blue-500 transform scale-105' : 'border-gray-200'
              } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
            >
              {isPremium && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatCurrency(price)}
                      </span>
                      <span className="text-gray-500 ml-2">
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && savings > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        Save {formatCurrency(savings)} per year
                      </p>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature.id} className="flex items-start">
                      <svg
                        className="h-6 w-6 text-green-500 mt-0.5 mr-3 flex-shrink-0"
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
                        <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Plan-specific benefits */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Perfect for:</h4>
                  {plan.tier === 'basic' ? (
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• New builders getting started</li>
                      <li>• Small operations (1-5 projects/month)</li>
                      <li>• Basic lead purchasing needs</li>
                    </ul>
                  ) : (
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Established builders scaling up</li>
                      <li>• High-volume operations (5+ projects/month)</li>
                      <li>• Data-driven business optimization</li>
                      <li>• Professional client services</li>
                    </ul>
                  )}
                </div>

                <button
                  onClick={() => onPlanSelect(plan.id)}
                  disabled={isCurrentPlan}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors ${
                    isCurrentPlan
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : isPremium
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : `Choose ${plan.name}`}
                </button>

                {/* Trial offer for new users */}
                {!isCurrentPlan && !usageStats?.subscription && (
                  <p className="text-center text-sm text-gray-500 mt-3">
                    14-day free trial included
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-16 bg-gray-50 rounded-lg p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Detailed Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-4 font-semibold text-gray-900">Feature</th>
                <th className="text-center py-4 font-semibold text-gray-900">Basic</th>
                <th className="text-center py-4 font-semibold text-gray-900">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-4 text-gray-700">Lead Purchasing</td>
                <td className="text-center py-4">✓</td>
                <td className="text-center py-4">✓</td>
              </tr>
              <tr>
                <td className="py-4 text-gray-700">Project Dashboard</td>
                <td className="text-center py-4">Basic</td>
                <td className="text-center py-4">Advanced</td>
              </tr>
              <tr>
                <td className="py-4 text-gray-700">Performance Analytics</td>
                <td className="text-center py-4">✗</td>
                <td className="text-center py-4">✓</td>
              </tr>
              <tr>
                <td className="py-4 text-gray-700">AI Business Insights</td>
                <td className="text-center py-4">✗</td>
                <td className="text-center py-4">✓</td>
              </tr>
              <tr>
                <td className="py-4 text-gray-700">Professional Quote Generation</td>
                <td className="text-center py-4">✗</td>
                <td className="text-center py-4">✓</td>
              </tr>
              <tr>
                <td className="py-4 text-gray-700">Priority Lead Access</td>
                <td className="text-center py-4">✗</td>
                <td className="text-center py-4">✓</td>
              </tr>
              <tr>
                <td className="py-4 text-gray-700">Customer Support</td>
                <td className="text-center py-4">Email</td>
                <td className="text-center py-4">Priority Phone & Email</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ROI Calculator */}
      <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">ROI Calculator</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Basic Plan ROI</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Monthly cost:</span>
                <span>{formatCurrency(plans.find(p => p.tier === 'basic')?.monthlyPrice || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Break-even (1 project @ £5k):</span>
                <span>1% of project value</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>ROI with 2 projects/month:</span>
                <span className="text-green-600">900%+</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Premium Plan ROI</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Monthly cost:</span>
                <span>{formatCurrency(plans.find(p => p.tier === 'premium')?.monthlyPrice || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Break-even (1 project @ £10k):</span>
                <span>1% of project value</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>ROI with 3 projects/month:</span>
                <span className="text-green-600">2900%+</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          *ROI calculations based on average project values and conversion rates
        </p>
      </div>
    </div>
  );
};

export default BuilderSubscriptionPlans;