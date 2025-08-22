'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { BuilderDashboardData, BuilderAnalytics } from '@/lib/services/builderDashboardService';
import { Project, Quote, ProjectStatus } from '@/lib/types';
import Link from 'next/link';
import ProfessionalQuoteGenerator from './ProfessionalQuoteGenerator';
import ProfessionalQuoteDashboard from './ProfessionalQuoteDashboard';

interface BuilderDashboardProps {
  builderId: string;
}

export function BuilderDashboard({ builderId }: BuilderDashboardProps) {
  const [dashboardData, setDashboardData] = useState<BuilderDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'quotes' | 'analytics' | 'professional-quotes'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, [builderId]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call the dashboard service
      // For now, we'll simulate the data
      const mockData: BuilderDashboardData = {
        builder: {
          firstName: 'John',
          lastName: 'Smith',
          companyName: 'Smith Construction Ltd',
          companiesHouseNumber: '12345678',
          insuranceDocuments: [],
          vettingStatus: 'approved',
          specializations: ['kitchen_full_refit', 'bathroom_full_refit'],
          serviceAreas: ['SW1', 'W1', 'NW1'],
          rating: 4.8,
          completedProjects: 45,
        },
        projectsInvitedTo: [],
        projectsQuotedFor: [],
        projectsWon: [],
        projectsCompleted: [],
        quotes: [],
        analytics: {
          totalProjectsInvited: 23,
          totalQuotesSubmitted: 18,
          totalProjectsWon: 12,
          totalProjectsCompleted: 10,
          winRate: 66.7,
          averageQuoteValue: 15750,
          totalRevenue: 189000,
          currentMonthInvitations: 5,
          currentMonthQuotes: 4,
          currentMonthWins: 2,
          topProjectTypes: [
            { projectType: 'Kitchen Renovation', count: 8, winRate: 75 },
            { projectType: 'Bathroom Renovation', count: 6, winRate: 60 },
            { projectType: 'Extension', count: 4, winRate: 50 },
          ],
          recentActivity: [
            {
              type: 'quote_submitted',
              projectId: 'proj_123',
              date: new Date('2024-01-15'),
              description: 'Submitted quote for £18,500',
            },
            {
              type: 'project_won',
              projectId: 'proj_122',
              date: new Date('2024-01-12'),
              description: 'Won kitchen renovation project',
            },
          ],
        },
      };
      setDashboardData(mockData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const colors = {
      initial: 'bg-gray-100 text-gray-800',
      property_assessment: 'bg-blue-100 text-blue-800',
      ai_planning: 'bg-purple-100 text-purple-800',
      sow_generation: 'bg-yellow-100 text-yellow-800',
      builder_invitation: 'bg-orange-100 text-orange-800',
      quote_collection: 'bg-indigo-100 text-indigo-800',
      builder_selection: 'bg-pink-100 text-pink-800',
      contract_generation: 'bg-green-100 text-green-800',
      project_execution: 'bg-blue-100 text-blue-800',
      completion: 'bg-green-100 text-green-800',
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load dashboard data</div>
      </div>
    );
  }

  const { builder, analytics } = dashboardData;

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Projects Invited</dt>
                <dd className="text-lg font-medium text-gray-900">{analytics.totalProjectsInvited}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Win Rate</dt>
                <dd className="text-lg font-medium text-gray-900">{analytics.winRate.toFixed(1)}%</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Avg Quote Value</dt>
                <dd className="text-lg font-medium text-gray-900">{formatCurrency(analytics.averageQuoteValue)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                <dd className="text-lg font-medium text-gray-900">{formatCurrency(analytics.totalRevenue)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {analytics.recentActivity.map((activity, index) => (
                <li key={index}>
                  <div className="relative pb-8">
                    {index !== analytics.recentActivity.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          activity.type === 'invitation' ? 'bg-blue-500' :
                          activity.type === 'quote_submitted' ? 'bg-yellow-500' :
                          activity.type === 'project_won' ? 'bg-green-500' :
                          'bg-purple-500'
                        }`}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">{activity.description}</p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {formatDate(activity.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">My Projects</h3>
        
        {/* Project Status Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'invited', label: 'Invited', count: dashboardData.projectsInvitedTo.length },
              { key: 'quoted', label: 'Quoted', count: dashboardData.projectsQuotedFor.length },
              { key: 'won', label: 'Won', count: dashboardData.projectsWon.length },
              { key: 'completed', label: 'Completed', count: dashboardData.projectsCompleted.length },
            ].map((tab) => (
              <button
                key={tab.key}
                className="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          {/* Placeholder for when there are no projects */}
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              You'll see projects here once homeowners invite you to quote.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuotes = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">My Quotes</h3>
        
        <div className="space-y-4">
          {/* Placeholder for when there are no quotes */}
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No quotes submitted</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your submitted quotes will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfessionalQuotes = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Professional Quote Generation</h3>
            <p className="text-gray-600">Create professional quotes for your external clients using AI-powered tools</p>
          </div>
          <Link href="/builder/professional-quotes">
            <Button>
              Create New Quote
            </Button>
          </Link>
        </div>
        
        <ProfessionalQuoteDashboard builderId={builderId} />
      </div>
      
      {/* Feature Benefits */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-medium text-blue-900 mb-3">Professional Quote Generation Benefits</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-blue-600 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h5 className="font-medium text-blue-900">AI-Powered SoW</h5>
            <p className="text-sm text-blue-700 mt-1">
              Generate detailed scopes of work with AI assistance and timeline optimization
            </p>
          </div>
          <div className="text-center">
            <div className="text-blue-600 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4z" clipRule="evenodd" />
              </svg>
            </div>
            <h5 className="font-medium text-blue-900">Professional Presentation</h5>
            <p className="text-sm text-blue-700 mt-1">
              Send beautifully formatted quotes that clients can view without registration
            </p>
          </div>
          <div className="text-center">
            <div className="text-blue-600 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h5 className="font-medium text-blue-900">Usage Tracking</h5>
            <p className="text-sm text-blue-700 mt-1">
              Track quote views and manage your subscription usage efficiently
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Advanced Analytics Promotion */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Advanced Analytics & AI Insights</h3>
            <p className="text-blue-100 mb-4">
              Get detailed win analysis, geographic performance, competitive advantages, and AI-driven recommendations to grow your business.
            </p>
            <ul className="text-sm text-blue-100 space-y-1">
              <li>• Project win analysis by category and geography</li>
              <li>• AI-driven insights for competitive advantages</li>
              <li>• Success pattern analysis and recommendations</li>
              <li>• Market opportunity identification</li>
            </ul>
          </div>
          <div className="flex flex-col space-y-3">
            <Link href="/builder/analytics">
              <Button className="bg-white text-blue-600 hover:bg-gray-100 font-medium">
                View Advanced Analytics
              </Button>
            </Link>
            <Link href="/builder/subscription">
              <Button className="bg-blue-700 text-white hover:bg-blue-800 text-sm">
                Upgrade Subscription
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Top Project Types */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Top Project Types</h3>
          <div className="space-y-4">
            {analytics.topProjectTypes.map((projectType, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{projectType.projectType}</p>
                    <p className="text-sm text-gray-500">{projectType.count} projects</p>
                  </div>
                  <div className="mt-1 flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${projectType.winRate}%` }}
                      />
                    </div>
                    <span className="ml-2 text-sm text-gray-500">{projectType.winRate.toFixed(0)}% win rate</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Performance */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">This Month</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.currentMonthInvitations}</div>
              <div className="text-sm text-gray-500">New Invitations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{analytics.currentMonthQuotes}</div>
              <div className="text-sm text-gray-500">Quotes Submitted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.currentMonthWins}</div>
              <div className="text-sm text-gray-500">Projects Won</div>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Analytics Preview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Performance Overview</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Basic Analytics</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-gray-900">{analytics.winRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-500">Overall Win Rate</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{analytics.totalProjectsCompleted}</div>
              <div className="text-sm text-gray-500">Completed Projects</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(analytics.averageQuoteValue)}</div>
              <div className="text-sm text-gray-500">Avg Quote Value</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</div>
              <div className="text-sm text-gray-500">Total Revenue</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Upgrade to Premium</strong> to unlock detailed geographic analysis, AI insights, competitive advantages, and personalized recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Builder Dashboard</h1>
            <p className="text-gray-600">Welcome back, {builder.firstName}!</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Rating</div>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-900">{builder.rating}</span>
                <div className="ml-1 flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(builder.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              Update Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'projects', label: 'Projects' },
            { key: 'quotes', label: 'Quotes' },
            { key: 'professional-quotes', label: 'Professional Quotes' },
            { key: 'analytics', label: 'Analytics' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
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
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'projects' && renderProjects()}
      {activeTab === 'quotes' && renderQuotes()}
      {activeTab === 'professional-quotes' && renderProfessionalQuotes()}
      {activeTab === 'analytics' && renderAnalytics()}
    </div>
  );
}