'use client';

import React, { useState, useEffect } from 'react';
import { 
  BuilderFinancialSummary, 
  BuilderAnalytics,
  LeadPurchase,
  UserSubscription 
} from '../../lib/types';
import { builderSubscriptionService } from '../../lib/services/builderSubscriptionService';

interface BuilderFinancialDashboardProps {
  builderId: string;
}

export const BuilderFinancialDashboard: React.FC<BuilderFinancialDashboardProps> = ({
  builderId,
}) => {
  const [summary, setSummary] = useState<BuilderFinancialSummary | null>(null);
  const [insights, setInsights] = useState<{
    insights: string[];
    recommendations: string[];
    competitiveAdvantages: string[];
    improvementAreas: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'leads' | 'subscription'>('overview');

  useEffect(() => {
    loadFinancialData();
  }, [builderId]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const [financialSummary, builderInsights] = await Promise.all([
        builderSubscriptionService.getBuilderFinancialSummary(builderId),
        builderSubscriptionService.generateBuilderInsights(builderId),
      ]);
      
      setSummary(financialSummary);
      setInsights(builderInsights);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Dashboard</h1>
        <p className="text-gray-600">Track your business performance and subscription</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'leads', label: 'Lead Purchases' },
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
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.analytics.totalRevenue)}</p>
              <p className="text-sm text-gray-600 mt-1">{summary.analytics.projectsWon} projects won</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Conversion Rate</h3>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(summary.analytics.conversionRate)}</p>
              <p className="text-sm text-gray-600 mt-1">{summary.analytics.totalLeadsPurchased} leads purchased</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Project Value</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.analytics.averageProjectValue)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Lead Spend (Month)</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.analytics.monthlyLeadSpend)}</p>
              <p className="text-sm text-gray-600 mt-1">Avg: {formatCurrency(summary.analytics.averageLeadCost)}</p>
            </div>
          </div>

          {/* AI Insights */}
          {insights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Competitive Advantages */}
              {insights.competitiveAdvantages.length > 0 && (
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {insights.competitiveAdvantages.map((advantage, index) => (
                      <li key={index} className="text-green-800 text-sm">{advantage}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {insights.recommendations.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {insights.recommendations.map((recommendation, index) => (
                      <li key={index} className="text-blue-800 text-sm">{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Top Project Types */}
          {summary.analytics.topProjectTypes.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Project Types</h3>
              <div className="space-y-3">
                {summary.analytics.topProjectTypes.slice(0, 5).map((projectType, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {projectType.projectType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-500">{projectType.count} projects</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatPercentage(projectType.winRate)}</p>
                      <p className="text-sm text-gray-500">win rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Leads</span>
                  <span className="font-semibold">{summary.analytics.totalLeadsPurchased}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conversion Rate</span>
                  <span className="font-semibold">{formatPercentage(summary.analytics.conversionRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Lead Cost</span>
                  <span className="font-semibold">{formatCurrency(summary.analytics.averageLeadCost)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-semibold">{formatCurrency(summary.analytics.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Project Value</span>
                  <span className="font-semibold">{formatCurrency(summary.analytics.averageProjectValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lead Spend</span>
                  <span className="font-semibold">{formatCurrency(summary.analytics.totalSpentOnLeads)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">This Month Spend</span>
                  <span className="font-semibold">{formatCurrency(summary.analytics.monthlyLeadSpend)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Projects Won</span>
                  <span className="font-semibold">{summary.analytics.projectsWon}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Geographic Performance */}
          {summary.analytics.geographicPerformance.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Leads</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {summary.analytics.geographicPerformance.map((area, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{area.area}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-center">{area.leadsCount}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-center">{formatPercentage(area.winRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lead Purchases Tab */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Lead Purchase History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {summary.leadPurchaseHistory.map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(purchase.purchasedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      Project {purchase.projectId.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        purchase.status === 'completed' ? 'bg-green-100 text-green-800' :
                        purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {purchase.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(purchase.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {summary.leadPurchaseHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No lead purchases yet</p>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Subscription</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Plan Details</h4>
                  <p className="text-sm text-gray-600 mb-1">
                    Plan: {builderSubscriptionService.getBuilderPlans().find(p => p.id === summary.currentSubscription?.planId)?.name}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    Status: <span className="capitalize">{summary.currentSubscription.status}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Next billing: {formatDate(summary.currentSubscription.currentPeriodEnd)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Usage This Month</h4>
                  <p className="text-sm text-gray-600 mb-1">
                    Lead purchases: {summary.leadPurchaseHistory.filter(p => {
                      const monthStart = new Date();
                      monthStart.setDate(1);
                      return p.purchasedAt >= monthStart;
                    }).length}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total spent: {formatCurrency(summary.monthlySpend)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h3>
              <p className="text-gray-600 mb-4">
                Subscribe to access leads and grow your business.
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                View Plans
              </button>
            </div>
          )}

          {/* Subscription History */}
          {summary.subscriptionHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription History</h3>
              <div className="space-y-3">
                {summary.subscriptionHistory.map((sub) => (
                  <div key={sub.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">
                        {builderSubscriptionService.getBuilderPlans().find(p => p.id === sub.planId)?.name} Plan
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(sub.createdAt)} - {sub.cancelledAt ? formatDate(sub.cancelledAt) : 'Active'}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      sub.status === 'active' ? 'bg-green-100 text-green-800' :
                      sub.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BuilderFinancialDashboard;