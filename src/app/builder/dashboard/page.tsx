'use client';

import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { BuilderDashboard } from '@/components/builder/BuilderDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function BuilderDashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredUserType="builder">
      <div className="min-h-screen bg-gray-50">
        {user && <BuilderDashboard builderId={user.id} />}
      </div>
    </ProtectedRoute>
  );
}