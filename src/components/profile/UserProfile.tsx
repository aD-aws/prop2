'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { CognitoAuthService } from '@/lib/aws/cognito';

export function UserProfile() {
  const { user, userAttributes, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: userAttributes?.given_name || '',
    lastName: userAttributes?.family_name || '',
    companyName: userAttributes?.['custom:companyName'] || '',
    companiesHouseNumber: userAttributes?.['custom:companiesHouseNumber'] || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const updateAttributes: Record<string, string> = {
        given_name: formData.firstName,
        family_name: formData.lastName,
      };

      // Add builder-specific attributes if user is a builder
      if (user?.userType === 'builder') {
        if (formData.companyName) {
          updateAttributes['custom:companyName'] = formData.companyName;
        }
        if (formData.companiesHouseNumber) {
          updateAttributes['custom:companiesHouseNumber'] = formData.companiesHouseNumber;
        }
      }

      const result = await CognitoAuthService.updateUserAttributes(updateAttributes);
      
      if (result.success) {
        setSuccess('Profile updated successfully');
        setIsEditing(false);
        await refreshUser();
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: userAttributes?.given_name || '',
      lastName: userAttributes?.family_name || '',
      companyName: userAttributes?.['custom:companyName'] || '',
      companiesHouseNumber: userAttributes?.['custom:companiesHouseNumber'] || '',
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  if (!user || !userAttributes) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Profile Information
          </h3>
          {!isEditing && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                id="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  !isEditing ? 'bg-gray-50 text-gray-500' : ''
                }`}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                id="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  !isEditing ? 'bg-gray-50 text-gray-500' : ''
                }`}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={userAttributes.email}
                disabled
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email address cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <input
                type="text"
                name="userType"
                id="userType"
                value={user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
                disabled
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
              />
            </div>

            {user.userType === 'builder' && (
              <>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    id="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      !isEditing ? 'bg-gray-50 text-gray-500' : ''
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="companiesHouseNumber" className="block text-sm font-medium text-gray-700">
                    Companies House Number
                  </label>
                  <input
                    type="text"
                    name="companiesHouseNumber"
                    id="companiesHouseNumber"
                    value={formData.companiesHouseNumber}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      !isEditing ? 'bg-gray-50 text-gray-500' : ''
                    }`}
                  />
                </div>
              </>
            )}
          </div>

          {isEditing && (
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isLoading}
              >
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}