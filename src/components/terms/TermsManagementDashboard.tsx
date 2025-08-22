'use client';

import React, { useState, useEffect } from 'react';
import { 
  termsConditionsService, 
  TermsAndConditions, 
  TermsAmendment, 
  ProjectTerms 
} from '@/lib/services/termsConditionsService';

interface TermsManagementDashboardProps {
  projectId: string;
  projectType: string;
  userId: string;
  userType: 'homeowner' | 'builder';
}

export const TermsManagementDashboard: React.FC<TermsManagementDashboardProps> = ({
  projectId,
  projectType,
  userId,
  userType
}) => {
  const [standardTerms, setStandardTerms] = useState<TermsAndConditions | null>(null);
  const [projectTerms, setProjectTerms] = useState<ProjectTerms | null>(null);
  const [amendments, setAmendments] = useState<TermsAmendment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'view' | 'amendments' | 'comparison'>('view');

  useEffect(() => {
    loadTermsData();
  }, [projectId, projectType]);

  const loadTermsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [standardTermsData, projectTermsData, amendmentsData] = await Promise.all([
        termsConditionsService.getStandardTerms(projectType),
        termsConditionsService.getProjectTerms(projectId),
        termsConditionsService.getProjectAmendments(projectId)
      ]);

      setStandardTerms(standardTermsData);
      setProjectTerms(projectTermsData);
      setAmendments(amendmentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load terms data');
    } finally {
      setLoading(false);
    }
  };

  const handleProposeAmendment = async (sectionId: string, proposedContent: string, reason: string) => {
    if (!standardTerms) return;

    try {
      const amendment = await termsConditionsService.proposeAmendment(
        projectId,
        userId,
        standardTerms.id,
        sectionId,
        proposedContent,
        reason
      );

      setAmendments(prev => [...prev, amendment]);
      
      // Show success message
      alert('Amendment proposed successfully. The homeowner will be notified to review it.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to propose amendment');
    }
  };

  const handleReviewAmendment = async (amendmentId: string, status: 'accepted' | 'rejected') => {
    try {
      const updatedAmendment = await termsConditionsService.reviewAmendment(
        amendmentId,
        projectId,
        userId,
        status
      );

      setAmendments(prev => 
        prev.map(a => a.id === amendmentId ? updatedAmendment : a)
      );

      // If all amendments are reviewed, generate final terms
      const allAmendments = amendments.map(a => 
        a.id === amendmentId ? updatedAmendment : a
      );
      
      const pendingAmendments = allAmendments.filter(a => a.status === 'proposed');
      
      if (pendingAmendments.length === 0 && standardTerms) {
        const finalTerms = await termsConditionsService.generateFinalTerms(projectId, standardTerms.id);
        setProjectTerms(finalTerms);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review amendment');
    }
  };

  const handleAcceptTerms = async () => {
    try {
      const updatedProjectTerms = await termsConditionsService.acceptTerms(projectId, userId, userType);
      setProjectTerms(updatedProjectTerms);
      
      if (updatedProjectTerms.homeownerAccepted && updatedProjectTerms.builderAccepted) {
        alert('Terms and conditions have been fully agreed by both parties!');
      } else {
        alert('You have accepted the terms and conditions. Waiting for the other party to accept.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept terms');
    }
  };

  const getComparisonData = async () => {
    if (!standardTerms) return null;
    
    try {
      return await termsConditionsService.compareTermsVariations(projectId);
    } catch (err) {
      console.error('Failed to get comparison data:', err);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error Loading Terms</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={loadTermsData}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!standardTerms) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">No Standard Terms Available</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Standard terms and conditions have not been set up for {projectType} projects yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pendingAmendments = amendments.filter(a => a.status === 'proposed');
  const hasAmendments = amendments.length > 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
        <p className="text-gray-600">
          Review and manage the terms and conditions for your {projectType} project.
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Standard Terms</p>
              <p className="text-lg font-semibold text-gray-900">Available</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Amendments</p>
              <p className="text-lg font-semibold text-gray-900">
                {amendments.length} ({pendingAmendments.length} pending)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className={`w-8 h-8 ${projectTerms?.agreedAt ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Agreement Status</p>
              <p className="text-lg font-semibold text-gray-900">
                {projectTerms?.agreedAt ? 'Fully Agreed' : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('view')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'view'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            View Terms
          </button>
          {hasAmendments && (
            <button
              onClick={() => setActiveTab('amendments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'amendments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Amendments ({amendments.length})
            </button>
          )}
          {hasAmendments && (
            <button
              onClick={() => setActiveTab('comparison')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'comparison'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Compare Changes
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'view' && (
        <div>
          {/* Import and use TermsAndConditionsViewer component */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {projectTerms?.finalTerms ? 'Final Terms and Conditions' : 'Standard Terms and Conditions'}
            </h2>
            
            {/* This would be replaced with the actual TermsAndConditionsViewer component */}
            <div className="space-y-4">
              {(projectTerms?.finalTerms || standardTerms).sections.map((section) => (
                <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{section.title}</h3>
                  <div className="whitespace-pre-wrap text-gray-700 text-sm">{section.content}</div>
                </div>
              ))}
            </div>

            {/* Accept Terms Button */}
            {projectTerms && !projectTerms.agreedAt && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <button
                  onClick={handleAcceptTerms}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700"
                >
                  Accept Terms and Conditions
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'amendments' && (
        <div className="space-y-4">
          {amendments.map((amendment) => (
            <div key={amendment.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Amendment to: {standardTerms.sections.find(s => s.id === amendment.sectionId)?.title}
                </h3>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  amendment.status === 'proposed' ? 'bg-yellow-100 text-yellow-800' :
                  amendment.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {amendment.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Original Content</h4>
                  <div className="p-3 bg-gray-50 rounded border text-sm whitespace-pre-wrap">
                    {amendment.originalContent}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Proposed Content</h4>
                  <div className="p-3 bg-blue-50 rounded border text-sm whitespace-pre-wrap">
                    {amendment.proposedContent}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Reason for Amendment</h4>
                <p className="text-gray-700 text-sm">{amendment.reason}</p>
              </div>

              {userType === 'homeowner' && amendment.status === 'proposed' && (
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => handleReviewAmendment(amendment.id, 'accepted')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Accept Amendment
                  </button>
                  <button
                    onClick={() => handleReviewAmendment(amendment.id, 'rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject Amendment
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'comparison' && hasAmendments && (
        <div>
          {/* This would use the TermsComparisonView component */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Terms Comparison</h2>
            <p className="text-gray-600 mb-4">
              Compare the original terms with proposed amendments to see all changes at a glance.
            </p>
            {/* Comparison content would go here */}
          </div>
        </div>
      )}
    </div>
  );
};