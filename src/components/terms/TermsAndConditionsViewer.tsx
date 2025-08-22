'use client';

import React, { useState, useEffect } from 'react';
import { TermsAndConditions, TermsAmendment, ProjectTerms } from '@/lib/services/termsConditionsService';

interface TermsAndConditionsViewerProps {
  projectId: string;
  terms: TermsAndConditions;
  amendments?: TermsAmendment[];
  projectTerms?: ProjectTerms;
  userType: 'homeowner' | 'builder';
  onAcceptTerms?: () => void;
  onProposeAmendment?: (sectionId: string, proposedContent: string, reason: string) => void;
  readOnly?: boolean;
}

export const TermsAndConditionsViewer: React.FC<TermsAndConditionsViewerProps> = ({
  projectId,
  terms,
  amendments = [],
  projectTerms,
  userType,
  onAcceptTerms,
  onProposeAmendment,
  readOnly = false
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [amendmentMode, setAmendmentMode] = useState<string | null>(null);
  const [proposedContent, setProposedContent] = useState('');
  const [amendmentReason, setAmendmentReason] = useState('');

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleProposeAmendment = (sectionId: string) => {
    if (onProposeAmendment && proposedContent.trim() && amendmentReason.trim()) {
      onProposeAmendment(sectionId, proposedContent, amendmentReason);
      setAmendmentMode(null);
      setProposedContent('');
      setAmendmentReason('');
    }
  };

  const getSectionAmendments = (sectionId: string) => {
    return amendments.filter(a => a.sectionId === sectionId);
  };

  const getAmendmentStatusColor = (status: string) => {
    switch (status) {
      case 'proposed': return 'text-yellow-600 bg-yellow-50';
      case 'accepted': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const canAcceptTerms = projectTerms && 
    ((userType === 'homeowner' && !projectTerms.homeownerAccepted) ||
     (userType === 'builder' && !projectTerms.builderAccepted));

  const isFullyAgreed = projectTerms?.homeownerAccepted && projectTerms?.builderAccepted;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{terms.title}</h1>
        <p className="text-gray-600 mb-4">{terms.content}</p>
        
        {projectTerms && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Agreement Status</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className={`flex items-center ${projectTerms.homeownerAccepted ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${projectTerms.homeownerAccepted ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                Homeowner {projectTerms.homeownerAccepted ? 'Accepted' : 'Pending'}
              </div>
              <div className={`flex items-center ${projectTerms.builderAccepted ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${projectTerms.builderAccepted ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                Builder {projectTerms.builderAccepted ? 'Accepted' : 'Pending'}
              </div>
              {isFullyAgreed && (
                <div className="text-green-600 font-semibold">
                  ✓ Fully Agreed on {new Date(projectTerms.agreedAt!).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {terms.sections.map((section) => {
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
                    {section.isRequired && (
                      <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded">
                        Required
                      </span>
                    )}
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
                  <div className="p-4">
                    <div className="prose max-w-none mb-4">
                      <div className="whitespace-pre-wrap text-gray-700">{section.content}</div>
                    </div>

                    {/* Show amendments for this section */}
                    {sectionAmendments.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <h4 className="font-semibold text-gray-900">Proposed Amendments:</h4>
                        {sectionAmendments.map((amendment) => (
                          <div key={amendment.id} className={`p-3 rounded-lg border ${getAmendmentStatusColor(amendment.status)}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium capitalize">{amendment.status}</span>
                              <span className="text-sm text-gray-500">
                                {new Date(amendment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-sm mb-2">
                              <strong>Reason:</strong> {amendment.reason}
                            </div>
                            <div className="text-sm">
                              <strong>Proposed Change:</strong>
                              <div className="mt-1 p-2 bg-white rounded border whitespace-pre-wrap">
                                {amendment.proposedContent}
                              </div>
                            </div>
                            {amendment.reviewedAt && (
                              <div className="text-xs text-gray-500 mt-2">
                                Reviewed on {new Date(amendment.reviewedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Amendment proposal form */}
                    {!readOnly && userType === 'builder' && section.canBeAmended && amendmentMode === section.id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Propose Amendment</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Reason for Amendment
                            </label>
                            <input
                              type="text"
                              value={amendmentReason}
                              onChange={(e) => setAmendmentReason(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Explain why this amendment is needed..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Proposed Content
                            </label>
                            <textarea
                              value={proposedContent}
                              onChange={(e) => setProposedContent(e.target.value)}
                              rows={6}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter your proposed amendment..."
                            />
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleProposeAmendment(section.id)}
                              disabled={!proposedContent.trim() || !amendmentReason.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              Submit Amendment
                            </button>
                            <button
                              onClick={() => {
                                setAmendmentMode(null);
                                setProposedContent('');
                                setAmendmentReason('');
                              }}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Amendment action buttons */}
                    {!readOnly && userType === 'builder' && section.canBeAmended && amendmentMode !== section.id && (
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            setAmendmentMode(section.id);
                            setProposedContent(section.content);
                          }}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                        >
                          Propose Amendment
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Accept terms button */}
      {!readOnly && canAcceptTerms && onAcceptTerms && (
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">Accept Terms and Conditions</h3>
          <p className="text-green-700 mb-4">
            By accepting these terms and conditions, you agree to be bound by all the provisions outlined above.
          </p>
          <button
            onClick={onAcceptTerms}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700"
          >
            Accept Terms and Conditions
          </button>
        </div>
      )}

      {isFullyAgreed && (
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900">Terms and Conditions Agreed</h3>
              <p className="text-blue-700">
                Both parties have accepted these terms and conditions on {new Date(projectTerms!.agreedAt!).toLocaleDateString()}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};