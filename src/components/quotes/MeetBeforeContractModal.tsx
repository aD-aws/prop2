'use client';

import React, { useState } from 'react';
import { Quote } from '@/lib/types';

interface MeetBeforeContractModalProps {
  quote: Quote;
  onConfirm: (selectionReason?: string) => void;
  onCancel: () => void;
}

export const MeetBeforeContractModal: React.FC<MeetBeforeContractModalProps> = ({
  quote,
  onConfirm,
  onCancel
}) => {
  const [selectionReason, setSelectionReason] = useState('');
  const [acknowledgedMeeting, setAcknowledgedMeeting] = useState(false);
  const [acknowledgedVerification, setAcknowledgedVerification] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const canProceed = acknowledgedMeeting && acknowledgedVerification;

  const handleConfirm = () => {
    if (canProceed) {
      onConfirm(selectionReason.trim() || undefined);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Select Builder - Meet Before Contract
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Selected Quote Summary */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">Selected Quote Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Builder</p>
                <p className="text-sm text-blue-900">Builder #{quote.builderId.slice(-6)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total Price</p>
                <p className="text-sm font-semibold text-blue-900">{formatCurrency(quote.pricing.totalAmount)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Timeline</p>
                <p className="text-sm text-blue-900">{quote.timeline} working days</p>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Completion Date</p>
                <p className="text-sm text-blue-900">{formatDate(quote.projectedCompletionDate)}</p>
              </div>
            </div>
          </div>

          {/* Meet Before Contract Information */}
          <div className="mt-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    Important: Meet Before Contract
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>We strongly recommend meeting your selected builder in person before signing any contract. This meeting should include:</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Meeting Checklist</h4>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <p className="text-sm text-gray-700">
                      <strong>Property Visit:</strong> Have the builder visit your property to confirm the scope and identify any potential issues
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <p className="text-sm text-gray-700">
                      <strong>Credential Verification:</strong> Ask to see original insurance certificates, qualifications, and identification
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <p className="text-sm text-gray-700">
                      <strong>Reference Check:</strong> Contact previous customers or visit completed projects if possible
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <p className="text-sm text-gray-700">
                      <strong>Detailed Discussion:</strong> Review the scope, timeline, materials, and any concerns in detail
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <p className="text-sm text-gray-700">
                      <strong>Trust Assessment:</strong> Evaluate their professionalism, communication, and whether you feel comfortable working with them
                    </p>
                  </div>
                </div>
              </div>

              {/* Red Flags Warning */}
              {quote.aiAnalysis?.redFlags && quote.aiAnalysis.redFlags.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-900 mb-2">
                    ⚠️ Address These Red Flags During Your Meeting
                  </h4>
                  <div className="space-y-2">
                    {quote.aiAnalysis.redFlags.slice(0, 3).map((flag, index) => (
                      <div key={index} className="text-sm text-red-800">
                        <strong>{flag.type.charAt(0).toUpperCase() + flag.type.slice(1)}:</strong> {flag.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selection Reason */}
          <div className="mt-6">
            <label htmlFor="selectionReason" className="block text-sm font-medium text-gray-700 mb-2">
              Why did you choose this builder? (Optional)
            </label>
            <textarea
              id="selectionReason"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Best value for money, fastest timeline, excellent references, etc."
              value={selectionReason}
              onChange={(e) => setSelectionReason(e.target.value)}
            />
          </div>

          {/* Acknowledgments */}
          <div className="mt-6 space-y-3">
            <div className="flex items-start space-x-3">
              <input
                id="acknowledgeMeeting"
                type="checkbox"
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={acknowledgedMeeting}
                onChange={(e) => setAcknowledgedMeeting(e.target.checked)}
              />
              <label htmlFor="acknowledgeMeeting" className="text-sm text-gray-700">
                I understand that I should meet this builder in person at my property before signing any contract, and I will verify their credentials during this meeting.
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <input
                id="acknowledgeVerification"
                type="checkbox"
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={acknowledgedVerification}
                onChange={(e) => setAcknowledgedVerification(e.target.checked)}
              />
              <label htmlFor="acknowledgeVerification" className="text-sm text-gray-700">
                I will verify the builder's insurance certificates, qualifications, and references before proceeding with any contract.
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canProceed}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                canProceed
                  ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Select Builder & Schedule Meeting
            </button>
          </div>

          {!canProceed && (
            <p className="mt-2 text-xs text-gray-500 text-right">
              Please acknowledge both statements above to proceed
            </p>
          )}
        </div>
      </div>
    </div>
  );
};