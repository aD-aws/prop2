// AWS Cognito authentication service

import { Amplify } from 'aws-amplify';
import { 
  signUp, 
  signIn, 
  signOut, 
  getCurrentUser, 
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  updateUserAttributes,
  fetchUserAttributes
} from 'aws-amplify/auth';
import { awsConfig } from '../config/aws';
import type { UserType } from '../types';

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: awsConfig.cognito.userPoolId,
      userPoolClientId: awsConfig.cognito.userPoolClientId,
      identityPoolId: awsConfig.cognito.identityPoolId,
    }
  }
});

export interface SignUpParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  companyName?: string;
  companiesHouseNumber?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface UserAttributes {
  email: string;
  given_name: string;
  family_name: string;
  'custom:userType': UserType;
  'custom:companyName'?: string;
  'custom:companiesHouseNumber'?: string;
}

export class CognitoAuthService {
  
  /**
   * Sign up a new user
   */
  static async signUp(params: SignUpParams) {
    try {
      const { email, password, firstName, lastName, userType, companyName, companiesHouseNumber } = params;
      
      const userAttributes: Record<string, string> = {
        email,
        given_name: firstName,
        family_name: lastName,
        'custom:userType': userType,
      };
      
      if (companyName) {
        userAttributes['custom:companyName'] = companyName;
      }
      
      if (companiesHouseNumber) {
        userAttributes['custom:companiesHouseNumber'] = companiesHouseNumber;
      }
      
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes,
        },
      });
      
      return {
        success: true,
        userId: result.userId,
        nextStep: result.nextStep,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed',
      };
    }
  }
  
  /**
   * Confirm sign up with verification code
   */
  static async confirmSignUp(email: string, confirmationCode: string) {
    try {
      await confirmSignUp({
        username: email,
        confirmationCode,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Confirm sign up error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Confirmation failed',
      };
    }
  }
  
  /**
   * Resend confirmation code
   */
  static async resendConfirmationCode(email: string) {
    try {
      await resendSignUpCode({
        username: email,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Resend confirmation code error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Resend failed',
      };
    }
  }
  
  /**
   * Sign in user
   */
  static async signIn(params: SignInParams) {
    try {
      const { email, password } = params;
      
      const result = await signIn({
        username: email,
        password,
      });
      
      return {
        success: true,
        isSignedIn: result.isSignedIn,
        nextStep: result.nextStep,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      };
    }
  }
  
  /**
   * Sign out user
   */
  static async signOut() {
    try {
      await signOut();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      };
    }
  }
  
  /**
   * Get current authenticated user
   */
  static async getCurrentUser() {
    try {
      const user = await getCurrentUser();
      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current user',
      };
    }
  }
  
  /**
   * Get user attributes
   */
  static async getUserAttributes(): Promise<UserAttributes | null> {
    try {
      const attributes = await fetchUserAttributes();
      return attributes as unknown as UserAttributes;
    } catch (error) {
      console.error('Get user attributes error:', error);
      return null;
    }
  }
  
  /**
   * Update user attributes
   */
  static async updateUserAttributes(attributes: Partial<UserAttributes>) {
    try {
      await updateUserAttributes({
        userAttributes: attributes,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Update user attributes error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
      };
    }
  }
  
  /**
   * Reset password
   */
  static async resetPassword(email: string) {
    try {
      const result = await resetPassword({
        username: email,
      });
      
      return {
        success: true,
        nextStep: result.nextStep,
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reset password failed',
      };
    }
  }
  
  /**
   * Confirm reset password
   */
  static async confirmResetPassword(email: string, confirmationCode: string, newPassword: string) {
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode,
        newPassword,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Confirm reset password error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset confirmation failed',
      };
    }
  }
}