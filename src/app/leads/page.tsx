'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import BuilderLeadDashboard from '@/components/builder/BuilderLeadDashboard';
import LeadManagement from '@/components/homeowner/LeadManagement';
import LeadManagementDashboard from '@/components/admin/LeadManagementDashboard';

export default function LeadsPage() {
  const { user, isLoading } = useAuth();
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Get user type from user profile
      const type = user.userType || 'homeowner';
      setUserType(type);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please log in to access the leads management system.</p>
          <a
            href="/auth/login"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Log In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {userType === 'builder' && 'Builder Lead Dashboard'}
            {userType === 'homeowner' && 'Lead Management'}
            {userType === 'admin' && 'Admin Lead Management'}
          </h1>
          <p className="mt-2 text-gray-600">
            {userType === 'builder' && 'View available leads and manage your current offers'}
            {userType === 'homeowner' && 'Create and manage leads to find qualified builders'}
            {userType === 'admin' && 'Monitor and manage the lead distribution system'}
          </p>
        </div>

        {/* Content based on user type */}
        {userType === 'builder' && (
          <BuilderLeadDashboard builderId={user.id} />
        )}

        {userType === 'homeowner' && (
          <LeadManagement homeownerId={user.id} />
        )}

        {userType === 'admin' && (
          <LeadManagementDashboard />
        )}

        {!userType && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">User Type Not Set</h3>
            <p className="text-gray-500">
              Please complete your profile setup to access the leads management system.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}