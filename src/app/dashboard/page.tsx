'use client';

import { ProtectedRoute, usePermissions } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserProfile } from '@/components/profile/UserProfile';
import { InvitationManager } from '@/components/invitations/InvitationManager';
import { Button } from '@/components/ui/Button';

function DashboardContent() {
  const { user, signOut } = useAuth();
  const { isHomeowner, isBuilder, isAdmin } = usePermissions();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.profile.firstName}!
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user?.userType ? user.userType.charAt(0).toUpperCase() + user.userType.slice(1) : 'User'}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Profile */}
            <div>
              <UserProfile />
            </div>

            {/* Role-specific content */}
            <div className="space-y-6">
              {isHomeowner() && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Homeowner Features
                  </h3>
                  <div className="space-y-3">
                    <Button className="w-full">Start New Project</Button>
                    <Button variant="outline" className="w-full">View My Projects</Button>
                    <Button variant="outline" className="w-full">Find Builders</Button>
                  </div>
                </div>
              )}

              {isBuilder() && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Builder Features
                  </h3>
                  <div className="space-y-3">
                    <Button className="w-full">View Available Projects</Button>
                    <Button variant="outline" className="w-full">My Quotes</Button>
                    <Button variant="outline" className="w-full">Analytics Dashboard</Button>
                  </div>
                </div>
              )}

              {isAdmin() && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Admin Features
                  </h3>
                  <div className="space-y-3">
                    <Button className="w-full">Manage Users</Button>
                    <Button variant="outline" className="w-full">Platform Analytics</Button>
                    <Button variant="outline" className="w-full">Builder Vetting</Button>
                  </div>
                </div>
              )}

              {/* Demo Invitation Manager for Homeowners */}
              {isHomeowner() && (
                <InvitationManager
                  projectId="demo-project-123"
                  homeownerId={user?.id || ''}
                  projectType="kitchen_full_refit"
                  homeownerName={`${user?.profile.firstName} ${user?.profile.lastName}`}
                />
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {isHomeowner() ? 'Active Projects' : isBuilder() ? 'Available Leads' : 'Total Users'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {isHomeowner() ? '2' : isBuilder() ? '5' : '1,247'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {isHomeowner() ? 'Total Spent' : isBuilder() ? 'Quotes Submitted' : 'Platform Revenue'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {isHomeowner() ? '£15,420' : isBuilder() ? '12' : '£45,230'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {isHomeowner() ? 'Completed Projects' : isBuilder() ? 'Success Rate' : 'Active Projects'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {isHomeowner() ? '3' : isBuilder() ? '85%' : '89'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}