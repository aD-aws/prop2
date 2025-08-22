'use client';

import React, { useState, useEffect } from 'react';
import {
  QuoteVarianceMetrics,
  BuilderPerformanceMetrics,
  PlatformUsageMetrics,
  FinancialMetrics,
  adminAnalyticsService
} from '@/lib/services/adminAnalyticsService';

interface AdminAnalyticsDashboardProps {
  className?: string;
}

export default function AdminAnalyticsDashboard({ className = '' }: AdminAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'builders' | 'financial'>('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for metrics
  const [quoteVarianceMetrics, setQuoteVarianceMetrics] = useState<QuoteVarianceMetrics[]>([]);
  const [builderMetrics, setBuilderMetrics] = useState<BuilderPerformanceMetrics[]>([]);
  const [platformMetrics, setPlatformMetrics] = useState<PlatformUsageMetrics | null>(null);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [quoteVariance, builderPerf, platformUsage, financial] = await Promise.all([
        adminAnalyticsService.getQuoteVarianceMetrics(dateRange.start, dateRange.end),
        adminAnalyticsService.getBuilderPerformanceMetrics(),
        adminAnalyticsService.getPlatformUsageMetrics(dateRange.start, dateRange.end),
        adminAnalyticsService.getFinancialMetrics(dateRange.start, dateRange.end)
      ]);

      setQuoteVarianceMetrics(quoteVariance);
      setBuilderMetrics(builderPerf);
      setPlatformMetrics(platformUsage);
      setFinancialMetrics(financial);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-red-600">
          <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
          <p>{error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Admin Analytics Dashboard</h2>
        
        {/* Date Range Selector */}
        <div className="mt-4 flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={dateRange.start.toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={dateRange.end.toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'quotes', label: 'Quote Analysis' },
            { key: 'builders', label: 'Builder Performance' },
            { key: 'financial', label: 'Financial Metrics' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && platformMetrics && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Platform Overview</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-600">Total Users</h4>
                <p className="text-2xl font-bold text-blue-900">{platformMetrics.totalUsers.toLocaleString()}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-green-600">Active Users</h4>
                <p className="text-2xl font-bold text-green-900">{platformMetrics.activeUsers.toLocaleString()}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-purple-600">Total Projects</h4>
                <p className="text-2xl font-bold text-purple-900">{platformMetrics.totalProjects.toLocaleString()}</p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-orange-600">Conversion Rate</h4>
                <p className="text-2xl font-bold text-orange-900">{formatPercentage(platformMetrics.conversionRate)}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Projects by Type</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(platformMetrics.projectsByType).map(([type, count]) => (
                  <div key={type} className="text-center">
                    <p className="text-sm text-gray-600">{type}</p>
                    <p className="text-xl font-semibold text-gray-900">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quotes' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Quote Variance Analysis</h3>
            
            {quoteVarianceMetrics.length === 0 ? (
              <p className="text-gray-500">No quote data available for the selected period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AI Estimate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average Quote
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Builder Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quoteVarianceMetrics.map((metric, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {metric.projectType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(metric.aiEstimate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(metric.averageQuote)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          metric.variancePercentage > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatPercentage(metric.variancePercentage)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {metric.builderCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'builders' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Builder Performance</h3>
            
            {builderMetrics.length === 0 ? (
              <p className="text-gray-500">No builder data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Builder
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Win Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Response Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Projects Quoted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Projects Won
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {builderMetrics.map((builder) => (
                      <tr key={builder.builderId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {builder.builderName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPercentage(builder.winRate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {builder.averageRating.toFixed(1)} ({builder.totalRatings} reviews)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {builder.responseTime.toFixed(1)}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {builder.totalProjectsQuoted}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {builder.totalProjectsWon}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'financial' && financialMetrics && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Financial Metrics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-green-600">Total Revenue</h4>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(financialMetrics.totalRevenue)}</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-600">Monthly Recurring Revenue</h4>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(financialMetrics.monthlyRecurringRevenue)}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-purple-600">Subscription Revenue</h4>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(financialMetrics.subscriptionRevenue)}</p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-orange-600">Lead Sales Revenue</h4>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(financialMetrics.leadSalesRevenue)}</p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-red-600">Discount Usage</h4>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(financialMetrics.discountUsage)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}