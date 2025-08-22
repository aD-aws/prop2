'use client';

import React, { useState } from 'react';
import AdminAnalyticsDashboard from '@/components/admin/AdminAnalyticsDashboard';
import AdminProjectManagement from '@/components/admin/AdminProjectManagement';
import LeadManagementDashboard from '@/components/admin/LeadManagementDashboard';
import VettingDashboard from '@/components/admin/VettingDashboard';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'projects' | 'leads' | 'vetting'>('analytics');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Platform management and analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'analytics', label: 'Analytics & Metrics', icon: '📊' },
              { key: 'projects', label: 'Project Management', icon: '🏗️' },
              { key: 'leads', label: 'Lead Management', icon: '🎯' },
              { key: 'vetting', label: 'Builder Vetting', icon: '✅' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'analytics' && (
          <AdminAnalyticsDashboard />
        )}

        {activeTab === 'projects' && (
          <AdminProjectManagement />
        )}

        {activeTab === 'leads' && (
          <LeadManagementDashboard />
        )}

        {activeTab === 'vetting' && (
          <VettingDashboard />
        )}
      </div>
    </div>
  );
}