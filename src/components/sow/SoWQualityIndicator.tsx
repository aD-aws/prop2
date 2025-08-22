'use client';

import React from 'react';
import { BuilderReviewAnalysis } from '../../lib/types';

interface SoWQualityIndicatorProps {
  analysis: BuilderReviewAnalysis | null;
  showDetails?: boolean;
  compact?: boolean;
}

export const SoWQualityIndicator: React.FC<SoWQualityIndicatorProps> = ({
  analysis,
  showDetails = false,
  compact = false
}) => {
  if (!analysis) {
    return (
      <div className={`${compact ? 'inline-flex items-center space-x-2' : 'bg-gray-50 rounded-lg p-4'}`}>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <span className={`${compact ? 'text-sm' : 'text-base'} text-gray-600`}>
            Not Reviewed
          </span>
        </div>
      </div>
    );
  }

  const getQualityConfig = (indicator: string) => {
    switch (indicator) {
      case 'excellent':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          dotColor: 'bg-green-500',
          label: 'Excellent Quality',
          description: 'This SoW has been professionally reviewed and meets all quality standards.'
        };
      case 'good':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          dotColor: 'bg-blue-500',
          label: 'Good Quality',
          description: 'This SoW has been reviewed with minor improvements suggested.'
        };
      case 'needs_improvement':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          dotColor: 'bg-yellow-500',
          label: 'Needs Improvement',
          description: 'This SoW has been reviewed with several improvements recommended.'
        };
      case 'poor':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          dotColor: 'bg-red-500',
          label: 'Poor Quality',
          description: 'This SoW requires significant improvements before proceeding.'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          dotColor: 'bg-gray-500',
          label: 'Unknown',
          description: 'Quality assessment unavailable.'
        };
    }
  };

  const config = getQualityConfig(analysis.qualityIndicator);

  if (compact) {
    return (
      <div className="inline-flex items-center space-x-2">
        <div className={`w-3 h-3 ${config.dotColor} rounded-full`}></div>
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
        <span className="text-sm text-gray-500">
          ({analysis.overallScore}/100)
        </span>
      </div>
    );
  }

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4`}>
      <div className="flex items-start space-x-3">
        {/* Quality Indicator */}
        <div className="flex-shrink-0">
          <div className={`w-4 h-4 ${config.dotColor} rounded-full mt-0.5`}></div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-semibold ${config.color}`}>
              Professionally Reviewed - {config.label}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${config.color}`}>
                Score: {analysis.overallScore}/100
              </span>
            </div>
          </div>

          <p className={`text-sm ${config.color} mb-3`}>
            {config.description}
          </p>

          {showDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Issues Found:</span>
                <span className={`font-medium ${config.color}`}>
                  {analysis.issues.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Recommendations:</span>
                <span className={`font-medium ${config.color}`}>
                  {analysis.recommendations.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Reviewed By:</span>
                <span className={`font-medium ${config.color} capitalize`}>
                  {analysis.reviewAgentType.replace('-', ' ')} Expert
                </span>
              </div>
            </div>
          )}

          {/* Review Date */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Reviewed on {analysis.reviewedAt.toLocaleDateString()} by AI {analysis.reviewAgentType} specialist
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoWQualityIndicator;