'use client';

import React from 'react';
import { QuoteAnalysis, RedFlag } from '@/lib/types';

interface QuoteAnalysisDisplayProps {
  analysis: QuoteAnalysis;
  className?: string;
}

export function QuoteAnalysisDisplay({ analysis, className = '' }: QuoteAnalysisDisplayProps) {
  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low':
        return 'text-blue-600 bg-blue-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRedFlagIcon = (type: RedFlag['type']) => {
    switch (type) {
      case 'pricing':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'timeline':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'documentation':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'references':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">AI Quote Analysis</h3>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(analysis.overallRisk)}`}>
          {analysis.overallRisk.charAt(0).toUpperCase() + analysis.overallRisk.slice(1)} Risk
        </span>
      </div>

      {/* Red Flags */}
      {analysis.redFlags.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Red Flags ({analysis.redFlags.length})
          </h4>
          
          <div className="space-y-3">
            {analysis.redFlags.map((flag, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 p-2 rounded-full ${getSeverityColor(flag.severity)}`}>
                    {getRedFlagIcon(flag.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-900 capitalize">
                        {flag.type} Issue
                      </h5>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(flag.severity)}`}>
                        {flag.severity} severity
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{flag.description}</p>
                    
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm text-blue-700">
                        <strong>Recommendation:</strong> {flag.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Analysis */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
          <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Timeline Analysis
        </h4>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm font-medium text-gray-700">Timeline Assessment</div>
              <div className={`text-lg font-semibold ${analysis.timelineAnalysis.isRealistic ? 'text-green-600' : 'text-red-600'}`}>
                {analysis.timelineAnalysis.isRealistic ? 'Realistic' : 'Unrealistic'}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-700">Compared to Average</div>
              <div className={`text-lg font-semibold ${
                Math.abs(analysis.timelineAnalysis.comparedToAverage) <= 10 
                  ? 'text-green-600' 
                  : Math.abs(analysis.timelineAnalysis.comparedToAverage) <= 25 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
              }`}>
                {analysis.timelineAnalysis.comparedToAverage > 0 ? '+' : ''}
                {analysis.timelineAnalysis.comparedToAverage.toFixed(1)}%
              </div>
            </div>
          </div>
          
          {analysis.timelineAnalysis.concerns.length > 0 && (
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Concerns:</div>
              <ul className="list-disc list-inside space-y-1">
                {analysis.timelineAnalysis.concerns.map((concern, index) => (
                  <li key={index} className="text-sm text-gray-600">{concern}</li>
                ))}
              </ul>
            </div>
          )}
          
          {analysis.timelineAnalysis.recommendations.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Recommendations:</div>
              <ul className="list-disc list-inside space-y-1">
                {analysis.timelineAnalysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-blue-600">{recommendation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Analysis */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          Pricing Analysis
        </h4>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm font-medium text-gray-700">Compared to Estimate</div>
              <div className={`text-lg font-semibold ${
                Math.abs(analysis.pricingAnalysis.comparedToEstimate) <= 10 
                  ? 'text-green-600' 
                  : Math.abs(analysis.pricingAnalysis.comparedToEstimate) <= 25 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
              }`}>
                {analysis.pricingAnalysis.comparedToEstimate > 0 ? '+' : ''}
                {analysis.pricingAnalysis.comparedToEstimate.toFixed(1)}%
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-700">Compared to Market</div>
              <div className={`text-lg font-semibold ${
                Math.abs(analysis.pricingAnalysis.comparedToMarket) <= 15 
                  ? 'text-green-600' 
                  : Math.abs(analysis.pricingAnalysis.comparedToMarket) <= 30 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
              }`}>
                {analysis.pricingAnalysis.comparedToMarket > 0 ? '+' : ''}
                {analysis.pricingAnalysis.comparedToMarket.toFixed(1)}%
              </div>
            </div>
          </div>
          
          {analysis.pricingAnalysis.unusualItems.length > 0 && (
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Unusual Items:</div>
              <ul className="list-disc list-inside space-y-1">
                {analysis.pricingAnalysis.unusualItems.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600">{item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {analysis.pricingAnalysis.recommendations.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Recommendations:</div>
              <ul className="list-disc list-inside space-y-1">
                {analysis.pricingAnalysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-blue-600">{recommendation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* No Issues Message */}
      {analysis.redFlags.length === 0 && analysis.overallRisk === 'low' && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-green-800">Quote Looks Good</h4>
              <p className="text-sm text-green-700 mt-1">
                No significant issues detected. This quote appears to be well-structured and realistic.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}