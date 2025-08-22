'use client';

import React from 'react';
import { useAuth } from './AuthProvider';
import { UserType } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserType[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/auth/login',
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please sign in to access this page.</p>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.userType)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">
            You don&apos;t have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Required role: {allowedRoles.join(' or ')}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}



// Higher-order component for role-based access control
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: UserType[]
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hook for checking permissions
export function usePermissions() {
  const { user } = useAuth();

  const hasRole = (role: UserType): boolean => {
    return user?.userType === role;
  };

  const hasAnyRole = (roles: UserType[]): boolean => {
    return user ? roles.includes(user.userType) : false;
  };

  const isHomeowner = (): boolean => hasRole('homeowner');
  const isBuilder = (): boolean => hasRole('builder');
  const isAdmin = (): boolean => hasRole('admin');

  return {
    user,
    hasRole,
    hasAnyRole,
    isHomeowner,
    isBuilder,
    isAdmin,
  };
}