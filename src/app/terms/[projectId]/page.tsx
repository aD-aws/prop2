'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TermsManagementDashboard } from '@/components/terms/TermsManagementDashboard';

interface TermsPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default function TermsPage({ params }: TermsPageProps) {
  const [projectId, setProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<Record<string, unknown> | null>(null);
  const [userType, setUserType] = useState<'homeowner' | 'builder'>('homeowner');
  const [userId, setUserId] = useState<string>('');

  const loadProjectData = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);

      // In a real app, fetch project data from your project service
      // For now, we'll mock some project data
      const mockProject = {
        id: projectId,
        projectType: 'kitchen-renovation',
        homeownerId: 'homeowner-123',
        builderId: 'builder-456',
        status: 'quote-review'
      };

      setProjectData(mockProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    // Resolve the params promise
    params.then((resolvedParams) => {
      setProjectId(resolvedParams.projectId);
    });
  }, [params]);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
      // In a real app, get user info from auth context
      setUserId('user-123');
      setUserType('homeowner');
    }
  }, [projectId, loadProjectData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project terms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Error Loading Terms</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadProjectData}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600">The requested project could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Terms and Conditions</h1>
              <p className="text-gray-600">
                Project: {(projectData.projectType as string)?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                projectData.status === 'terms-agreed' ? 'bg-green-100 text-green-800' :
                projectData.status === 'terms-review' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {(projectData.status as string)?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <TermsManagementDashboard
          projectId={projectId}
          projectType={projectData.projectType as string}
          userId={userId}
          userType={userType}
        />
      </div>
    </div>
  );
}