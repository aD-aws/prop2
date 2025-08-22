'use client';

import React, { useState, useEffect } from 'react';
import { termsConditionsService, TermsAndConditions } from '@/lib/services/termsConditionsService';

interface SoWWithTermsIntegrationProps {
  projectId: string;
  projectType: string;
  sowGenerated: boolean;
  onTermsReady: (termsId: string) => void;
}

export const SoWWithTermsIntegration: React.FC<SoWWithTermsIntegrationProps> = ({
  projectId,
  projectType,
  sowGenerated,
  onTermsReady
}) => {
  const [standardTerms, setStandardTerms] = useState<TermsAndConditions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sowGenerated) {
      loadStandardTerms();
    }
  }, [sowGenerated, projectType]);

  const loadStandardTerms = async () => {
    try {
      setLoading(true);
      setError(null);

      const terms = await termsConditionsService.getStandardTerms(projectType);
      if (terms) {
        setStandardTerms(terms);
        onTermsReady(terms.id);
      } else {
        setError(`No standard terms available for ${projectType} projects`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load terms and conditions');
    } finally {
      setLoading(false);
    }
  };

  if (!sowGenerated) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Terms and Conditions</h3>
          <p className="text-gray-600">
            Terms and conditions will be available after your Scope of Work is generated.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <div>
            <h3 className="text-lg font-medium text-blue-900">Loading Terms and Conditions</h3>
            <p className="text-blue-700">Preparing standard terms for your project...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <svg className="w-6 h-6 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-red-800">Terms and Conditions Error</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={loadStandardTerms}
              className="mt-3 text-sm text-red-600 hover:text-red-500 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (standardTerms) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-green-900 mb-2">Terms and Conditions Ready</h3>
            <p className="text-green-700 mb-4">
              Standard terms and conditions for {projectType.replace('-', ' ')} projects have been loaded and are ready for review.
            </p>
            
            <div className="bg-white rounded-lg border border-green-200 p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">{standardTerms.title}</h4>
              <p className="text-gray-600 text-sm mb-3">{standardTerms.content}</p>
              
              <div className="text-sm text-gray-500">
                <span className="font-medium">{standardTerms.sections.length}</span> sections including:
                <ul className="mt-1 ml-4 list-disc">
                  {standardTerms.sections.slice(0, 3).map((section) => (
                    <li key={section.id}>{section.title}</li>
                  ))}
                  {standardTerms.sections.length > 3 && (
                    <li>...and {standardTerms.sections.length - 3} more</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex space-x-3">
              <a
                href={`/terms/${projectId}`}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
              >
                Review Full Terms
              </a>
              <button className="px-4 py-2 bg-white text-green-700 border border-green-300 rounded-md hover:bg-green-50 text-sm font-medium">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};