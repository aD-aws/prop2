'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Quote } from '@/lib/types';
import { QuoteManagementService } from '@/lib/services/quoteManagementService';
import { BuilderSelectionService } from '@/lib/services/builderSelectionService';
import { QuoteComparisonDashboard } from '@/components/quotes/QuoteComparisonDashboard';

function QuoteComparisonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId');

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectionInProgress, setSelectionInProgress] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadQuotes();
    } else {
      setError('Project ID is required');
      setLoading(false);
    }
  }, [projectId]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!projectId) {
        setError('Project ID is required');
        return;
      }

      const result = await QuoteManagementService.getProjectQuotes(projectId);
      
      if (!result.success) {
        setError(result.error || 'Failed to load quotes');
        return;
      }

      // Filter to only submitted quotes
      const submittedQuotes = result.quotes?.filter(quote => quote.status === 'submitted') || [];
      
      if (submittedQuotes.length < 2) {
        setError('At least 2 submitted quotes are required for comparison');
        return;
      }

      setQuotes(submittedQuotes);
    } catch (err) {
      console.error('Error loading quotes:', err);
      setError('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleBuilderSelected = async (quoteId: string, selectionReason?: string) => {
    try {
      setSelectionInProgress(true);

      const result = await BuilderSelectionService.selectBuilder(
        projectId!,
        quoteId,
        'current-user-id', // This would come from auth context
        selectionReason
      );

      if (!result.success) {
        alert(`Failed to select builder: ${result.error}`);
        return;
      }

      // Redirect to meeting scheduling page
      router.push(`/quotes/meeting?selectionId=${result.selectionId}`);
    } catch (err) {
      console.error('Error selecting builder:', err);
      alert('Failed to select builder');
    } finally {
      setSelectionInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotes for comparison...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Unable to Load Quotes</h3>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-6 flex space-x-3">
            <button
              onClick={() => router.back()}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={loadQuotes}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <button
              onClick={() => router.back()}
              className="hover:text-gray-700 transition-colors"
            >
              ← Back to Project
            </button>
            <span>/</span>
            <span className="text-gray-900">Quote Comparison</span>
          </nav>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Compare Builder Quotes</h1>
              <p className="text-gray-600 mt-2">
                Review and compare {quotes.length} quotes to select the best builder for your project
              </p>
            </div>
            
            {selectionInProgress && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Processing selection...</span>
              </div>
            )}
          </div>
        </div>

        {/* Quote Comparison Dashboard */}
        <QuoteComparisonDashboard
          projectId={projectId!}
          quotes={quotes}
          onBuilderSelected={handleBuilderSelected}
        />

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Need Help Choosing?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">🎯 Best Value</h4>
              <p>Look for the quote marked as "Best Value" - this considers price, timeline, and risk factors together.</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">⚠️ Red Flags</h4>
              <p>Pay attention to red flag alerts. High-severity issues should be addressed before selection.</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">✅ Verification</h4>
              <p>Check the builder verification tab to see credentials, insurance, and reference projects.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuoteComparisonPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading quotes...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <QuoteComparisonContent />
    </Suspense>
  );
}