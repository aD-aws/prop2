'use client';

import React, { useState } from 'react';
import { Quote, RedFlag } from '@/lib/types';
import { RedFlagSummary } from '@/lib/services/quoteComparisonService';

interface RedFlagAlertsProps {
  quotes: Quote[];
  redFlagSummary: RedFlagSummary;
}

export const RedFlagAlerts: React.FC<RedFlagAlertsProps> = ({
  quotes,
  redFlagSummary
}) => {
  const [expandedBuilder, setExpandedBuilder] = useState<string | null>(null);

  if (redFlagSummary.totalFlags === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">All Clear</h3>
            <p className="mt-1 text-sm text-green-700">
              No red flags detected in any of the submitted quotes. All builders appear to meet standard requirements.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getSeverityIcon = (severity: RedFlag['severity']) => {
    switch (severity) {
      case 'high':
        return (
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getSeverityColor = (severity: RedFlag['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getSeverityTextColor = (severity: RedFlag['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-800';
      case 'medium':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  const getBuilderName = (builderId: string) => {
    const quote = quotes.find(q => q.builderId === builderId);
    return quote ? `Builder #${builderId.slice(-6)}` : 'Unknown Builder';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Red Flag Alerts</h3>
        <p className="text-sm text-gray-600 mt-1">
          {redFlagSummary.totalFlags} issue{redFlagSummary.totalFlags !== 1 ? 's' : ''} detected across all quotes
        </p>
      </div>

      <div className="p-6 space-y-4">
        {Object.entries(redFlagSummary.flagsByBuilder).map(([builderId, flags]) => {
          if (flags.length === 0) return null;

          const isExpanded = expandedBuilder === builderId;
          const highSeverityFlags = flags.filter(f => f.severity === 'high').length;
          const mediumSeverityFlags = flags.filter(f => f.severity === 'medium').length;

          return (
            <div key={builderId} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setExpandedBuilder(isExpanded ? null : builderId)}
                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 rounded-t-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {highSeverityFlags > 0 ? (
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {getBuilderName(builderId)}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {flags.length} issue{flags.length !== 1 ? 's' : ''}
                      {highSeverityFlags > 0 && ` (${highSeverityFlags} high severity)`}
                      {mediumSeverityFlags > 0 && ` (${mediumSeverityFlags} medium severity)`}
                    </p>
                  </div>
                </div>
                <svg
                  className={`h-5 w-5 text-gray-400 transform transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {flags.map((flag, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getSeverityColor(flag.severity)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getSeverityIcon(flag.severity)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h5 className={`text-sm font-medium ${getSeverityTextColor(flag.severity)}`}>
                              {flag.type.charAt(0).toUpperCase() + flag.type.slice(1)} Issue
                            </h5>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              flag.severity === 'high' ? 'bg-red-100 text-red-800' :
                              flag.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {flag.severity} severity
                            </span>
                          </div>
                          <p className={`mt-1 text-sm ${getSeverityTextColor(flag.severity)}`}>
                            {flag.description}
                          </p>
                          <div className="mt-2 p-2 bg-white rounded border">
                            <p className="text-xs font-medium text-gray-700 mb-1">Recommendation:</p>
                            <p className="text-xs text-gray-600">{flag.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Review all red flags carefully before making your selection.
            </p>
          </div>
          <div className="flex space-x-2">
            {redFlagSummary.highSeverity > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {redFlagSummary.highSeverity} High Risk
              </span>
            )}
            {redFlagSummary.mediumSeverity > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {redFlagSummary.mediumSeverity} Medium Risk
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};