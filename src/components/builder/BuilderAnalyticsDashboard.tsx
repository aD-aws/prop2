'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { builderAnalyticsService, BuilderAnalyticsDashboard, AIInsights } from '../../lib/services/builderAnalyticsService';

interface Props {
  builderId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function BuilderAnalyticsDashboard({ builderId }: Props) {
  const [analytics, setAnalytics] = useState<BuilderAnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'geographic' | 'categories' | 'insights'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, [builderId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await builderAnalyticsService.getBuilderAnalytics(builderId);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Analytics Access Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            {error.includes('subscription') && (
              <div className="mt-3">
                <button
                  onClick={() => window.location.href = '/builder/subscription'}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
                >
                  Upgrade Subscription
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
            <p className="text-gray-600">
              Subscription Status: 
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                analytics.subscriptionStatus === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {analytics.subscriptionStatus}
              </span>
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {new Date(analytics.lastUpdated).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'geographic', name: 'Geographic Analysis' },
              { id: 'categories', name: 'Project Categories' },
              { id: 'insights', name: 'AI Insights' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab analytics={analytics} />}
          {activeTab === 'geographic' && <GeographicTab analytics={analytics} />}
          {activeTab === 'categories' && <CategoriesTab analytics={analytics} />}
          {activeTab === 'insights' && <InsightsTab insights={analytics.aiInsights} />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ analytics }: { analytics: BuilderAnalyticsDashboard }) {
  const { aiInsights } = analytics;
  
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {(aiInsights.overallPerformance.totalWinRate * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-blue-800">Win Rate</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            £{aiInsights.overallPerformance.averageProjectValue.toLocaleString()}
          </div>
          <div className="text-sm text-green-800">Avg Project Value</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            £{aiInsights.overallPerformance.totalRevenue.toLocaleString()}
          </div>
          <div className="text-sm text-purple-800">Total Revenue</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {aiInsights.overallPerformance.strongestCategories.length}
          </div>
          <div className="text-sm text-orange-800">Strong Categories</div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Performance by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.categoryAnalytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Win Rate']} />
              <Bar dataKey="winRate" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Geographic Performance */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Revenue by Area</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.geographicAnalytics.slice(0, 5)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ postcode, percent }) => `${postcode} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="totalRevenue"
              >
                {analytics.geographicAnalytics.slice(0, 5).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`£${value.toLocaleString()}`, 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strongest Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Strongest Categories</h3>
          <div className="space-y-2">
            {aiInsights.overallPerformance.strongestCategories.map((category, index) => (
              <div key={category} className="flex items-center justify-between p-2 bg-white rounded">
                <span className="font-medium">#{index + 1} {category}</span>
                <span className="text-sm text-gray-600">
                  {analytics.categoryAnalytics.find(c => c.category === category)?.wonProjects || 0} wins
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Strongest Areas</h3>
          <div className="space-y-2">
            {aiInsights.overallPerformance.strongestAreas.map((area, index) => (
              <div key={area} className="flex items-center justify-between p-2 bg-white rounded">
                <span className="font-medium">#{index + 1} {area}</span>
                <span className="text-sm text-gray-600">
                  {analytics.geographicAnalytics.find(g => g.postcode === area)?.wonProjects || 0} wins
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GeographicTab({ analytics }: { analytics: BuilderAnalyticsDashboard }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Geographic Performance Analysis</h3>
      
      {/* Geographic Performance Chart */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium mb-4">Win Rate by Area</h4>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={analytics.geographicAnalytics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="postcode" />
            <YAxis />
            <Tooltip 
              formatter={(value: any, name: string) => [
                name === 'winRate' ? `${(value * 100).toFixed(1)}%` : `£${value.toLocaleString()}`,
                name === 'winRate' ? 'Win Rate' : 'Avg Project Value'
              ]}
            />
            <Legend />
            <Bar dataKey="winRate" fill="#8884d8" name="Win Rate" />
            <Bar dataKey="averageProjectValue" fill="#82ca9d" name="Avg Project Value" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Geographic Details Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Area
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Projects Won
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Win Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Advantages
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {analytics.geographicAnalytics.map((area) => (
              <tr key={area.postcode}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{area.postcode}</div>
                    <div className="text-sm text-gray-500">{area.area}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {area.wonProjects} / {area.totalProjects}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    area.winRate > 0.4 ? 'bg-green-100 text-green-800' :
                    area.winRate > 0.25 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {(area.winRate * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  £{area.averageProjectValue.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  £{area.totalRevenue.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {area.competitiveAdvantage.map((advantage) => (
                      <span
                        key={advantage}
                        className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                      >
                        {advantage}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoriesTab({ analytics }: { analytics: BuilderAnalyticsDashboard }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Project Category Analysis</h3>
      
      {/* Category Performance Chart */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium mb-4">Performance by Category</h4>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={analytics.categoryAnalytics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip 
              formatter={(value: any, name: string) => [
                name === 'winRate' ? `${(value * 100).toFixed(1)}%` : 
                name === 'averageRating' ? value.toFixed(1) :
                `£${value.toLocaleString()}`,
                name === 'winRate' ? 'Win Rate' : 
                name === 'averageRating' ? 'Avg Rating' :
                'Total Revenue'
              ]}
            />
            <Legend />
            <Area type="monotone" dataKey="totalRevenue" stackId="1" stroke="#8884d8" fill="#8884d8" />
            <Line type="monotone" dataKey="winRate" stroke="#ff7300" />
            <Line type="monotone" dataKey="averageRating" stroke="#00ff00" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {analytics.categoryAnalytics.map((category) => (
          <div key={category.category} className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">{category.category}</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Win Rate:</span>
                <span className={`text-sm font-medium ${
                  category.winRate > 0.4 ? 'text-green-600' :
                  category.winRate > 0.25 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {(category.winRate * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Projects Won:</span>
                <span className="text-sm font-medium">{category.wonProjects}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Value:</span>
                <span className="text-sm font-medium">£{category.averageProjectValue.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Revenue:</span>
                <span className="text-sm font-medium">£{category.totalRevenue.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Response:</span>
                <span className="text-sm font-medium">{category.averageResponseTime.toFixed(1)}h</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Rating:</span>
                <span className="text-sm font-medium">{category.averageRating.toFixed(1)}/5</span>
              </div>
            </div>

            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Project Types:</h5>
              <div className="flex flex-wrap gap-1">
                {category.projectTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Competitive Factors:</h5>
              <div className="flex flex-wrap gap-1">
                {category.competitiveFactors.map((factor) => (
                  <span
                    key={factor}
                    className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsTab({ insights }: { insights: AIInsights }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">AI-Driven Insights & Recommendations</h3>
      
      {/* Competitive Advantages */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Competitive Advantages</h4>
        <div className="space-y-4">
          {insights.competitiveAdvantages.map((advantage, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900">{advantage.factor}</h5>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  advantage.impact === 'high' ? 'bg-red-100 text-red-800' :
                  advantage.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {advantage.impact} impact
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{advantage.description}</p>
              <p className="text-sm text-blue-600 font-medium">{advantage.recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Success Patterns */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Success Patterns</h4>
        <div className="space-y-4">
          {insights.successPatterns.map((pattern, index) => (
            <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-green-900">{pattern.pattern}</h5>
                <span className="text-sm text-green-600">
                  {(pattern.frequency * 100).toFixed(0)}% frequency
                </span>
              </div>
              <p className="text-sm text-green-700 mb-2">{pattern.impact}</p>
              <p className="text-sm text-green-800 font-medium">{pattern.actionable}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Recommendations</h4>
        <div className="space-y-4">
          {insights.recommendations.map((rec, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority} priority
                  </span>
                  <span className="text-sm text-gray-600">{rec.category}</span>
                </div>
              </div>
              <h5 className="font-medium text-gray-900 mb-2">{rec.action}</h5>
              <p className="text-sm text-gray-600">{rec.expectedImpact}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Market Opportunities */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Market Opportunities</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.marketOpportunities.map((opportunity, index) => (
            <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h5 className="font-medium text-purple-900 mb-2">
                {opportunity.area} - {opportunity.projectType}
              </h5>
              <p className="text-sm text-purple-700 mb-2">{opportunity.opportunity}</p>
              <p className="text-sm text-purple-800 font-medium">
                Potential Value: £{opportunity.potentialValue.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}