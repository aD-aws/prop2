'use client';

import React, { useState } from 'react';
import { TermsAndConditions, TermsAmendment } from '@/lib/services/termsConditionsService';

interface TermsComparisonViewProps {
  standardTerms: TermsAndConditions;
  proposedAmendments: TermsAmendment[];
  finalTerms?: TermsAndConditions;
  onReviewAmendment?: (amendmentId: string, status: 'accepted' | 'rejected') => void;
  userType: 'homeowner' | 'builder' | 'admin';
  readOnly?: boolean;
}

export const TermsComparisonView: React.FC<TermsComparisonViewProps> = ({
  standardTerms,
  proposedAmendments,
  finalTerms,
  onReviewAmendment,
  userType,
  readOnly = false
}) => {
  const [selectedView, setSelectedView] = useState<'comparison' | 'final'>('comparison');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getSectionAmendments = (sectionId: string) => {
    return proposedAmendments.filter(a => a.sectionId === sectionId);
  };

  const getAmendmentStatusColor = (status: string) => {
    switch (status) {
      case 'proposed': return 'border-yellow-300 bg-yellow-50';
      case 'accepted': return 'border-green-300 bg-green-50';
      case 'rejected': return 'border-red-300 bg-red-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const pendingAmendments = proposedAmendments.filter(a => a.status === 'proposed');
  const canReviewAmendments = userType === 'homeowner' && !readOnly && pendingAmendments.length > 0;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms and Conditions Review</h1>
        
        {/* View Toggle */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setSelectedView('comparison')}
            className={`px-4 py-2 rounded-md font-medium ${
              selectedView === 'comparison'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Compare Amendments ({proposedAmendments.length})
          </button>
          {finalTerms && (
            <button
              onClick={() => setSelectedView('final')}
              className={`px-4 py-2 rounded-md font-medium ${
                selectedView === 'final'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Final Terms
            </button>
          )}
        </div>

        {/* Amendment Summary */}
        {proposedAmendments.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Amendment Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {proposedAmendments.filter(a => a.status === 'proposed').length}
                </div>
                <div className="text-gray-600">Pending Review</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {proposedAmendments.filter(a => a.status === 'accepted').length}
                </div>
                <div className="text-gray-600">Accepted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {proposedAmendments.filter(a => a.status === 'rejected').length}
                </div>
                <div className="text-gray-600">Rejected</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedView === 'comparison' && (
        <div className="space-y-6">
          {standardTerms.sections.map((section) => {
            const sectionAmendments = getSectionAmendments(section.id);
            const isExpanded = expandedSections.has(section.id);
            const hasAmendments = sectionAmendments.length > 0;

            return (
              <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${hasAmendments ? 'bg-yellow-50' : 'bg-white'}`}
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                      {hasAmendments && (
                        <span className="px-2 py-1 text-xs font-medium text-yellow-600 bg-yellow-100 rounded">
                          {sectionAmendments.length} Amendment{sectionAmendments.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <svg 
                      className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
                      {/* Original Content */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Original Terms</h4>
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          <div className="whitespace-pre-wrap text-gray-700 text-sm">
                            {section.content}
                          </div>
                        </div>
                      </div>

                      {/* Amendments */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Proposed Amendments ({sectionAmendments.length})
                        </h4>
                        {sectionAmendments.length > 0 ? (
                          <div className="space-y-3">
                            {sectionAmendments.map((amendment) => (
                              <div key={amendment.id} className={`p-4 rounded-lg border ${getAmendmentStatusColor(amendment.status)}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`px-2 py-1 text-xs font-medium rounded capitalize ${
                                    amendment.status === 'proposed' ? 'bg-yellow-200 text-yellow-800' :
                                    amendment.status === 'accepted' ? 'bg-green-200 text-green-800' :
                                    'bg-red-200 text-red-800'
                                  }`}>
                                    {amendment.status}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(amendment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                
                                <div className="text-sm mb-2">
                                  <strong>Reason:</strong> {amendment.reason}
                                </div>
                                
                                <div className="text-sm mb-3">
                                  <strong>Proposed Content:</strong>
                                  <div className="mt-1 p-2 bg-white rounded border whitespace-pre-wrap text-xs">
                                    {amendment.proposedContent}
                                  </div>
                                </div>

                                {/* Review Actions */}
                                {canReviewAmendments && amendment.status === 'proposed' && onReviewAmendment && (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => onReviewAmendment(amendment.id, 'accepted')}
                                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => onReviewAmendment(amendment.id, 'rejected')}
                                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}

                                {amendment.reviewedAt && (
                                  <div className="text-xs text-gray-500 mt-2">
                                    Reviewed on {new Date(amendment.reviewedAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-lg border text-gray-500 text-sm">
                            No amendments proposed for this section
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedView === 'final' && finalTerms && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">Final Terms and Conditions</h3>
            <p className="text-green-700 text-sm">
              These are the final terms incorporating all accepted amendments. Both parties must agree to these terms.
            </p>
          </div>

          {finalTerms.sections.map((section) => (
            <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">{section.content}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {canReviewAmendments && (
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2">Review Required</h3>
          <p className="text-yellow-700 mb-4">
            There are {pendingAmendments.length} pending amendment{pendingAmendments.length > 1 ? 's' : ''} that require your review.
            Please review each amendment and accept or reject them to proceed.
          </p>
        </div>
      )}
    </div>
  );
};