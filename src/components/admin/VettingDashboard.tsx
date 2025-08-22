'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { VettingRecord, VettingStatus } from '@/lib/types';
import { builderVerificationService } from '@/lib/services/builderVerificationService';

interface VettingDashboardProps {
  adminId: string;
}

export function VettingDashboard({ adminId }: VettingDashboardProps) {
  const [vettingRecords, setVettingRecords] = useState<VettingRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<VettingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDecision, setReviewDecision] = useState<VettingStatus>('pending');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    loadPendingVettingRecords();
  }, []);

  const loadPendingVettingRecords = async () => {
    setIsLoading(true);
    try {
      const records = await builderVerificationService.getPendingVettingRecords();
      setVettingRecords(records);
    } catch (error) {
      console.error('Failed to load vetting records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedRecord || !reviewNotes.trim()) {
      return;
    }

    setIsSubmittingReview(true);
    try {
      await builderVerificationService.performManualReview(
        selectedRecord.builderId,
        adminId,
        reviewDecision,
        reviewNotes
      );
      
      // Refresh the list
      await loadPendingVettingRecords();
      setSelectedRecord(null);
      setReviewNotes('');
      setReviewDecision('pending');
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: VettingStatus) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getVerificationStatus = (record: VettingRecord) => {
    const companiesHouseOk = record.companiesHouseVerification?.verified || false;
    const insuranceOk = builderVerificationService.hasRequiredInsurance(record);
    const referencesOk = builderVerificationService.hasSufficientReferences(record);
    const readyForApproval = builderVerificationService.isReadyForApproval(record);

    return {
      companiesHouseOk,
      insuranceOk,
      referencesOk,
      readyForApproval,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading vetting records...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Builder Vetting Dashboard</h1>
        <p className="text-gray-600 mt-2">Review and approve builder registrations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vetting Records List */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Pending Reviews ({vettingRecords.length})
              </h3>
              
              {vettingRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending reviews</p>
              ) : (
                <div className="space-y-3">
                  {vettingRecords.map((record) => {
                    const status = getVerificationStatus(record);
                    return (
                      <div
                        key={record.builderId}
                        onClick={() => setSelectedRecord(record)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedRecord?.builderId === record.builderId
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-medium text-gray-900">
                            Builder ID: {record.builderId.slice(-8)}
                          </div>
                          {getStatusBadge(record.status)}
                        </div>
                        
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                              status.companiesHouseOk ? 'bg-green-400' : 'bg-red-400'
                            }`} />
                            Companies House
                          </div>
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                              status.insuranceOk ? 'bg-green-400' : 'bg-red-400'
                            }`} />
                            Insurance ({record.insuranceVerification.length} docs)
                          </div>
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                              status.referencesOk ? 'bg-green-400' : 'bg-red-400'
                            }`} />
                            References ({record.referenceVerification.length})
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-400">
                          Submitted: {new Date(record.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Review Panel */}
        <div className="lg:col-span-2">
          {selectedRecord ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Vetting Review - {selectedRecord.builderId.slice(-8)}
                  </h3>
                  {getStatusBadge(selectedRecord.status)}
                </div>

                <div className="space-y-6">
                  {/* Companies House Verification */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${
                        selectedRecord.companiesHouseVerification?.verified ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      Companies House Verification
                    </h4>
                    
                    {selectedRecord.companiesHouseVerification ? (
                      <div className="space-y-2 text-sm">
                        {selectedRecord.companiesHouseVerification.verified ? (
                          <div>
                            <p className="text-green-700 font-medium">✓ Verified</p>
                            {selectedRecord.companiesHouseVerification.data && (
                              <div className="mt-2 bg-gray-50 p-3 rounded">
                                <p><strong>Company:</strong> {selectedRecord.companiesHouseVerification.data.companyName}</p>
                                <p><strong>Number:</strong> {selectedRecord.companiesHouseVerification.data.companyNumber}</p>
                                <p><strong>Status:</strong> {selectedRecord.companiesHouseVerification.data.companyStatus}</p>
                                <p><strong>Type:</strong> {selectedRecord.companiesHouseVerification.data.companyType}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-red-700 font-medium">✗ Verification Failed</p>
                            {selectedRecord.companiesHouseVerification.notes && (
                              <p className="text-red-600 mt-1">{selectedRecord.companiesHouseVerification.notes}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No verification attempted</p>
                    )}
                  </div>

                  {/* Insurance Verification */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${
                        builderVerificationService.hasRequiredInsurance(selectedRecord) ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      Insurance Documentation ({selectedRecord.insuranceVerification.length} documents)
                    </h4>
                    
                    {selectedRecord.insuranceVerification.length > 0 ? (
                      <div className="space-y-3">
                        {selectedRecord.insuranceVerification.map((insurance, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <p><strong>Type:</strong> {insurance.coverageType.replace('_', ' ').toUpperCase()}</p>
                                <p><strong>Provider:</strong> {insurance.provider}</p>
                                <p><strong>Policy:</strong> {insurance.policyNumber}</p>
                                <p><strong>Coverage:</strong> £{insurance.coverageAmount.toLocaleString()}</p>
                                <p><strong>Valid:</strong> {new Date(insurance.validFrom).toLocaleDateString()} - {new Date(insurance.validTo).toLocaleDateString()}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded ${
                                insurance.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {insurance.verified ? 'Verified' : 'Pending'}
                              </span>
                            </div>
                            {insurance.verificationNotes && (
                              <p className="mt-2 text-gray-600">{insurance.verificationNotes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No insurance documents uploaded</p>
                    )}
                  </div>

                  {/* Reference Verification */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${
                        builderVerificationService.hasSufficientReferences(selectedRecord) ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      Reference Verification ({selectedRecord.referenceVerification.length} references)
                    </h4>
                    
                    {selectedRecord.referenceVerification.length > 0 ? (
                      <div className="space-y-3">
                        {selectedRecord.referenceVerification.map((reference, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <p><strong>Reference ID:</strong> {reference.referenceId}</p>
                                <p><strong>Contact Attempted:</strong> {reference.contactAttempted ? 'Yes' : 'No'}</p>
                                <p><strong>Contact Successful:</strong> {reference.contactSuccessful ? 'Yes' : 'No'}</p>
                                {reference.verifiedAt && (
                                  <p><strong>Verified:</strong> {new Date(reference.verifiedAt).toLocaleDateString()}</p>
                                )}
                              </div>
                              <span className={`px-2 py-1 text-xs rounded ${
                                reference.contactSuccessful ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {reference.contactSuccessful ? 'Verified' : 'Pending'}
                              </span>
                            </div>
                            <p className="mt-2 text-gray-600">{reference.verificationNotes}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No references provided</p>
                    )}
                  </div>

                  {/* Manual Review Section */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Manual Review</h4>
                    
                    {selectedRecord.manualReview ? (
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <p><strong>Reviewer:</strong> {selectedRecord.manualReview.reviewerId}</p>
                        <p><strong>Decision:</strong> {selectedRecord.manualReview.decision}</p>
                        <p><strong>Date:</strong> {new Date(selectedRecord.manualReview.reviewedAt).toLocaleDateString()}</p>
                        <p><strong>Notes:</strong> {selectedRecord.manualReview.notes}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Review Decision
                          </label>
                          <select
                            value={reviewDecision}
                            onChange={(e) => setReviewDecision(e.target.value as VettingStatus)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Review Notes *
                          </label>
                          <textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            rows={4}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your review notes and decision rationale..."
                            required
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          <Button
                            onClick={() => setSelectedRecord(null)}
                            className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleReviewSubmit}
                            loading={isSubmittingReview}
                            disabled={!reviewNotes.trim()}
                            className={`${
                              reviewDecision === 'approved'
                                ? 'bg-green-600 hover:bg-green-700'
                                : reviewDecision === 'rejected'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            } text-white`}
                          >
                            Submit Review
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommendation */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">System Recommendation</h4>
                    <p className="text-sm text-blue-800">
                      {builderVerificationService.isReadyForApproval(selectedRecord)
                        ? '✓ All verification checks passed. This builder is recommended for approval.'
                        : '⚠ Some verification checks are incomplete or failed. Manual review required.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Vetting Record</h3>
                  <p className="text-gray-500">Choose a builder from the list to review their vetting information</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}