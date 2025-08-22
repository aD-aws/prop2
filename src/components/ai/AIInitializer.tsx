'use client';

import { useEffect, useState } from 'react';
import { initializeAI, checkAIHealth } from '@/lib/services/initializeAI';

interface AIStatus {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  health: any;
}

export function AIInitializer({ children }: { children: React.ReactNode }) {
  const [aiStatus, setAIStatus] = useState<AIStatus>({
    initialized: false,
    loading: true,
    error: null,
    health: null
  });

  useEffect(() => {
    let mounted = true;

    const initAI = async () => {
      try {
        setAIStatus(prev => ({ ...prev, loading: true, error: null }));
        
        // Initialize AI system
        await initializeAI();
        
        // Check health
        const health = await checkAIHealth();
        
        if (mounted) {
          setAIStatus({
            initialized: health.healthy,
            loading: false,
            error: health.error || null,
            health: health.status
          });
        }
      } catch (error) {
        console.error('AI initialization failed:', error);
        if (mounted) {
          setAIStatus({
            initialized: false,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize AI system',
            health: null
          });
        }
      }
    };

    initAI();

    return () => {
      mounted = false;
    };
  }, []);

  // Show loading state while AI is initializing
  if (aiStatus.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Initializing AI System
          </h2>
          <p className="text-gray-600">
            Setting up specialized AI agents for your home improvement projects...
          </p>
        </div>
      </div>
    );
  }

  // Show error state if AI failed to initialize
  if (aiStatus.error && !aiStatus.initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            AI System Unavailable
          </h2>
          <p className="text-gray-600 mb-4">
            The AI system failed to initialize. Some features may not be available.
          </p>
          <p className="text-sm text-red-600 mb-4">
            Error: {aiStatus.error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // AI is initialized, render children with status indicator
  return (
    <>
      {children}
      {/* AI Status Indicator (only show if there are issues) */}
      {!aiStatus.initialized && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-md shadow-lg">
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm">AI system partially available</span>
          </div>
        </div>
      )}
    </>
  );
}

export default AIInitializer;