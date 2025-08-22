'use client';

import React from 'react';
import { Quote } from '@/lib/types';
import { CredentialVerification } from '@/lib/services/builderSelectionService';

interface BuilderVerificationDisplayProps {
  quotes: Quote[];
  verifications: { [builderId: string]: CredentialVerification };
}

export const BuilderVerificationDisplay: React.FC<BuilderVerificationDisplayProps> = ({
  quotes,
  verifications
}) => {
  const getVerificationIcon = (status: 'verified' | 'pending' | 'failed' | 'not_provided') => {
    switch (status) {
      case 'verified':
        return (
          <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getBuilderName = (builderId: string) => {
    return `Builder #${builderId.slice(-6)}`;
  };

  return (
    <div className="space-y-6">
      {quotes.map((quote) => {
        const verification = verifications[quote.builderId];
        
        if (!verification) {
          return (
            <div key={quote.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{getBuilderName(quote.builderId)}</h3>
                  <p className="text-sm text-gray-500">Verification data not available</p>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={quote.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {getBuilderName(quote.builderId).slice(-2)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getBuilderName(quote.builderId)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Quote submitted {formatDate(quote.submittedAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(verification.overallVerificationScore)}`}>
                    {verification.overallVerificationScore}% {getScoreLabel(verification.overallVerificationScore)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Verification Score</p>
                </div>
              </div>
            </div>

            {/* Verification Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Status Overview */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Verification Status
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      {getVerificationIcon(verification.companiesHouseVerified ? 'verified' : 'not_provided')}
                      <span className="text-sm text-gray-700">Companies House Registration</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        verification.companiesHouseVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {verification.companiesHouseVerified ? 'Verified' : 'Not Provided'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      {getVerificationIcon(verification.insuranceVerified ? 'verified' : 'not_provided')}
                      <span className="text-sm text-gray-700">Insurance Documentation</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        verification.insuranceVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {verification.insuranceVerified ? 'Verified' : 'Not Provided'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      {getVerificationIcon(verification.referencesVerified ? 'verified' : 'not_provided')}
                      <span className="text-sm text-gray-700">Reference Projects</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        verification.referencesVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {verification.referencesVerified ? 'Verified' : 'Not Provided'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      {getVerificationIcon(verification.qualificationsVerified ? 'verified' : 'not_provided')}
                      <span className="text-sm text-gray-700">Qualifications</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        verification.qualificationsVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {verification.qualificationsVerified ? 'Verified' : 'Not Provided'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detailed Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Verification Details
                  </h4>
                  
                  <div className="space-y-3">
                    {verification.verificationDetails.map((detail, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getVerificationIcon(detail.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h5 className="text-sm font-medium text-gray-900 capitalize">
                                {detail.type.replace('_', ' ')}
                              </h5>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                detail.status === 'verified' ? 'bg-green-100 text-green-800' :
                                detail.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                detail.status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {detail.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{detail.details}</p>
                            {detail.verifiedAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                Verified on {formatDate(detail.verifiedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline Information */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                  Project Timeline
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900">Proposed Start Date</p>
                    <p className="text-lg font-semibold text-blue-700">{formatDate(quote.startDate)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-900">Project Duration</p>
                    <p className="text-lg font-semibold text-green-700">{quote.timeline} working days</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-purple-900">Completion Date</p>
                    <p className="text-lg font-semibold text-purple-700">{formatDate(quote.projectedCompletionDate)}</p>
                  </div>
                </div>
              </div>

              {/* Reference Projects */}
              {quote.referenceProjects && quote.referenceProjects.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                    Reference Projects ({quote.referenceProjects.length})
                  </h4>
                  <div className="space-y-3">
                    {quote.referenceProjects.slice(0, 3).map((ref, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{ref.projectType}</p>
                            <p className="text-sm text-gray-600">{ref.address}</p>
                            <p className="text-xs text-gray-500">Completed {formatDate(ref.completionDate)}</p>
                            {ref.description && (
                              <p className="text-sm text-gray-700 mt-1">{ref.description}</p>
                            )}
                          </div>
                          <div className="flex space-x-2 ml-4">
                            {ref.contactAllowed && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                Contact OK
                              </span>
                            )}
                            {ref.visitAllowed && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Visit OK
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {quote.referenceProjects.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{quote.referenceProjects.length - 3} more reference projects available
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};