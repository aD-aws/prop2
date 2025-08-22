'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import ProfessionalQuoteGenerator from '@/components/builder/ProfessionalQuoteGenerator';
import ProfessionalQuoteDashboard from '@/components/builder/ProfessionalQuoteDashboard';
import { Button } from '@/components/ui/Button';

export default function ProfessionalQuotesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create'>('dashboard');

  if (!user || user.userType !== 'builder') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">This page is only accessible to registered builders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Professional Quote Generation</h1>
              <p className="text-gray-600 mt-1">
                Create professional quotes for your external clients using AI-powered tools
              </p>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Quotes
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Create New Quote
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Quote Dashboard</h2>
                <p className="text-gray-600">Manage and track your professional quotes</p>
              </div>
              <Button onClick={() => setActiveTab('create')}>
                Create New Quote
              </Button>
            </div>
            <ProfessionalQuoteDashboard builderId={user.id} />
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Create Professional Quote</h2>
              <p className="text-gray-600">Generate a detailed quote for your client using AI assistance</p>
            </div>
            <ProfessionalQuoteGenerator 
              builderId={user.id}
              onProjectCreated={() => setActiveTab('dashboard')}
            />
          </div>
        )}
      </div>

      {/* Feature Information */}
      {activeTab === 'dashboard' && (
        <div className="bg-blue-50 border-t border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-blue-600 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-medium text-blue-900">AI-Powered SoW</h3>
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
                <h3 className="font-medium text-blue-900">Professional Presentation</h3>
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
                <h3 className="font-medium text-blue-900">Usage Tracking</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Track quote views and manage your subscription usage efficiently
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}