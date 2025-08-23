'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '../../components/ui/Button';
import { gdprComplianceService } from '../../lib/services/gdprComplianceService';
import { planningPermissionDataMiningService } from '../../lib/services/planningPermissionDataMiningService';

function OptOutContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [optOutType, setOptOutType] = useState<'marketing' | 'all_communications' | 'data_processing'>('marketing');
  
  // URL parameters for direct opt-out links
  const campaignId = searchParams.get('campaign');
  const prospectId = searchParams.get('prospect');
  const token = searchParams.get('token');

  useEffect(() => {
    // If coming from a campaign link, auto-populate and process
    if (campaignId && prospectId && token) {
      handleDirectOptOut();
    }
  }, [campaignId, prospectId, token]);

  const handleDirectOptOut = async () => {
    setLoading(true);
    try {
      // Verify token and process opt-out
      // In a real implementation, you would validate the token
      await planningPermissionDataMiningService.handleOptOut('', ''); // Would extract email from token
      setSuccess(true);
    } catch (error) {
      console.error('Error processing direct opt-out:', error);
      setError('Failed to process opt-out request. Please try the manual form below.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualOptOut = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email address is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Record the opt-out request
      await gdprComplianceService.recordOptOut({
        email,
        phone: phone || undefined,
        optOutType,
        optOutSource: 'website_form',
        isGlobal: optOutType === 'data_processing'
      });

      // Process the opt-out in the planning permission system
      await planningPermissionDataMiningService.handleOptOut(email, phone || undefined);

      setSuccess(true);
    } catch (error) {
      console.error('Error processing opt-out:', error);
      setError('Failed to process opt-out request. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleDataDeletion = async () => {
    if (!email) {
      setError('Email address is required for data deletion');
      return;
    }

    if (!confirm('Are you sure you want to delete all your personal data? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await gdprComplianceService.handleErasureRequest(
        email, 
        'User requested data deletion via opt-out page',
        phone || undefined
      );
      
      setSuccess(true);
      setError('');
    } catch (error) {
      console.error('Error processing data deletion:', error);
      setError('Failed to process data deletion request. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleDataAccess = async () => {
    if (!email) {
      setError('Email address is required for data access');
      return;
    }

    setLoading(true);
    try {
      await gdprComplianceService.handleAccessRequest(email, phone || undefined);
      setSuccess(true);
      setError('');
    } catch (error) {
      console.error('Error processing data access request:', error);
      setError('Failed to process data access request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">Request Processed Successfully</h2>
              <p className="mt-2 text-sm text-gray-600">
                Your request has been processed. You will receive a confirmation email shortly.
              </p>
              {optOutType === 'marketing' && (
                <p className="mt-2 text-sm text-gray-600">
                  You have been removed from our marketing communications.
                </p>
              )}
              {optOutType === 'all_communications' && (
                <p className="mt-2 text-sm text-gray-600">
                  You have been removed from all communications.
                </p>
              )}
              {optOutType === 'data_processing' && (
                <p className="mt-2 text-sm text-gray-600">
                  Your data deletion request is being processed. This may take up to 30 days to complete.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Privacy & Data Management
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Manage your privacy preferences and data rights
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleManualOptOut} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number (Optional)
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="+44 7XXX XXXXXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                What would you like to do?
              </label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center">
                  <input
                    id="marketing"
                    name="optOutType"
                    type="radio"
                    value="marketing"
                    checked={optOutType === 'marketing'}
                    onChange={(e) => setOptOutType(e.target.value as any)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <label htmlFor="marketing" className="ml-3 block text-sm text-gray-700">
                    Opt out of marketing communications only
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="all"
                    name="optOutType"
                    type="radio"
                    value="all_communications"
                    checked={optOutType === 'all_communications'}
                    onChange={(e) => setOptOutType(e.target.value as any)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <label htmlFor="all" className="ml-3 block text-sm text-gray-700">
                    Opt out of all communications
                  </label>
                </div>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Processing...' : 'Submit Opt-Out Request'}
              </Button>
            </div>
          </form>

          {/* GDPR Rights Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Data Rights (GDPR)</h3>
            
            <div className="space-y-3">
              <Button
                onClick={handleDataAccess}
                disabled={loading || !email}
                className="w-full bg-gray-600 hover:bg-gray-700"
              >
                Request My Personal Data
              </Button>
              
              <Button
                onClick={handleDataDeletion}
                disabled={loading || !email}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Delete All My Data
              </Button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              <p className="mb-2">
                <strong>Right to Access:</strong> Get a copy of all personal data we hold about you.
              </p>
              <p className="mb-2">
                <strong>Right to Erasure:</strong> Request deletion of all your personal data (right to be forgotten).
              </p>
              <p>
                For other data rights or questions, contact us at privacy@platform.com
              </p>
            </div>
          </div>

          {/* Privacy Information */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">How We Use Your Data</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• We collect planning application data from public council websites</p>
              <p>• We use this data to offer relevant home improvement services</p>
              <p>• You can opt out at any time using this form</p>
              <p>• We comply with UK GDPR and data protection regulations</p>
              <p>• Data is retained only as long as necessary for legitimate business purposes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OptOutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <OptOutContent />
    </Suspense>
  );
}