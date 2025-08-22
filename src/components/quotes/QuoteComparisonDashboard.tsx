'use client';

import React, { useState, useEffect } from 'react';
import { Quote, BuilderProfile } from '@/lib/types';
import { QuoteComparison, QuoteComparisonService } from '@/lib/services/quoteComparisonService';
import { BuilderSelectionService, CredentialVerification } from '@/lib/services/builderSelectionService';
import { QuoteComparisonTable } from './QuoteComparisonTable';
import { RedFlagAlerts } from './RedFlagAlerts';
import { NegotiationGuidance } from './NegotiationGuidance';
import { BuilderVerificationDisplay } from './BuilderVerificationDisplay';
import { MeetBeforeContractModal } from './MeetBeforeContractModal';

interface QuoteComparisonDashboardProps {
  projectId: string;
  quotes: Quote[];
  onBuilderSelected: (quoteId: string, selectionReason?: string) => void;
}

export const QuoteComparisonDashboard: React.FC<QuoteComparisonDashboardProps> = ({
  projectId,
  quotes,
  onBuilderSelected
}) => {
  const [comparison, setComparison] = useState<QuoteComparison | null>(null);
  const [builderVerifications, setBuilderVerifications] = useState<{ [builderId: string]: CredentialVerification }>({});
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'comparison' | 'guidance' | 'verification'>('comparison');

  useEffect(() => {
    loadComparisonData();
  }, [projectId, quotes]);

  const loadComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (quotes.length < 2) {
        setError('At least 2 quotes are required for comparison');
        return;
      }

      // Load quote comparison
      const comparisonResult = await QuoteComparisonService.compareQuotes(projectId, quotes);
      if (!comparisonResult.success) {
        setError(comparisonResult.error || 'Failed to compare quotes');
        return;
      }

      setComparison(comparisonResult.comparison!);

      // Load builder verifications
      const verifications: { [builderId: string]: CredentialVerification } = {};
      for (const quote of quotes) {
        const verificationResult = await BuilderSelectionService.getBuilderVerification(quote.builderId);
        if (verificationResult.success && verificationResult.verification) {
          verifications[quote.builderId] = verificationResult.verification;
        }
      }
      setBuilderVerifications(verifications);

    } catch (err) {
      console.error('Error loading comparison data:', err);
      setError('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBuilder = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    setShowMeetingModal(true);
  };

  const handleConfirmSelection = (selectionReason?: string) => {
    if (selectedQuoteId) {
      onBuilderSelected(selectedQuoteId, selectionReason);
      setShowMeetingModal(false);
      setSelectedQuoteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Analyzing quotes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No comparison data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote Comparison</h2>
        <p className="text-gray-600">
          Compare {quotes.length} quotes to make an informed decision about your builder selection.
        </p>
      </div>

      {/* Red Flag Summary */}
      {comparison.redFlagSummary.totalFlags > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                {comparison.redFlagSummary.totalFlags} Red Flag{comparison.redFlagSummary.totalFlags !== 1 ? 's' : ''} Detected
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                {comparison.redFlagSummary.highSeverity > 0 && `${comparison.redFlagSummary.highSeverity} high severity, `}
                {comparison.redFlagSummary.mediumSeverity > 0 && `${comparison.redFlagSummary.mediumSeverity} medium severity, `}
                {comparison.redFlagSummary.lowSeverity > 0 && `${comparison.redFlagSummary.lowSeverity} low severity`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'comparison'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Quote Comparison
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'verification'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Builder Verification
          </button>
          <button
            onClick={() => setActiveTab('guidance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'guidance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Negotiation Guidance
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <QuoteComparisonTable
            quotes={quotes}
            comparison={comparison}
            onSelectBuilder={handleSelectBuilder}
          />
          <RedFlagAlerts
            quotes={quotes}
            redFlagSummary={comparison.redFlagSummary}
          />
        </div>
      )}

      {activeTab === 'verification' && (
        <BuilderVerificationDisplay
          quotes={quotes}
          verifications={builderVerifications}
        />
      )}

      {activeTab === 'guidance' && (
        <NegotiationGuidance
          negotiationTips={comparison.negotiationTips}
          questionsToAsk={comparison.questionsToAsk}
          recommendations={comparison.recommendations}
        />
      )}

      {/* Meet Before Contract Modal */}
      {showMeetingModal && selectedQuoteId && (
        <MeetBeforeContractModal
          quote={quotes.find(q => q.id === selectedQuoteId)!}
          onConfirm={handleConfirmSelection}
          onCancel={() => {
            setShowMeetingModal(false);
            setSelectedQuoteId(null);
          }}
        />
      )}
    </div>
  );
};