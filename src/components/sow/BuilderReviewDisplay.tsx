'use client';

import React, { useState } from 'react';
import { BuilderReviewAnalysis, BuilderReviewIssue, BuilderReviewRecommendation } from '../../lib/types';

interface BuilderReviewDisplayProps {
  analysis: BuilderReviewAnalysis;
  onApplyRecommendations?: (selectedRecommendations: string[]) => void;
  onRegenerateSoW?: () => void;
  isApplyingRecommendations?: boolean;
}

export const BuilderReviewDisplay: React.FC<BuilderReviewDisplayProps> = ({
  analysis,
  onApplyRecommendations,
  onRegenerateSoW,
  isApplyingRecommendations = false
}) => {
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    issues: false,
    recommendations: false,
    details: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleRecommendation = (recommendationId: string) => {
    setSelectedRecommendations(prev => 
      prev.includes(recommendationId)
        ? prev.filter(id => id !== recommendationId)
        : [...prev, recommendationId]
    );
  };

  const handleApplySelected = () => {
    if (onApplyRecommendations && selectedRecommendations.length > 0) {
      onApplyRecommendations(selectedRecommendations);
    }
  };

  const getQualityColor = (indicator: string) => {
    switch (indicator) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'needs_improvement': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'major': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'minor': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          AI Builder Review Results
        </h2>
        <p className="text-gray-600">
          Professional review by {analysis.reviewAgentType} specialist • 
          Reviewed on {analysis.reviewedAt.toLocaleDateString()}
        </p>
      </div>

      {/* Overview Section */}
      <div className="space-y-4">
        <button
          onClick={() => toggleSection('overview')}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
          <span className="text-gray-500">
            {expandedSections.overview ? '−' : '+'}
          </span>
        </button>

        {expandedSections.overview && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quality Score */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {analysis.overallScore}
                </div>
                <div className="text-sm text-gray-600 mb-2">Quality Score</div>
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getQualityColor(analysis.qualityIndicator)}`}>
                  {analysis.qualityIndicator.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>

            {/* Issues Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {analysis.issues.length}
                </div>
                <div className="text-sm text-gray-600 mb-2">Issues Found</div>
                <div className="space-y-1">
                  {analysis.issues.filter(i => i.severity === 'critical').length > 0 && (
                    <div className="text-xs text-red-600">
                      {analysis.issues.filter(i => i.severity === 'critical').length} Critical
                    </div>
                  )}
                  {analysis.issues.filter(i => i.severity === 'major').length > 0 && (
                    <div className="text-xs text-orange-600">
                      {analysis.issues.filter(i => i.severity === 'major').length} Major
                    </div>
                  )}
                  {analysis.issues.filter(i => i.severity === 'minor').length > 0 && (
                    <div className="text-xs text-yellow-600">
                      {analysis.issues.filter(i => i.severity === 'minor').length} Minor
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {analysis.recommendations.length}
                </div>
                <div className="text-sm text-gray-600 mb-2">Recommendations</div>
                <div className="space-y-1">
                  {analysis.recommendations.filter(r => r.priority === 'high').length > 0 && (
                    <div className="text-xs text-red-600">
                      {analysis.recommendations.filter(r => r.priority === 'high').length} High Priority
                    </div>
                  )}
                  {analysis.recommendations.filter(r => r.priority === 'medium').length > 0 && (
                    <div className="text-xs text-yellow-600">
                      {analysis.recommendations.filter(r => r.priority === 'medium').length} Medium Priority
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Issues Section */}
      {analysis.issues.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => toggleSection('issues')}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Issues Identified ({analysis.issues.length})
            </h3>
            <span className="text-gray-500">
              {expandedSections.issues ? '−' : '+'}
            </span>
          </button>

          {expandedSections.issues && (
            <div className="space-y-3">
              {analysis.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{issue.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                      {issue.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{issue.description}</p>
                  <div className="text-xs space-y-1">
                    <div><strong>Location:</strong> {issue.location}</div>
                    <div><strong>Impact:</strong> {issue.impact}</div>
                    <div><strong>Category:</strong> {issue.category.replace('_', ' ')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommendations Section */}
      {analysis.recommendations.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => toggleSection('recommendations')}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Recommendations ({analysis.recommendations.length})
            </h3>
            <span className="text-gray-500">
              {expandedSections.recommendations ? '−' : '+'}
            </span>
          </button>

          {expandedSections.recommendations && (
            <div className="space-y-3">
              {analysis.recommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className="border rounded-lg p-4 bg-blue-50 border-blue-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`rec-${recommendation.id}`}
                        checked={selectedRecommendations.includes(recommendation.id)}
                        onChange={() => toggleRecommendation(recommendation.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`rec-${recommendation.id}`}
                        className="font-semibold cursor-pointer"
                      >
                        {recommendation.title}
                      </label>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(recommendation.priority)}`}>
                      {recommendation.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{recommendation.description}</p>
                  {recommendation.suggestedText && (
                    <div className="bg-white rounded p-2 mb-2">
                      <div className="text-xs font-medium text-gray-600 mb-1">Suggested Text:</div>
                      <div className="text-sm italic">{recommendation.suggestedText}</div>
                    </div>
                  )}
                  <div className="text-xs">
                    <div><strong>Reasoning:</strong> {recommendation.reasoning}</div>
                    <div><strong>Type:</strong> {recommendation.type.replace('_', ' ')}</div>
                  </div>
                </div>
              ))}

              {/* Apply Recommendations Button */}
              {onApplyRecommendations && selectedRecommendations.length > 0 && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={handleApplySelected}
                    disabled={isApplyingRecommendations}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApplyingRecommendations ? 'Applying...' : `Apply ${selectedRecommendations.length} Recommendations`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detailed Analysis Section */}
      <div className="space-y-4">
        <button
          onClick={() => toggleSection('details')}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">Detailed Analysis</h3>
          <span className="text-gray-500">
            {expandedSections.details ? '−' : '+'}
          </span>
        </button>

        {expandedSections.details && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.missingElements.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">Missing Elements</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {analysis.missingElements.map((element, index) => (
                    <li key={index}>• {element}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.unrealisticSpecifications.length > 0 && (
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2">Unrealistic Specifications</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  {analysis.unrealisticSpecifications.map((spec, index) => (
                    <li key={index}>• {spec}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.regulatoryIssues.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Regulatory Issues</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {analysis.regulatoryIssues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.materialImprovements.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Material Improvements</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {analysis.materialImprovements.map((improvement, index) => (
                    <li key={index}>• {improvement}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {onRegenerateSoW && (
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={onRegenerateSoW}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Regenerate SoW with All Improvements
          </button>
        </div>
      )}
    </div>
  );
};