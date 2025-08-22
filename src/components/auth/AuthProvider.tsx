'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CognitoAuthService, UserAttributes } from '@/lib/aws/cognito';
import { User, UserType } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  userAttributes: UserAttributes | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: UserType;
    companyName?: string;
    companiesHouseNumber?: string;
    invitationCode?: string;
  }) => Promise<{ success: boolean; error?: string; userId?: string }>;
  confirmSignUp: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userAttributes, setUserAttributes] = useState<UserAttributes | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Convert Cognito attributes to User object
  const convertAttributesToUser = (attributes: UserAttributes, cognitoUser: { userId?: string; username?: string }): User => {
    return {
      id: cognitoUser.userId || cognitoUser.username || '',
      email: attributes.email,
      userType: attributes['custom:userType'] as UserType,
      profile: {
        firstName: attributes.given_name,
        lastName: attributes.family_name,
      },
      createdAt: new Date(), // This would come from DynamoDB in a real implementation
      lastLogin: new Date(),
    };
  };

  // Check if user is already authenticated on app load
  useEffect(() => {
    checkAuthState();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      const currentUserResult = await CognitoAuthService.getCurrentUser();
      
      if (currentUserResult.success && currentUserResult.user) {
        const attributes = await CognitoAuthService.getUserAttributes();
        
        if (attributes) {
          const userData = convertAttributesToUser(attributes, currentUserResult.user);
          setUser(userData);
          setUserAttributes(attributes);
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await CognitoAuthService.signIn({ email, password });
      
      if (result.success && result.isSignedIn) {
        await refreshUser();
        return { success: true };
      }
      
      return { success: false, error: result.error || 'Sign in failed' };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: UserType;
    companyName?: string;
    companiesHouseNumber?: string;
    invitationCode?: string;
  }) => {
    try {
      setIsLoading(true);
      
      // For builders, validate invitation code if provided
      if (params.userType === 'builder' && params.invitationCode) {
        // TODO: Validate invitation code against DynamoDB
        // This will be implemented in the invitation system
      }
      
      const result = await CognitoAuthService.signUp({
        email: params.email,
        password: params.password,
        firstName: params.firstName,
        lastName: params.lastName,
        userType: params.userType,
        companyName: params.companyName,
        companiesHouseNumber: params.companiesHouseNumber,
      });
      
      if (result.success) {
        return { success: true, userId: result.userId };
      }
      
      return { success: false, error: result.error || 'Sign up failed' };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSignUp = async (email: string, code: string) => {
    try {
      setIsLoading(true);
      const result = await CognitoAuthService.confirmSignUp(email, code);
      
      if (result.success) {
        return { success: true };
      }
      
      return { success: false, error: result.error || 'Confirmation failed' };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await CognitoAuthService.signOut();
      setUser(null);
      setUserAttributes(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUserResult = await CognitoAuthService.getCurrentUser();
      
      if (currentUserResult.success && currentUserResult.user) {
        const attributes = await CognitoAuthService.getUserAttributes();
        
        if (attributes) {
          const userData = convertAttributesToUser(attributes, currentUserResult.user);
          setUser(userData);
          setUserAttributes(attributes);
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    userAttributes,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    confirmSignUp,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}