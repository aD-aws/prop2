'use client';

import React from 'react';
import { useAuth } from '../../../components/auth/AuthProvider';
import BuilderAnalyticsDashboard from '../../../components/builder/BuilderAnalyticsDashboard';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';

export default function BuilderAnalyticsPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredRole="builder">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {user && (
            <BuilderAnalyticsDashboard builderId={user.id} />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}