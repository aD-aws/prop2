'use client';

import React, { useState, useEffect } from 'react';
import { 
  FinancialSummary, 
  Payment, 
  UserSubscription, 
  UpcomingCharge,
  LeadPurchase 
} from '../../lib/types';
import { subscriptionService } from '../../lib/services/subscriptionService';
import { paymentService } from '../../lib/services/paymentService';

interface FinancialDashboardProps {
  userId: string;
  userType: 'homeowner' | 'builder';
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  userId,
  userType,
}) => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'subscription'>('overview');

  useEffect(() => {
    loadFinancialSummary();
  }, [userId]);

  const loadFinancialSummary = async () => {
    try {
      setLoading(true);
      const financialSummary = await subscriptionService.getFinancialSummary(userId);
      setSummary(financialSummary);
    } catch (error) {
      console.error('Error loading financial summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!summary?.currentSubscription) return;

    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.'
    );

    if (confirmed) {
      try {
        await subscriptionService.cancelSubscription(userId, true);
        await loadFinancialSummary();
      } catch (error) {
        console.error('Error cancelling subscription:', error);
        alert('Failed to cancel subscription. Please try again.');
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const getPaymentStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'refunded':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Unable to load financial information</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Dashboard</h1>
        <p className="text-gray-600">Manage your subscription and view payment history</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'payments', label: 'Payment History' },
            { id: 'subscription', label: 'Subscription' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Spent</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalSpent)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">This Month</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.monthlySpend)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">This Year</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.yearlySpend)}</p>
            </div>
          </div>

          {/* Current Subscription */}
          {summary.currentSubscription && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Subscription</h3>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">
                    {subscriptionService.getPlanById(summary.currentSubscription.planId)?.name} Plan
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: <span className="capitalize">{summary.currentSubscription.status}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Next billing: {formatDate(summary.currentSubscription.currentPeriodEnd)}
                  </p>
                  {summary.currentSubscription.cancelAtPeriodEnd && (
                    <p className="text-sm text-orange-600 font-medium">
                      Subscription will cancel on {formatDate(summary.currentSubscription.currentPeriodEnd)}
                    </p>
                  )}
                </div>
                {!summary.currentSubscription.cancelAtPeriodEnd && (
                  <button
                    onClick={handleCancelSubscription}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Charges */}
          {summary.upcomingCharges.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Charges</h3>
              <div className="space-y-3">
                {summary.upcomingCharges.map((charge) => (
                  <div key={charge.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{charge.description}</p>
                      <p className="text-sm text-gray-500">Due: {formatDate(charge.dueDate)}</p>
                    </div>
                    <p className="font-semibold text-gray-900">{formatCurrency(charge.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lead Purchases (for builders) */}
          {userType === 'builder' && summary.leadPurchases.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Lead Purchases</h3>
              <div className="space-y-3">
                {summary.leadPurchases.slice(0, 5).map((purchase) => (
                  <div key={purchase.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">Project Lead</p>
                      <p className="text-sm text-gray-500">
                        Purchased: {formatDate(purchase.purchasedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(purchase.amount)}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(purchase.status)}`}>
                        {purchase.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment History Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.recentPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {payment.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {payment.type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {summary.recentPayments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No payment history available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {summary.currentSubscription ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Plan Information</h4>
                  <p className="text-sm text-gray-600 mb-1">
                    Plan: {subscriptionService.getPlanById(summary.currentSubscription.planId)?.name}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    Status: <span className="capitalize">{summary.currentSubscription.status}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Stripe ID: {summary.currentSubscription.stripeSubscriptionId}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Billing Information</h4>
                  <p className="text-sm text-gray-600 mb-1">
                    Current period: {formatDate(summary.currentSubscription.currentPeriodStart)} - {formatDate(summary.currentSubscription.currentPeriodEnd)}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    Created: {formatDate(summary.currentSubscription.createdAt)}
                  </p>
                  {summary.currentSubscription.cancelledAt && (
                    <p className="text-sm text-red-600">
                      Cancelled: {formatDate(summary.currentSubscription.cancelledAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h3>
              <p className="text-gray-600 mb-4">
                You're currently on the free plan. Upgrade to unlock premium features.
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                View Plans
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;