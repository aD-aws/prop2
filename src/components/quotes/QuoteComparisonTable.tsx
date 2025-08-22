'use client';

import React from 'react';
import { Quote } from '@/lib/types';
import { QuoteComparison } from '@/lib/services/quoteComparisonService';

interface QuoteComparisonTableProps {
  quotes: Quote[];
  comparison: QuoteComparison;
  onSelectBuilder: (quoteId: string) => void;
}

export const QuoteComparisonTable: React.FC<QuoteComparisonTableProps> = ({
  quotes,
  comparison,
  onSelectBuilder
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getRiskBadgeColor = (quoteId: string) => {
    if (comparison.analysis.riskAssessment.lowRisk.includes(quoteId)) {
      return 'bg-green-100 text-green-800';
    } else if (comparison.analysis.riskAssessment.mediumRisk.includes(quoteId)) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  const getRiskLevel = (quoteId: string) => {
    if (comparison.analysis.riskAssessment.lowRisk.includes(quoteId)) {
      return 'Low Risk';
    } else if (comparison.analysis.riskAssessment.mediumRisk.includes(quoteId)) {
      return 'Medium Risk';
    } else {
      return 'High Risk';
    }
  };

  const isBestValue = (quoteId: string) => comparison.analysis.bestValue.quoteId === quoteId;
  const isFastest = (quoteId: string) => comparison.analysis.fastestCompletion.quoteId === quoteId;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Quote Comparison</h3>
        <p className="text-sm text-gray-600 mt-1">
          Compare pricing, timelines, and risk assessments across all quotes
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Price Range</p>
            <p className="text-sm text-gray-900">
              {formatCurrency(comparison.analysis.priceRange.lowest)} - {formatCurrency(comparison.analysis.priceRange.highest)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Average Price</p>
            <p className="text-sm text-gray-900">{formatCurrency(comparison.analysis.priceRange.average)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Timeline Range</p>
            <p className="text-sm text-gray-900">
              {comparison.analysis.timelineRange.shortest} - {comparison.analysis.timelineRange.longest} days
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Average Timeline</p>
            <p className="text-sm text-gray-900">{Math.round(comparison.analysis.timelineRange.average)} days</p>
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Builder
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timeline
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completion
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Red Flags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {quotes.map((quote) => (
              <tr key={quote.id} className={isBestValue(quote.id) ? 'bg-green-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Builder #{quote.builderId.slice(-6)}
                        {isBestValue(quote.id) && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Best Value
                          </span>
                        )}
                        {isFastest(quote.id) && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Fastest
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Submitted {formatDate(quote.submittedAt)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(quote.pricing.totalAmount)}
                  </div>
                  {quote.pricing.varianceFromEstimate && (
                    <div className={`text-xs ${
                      quote.pricing.varianceFromEstimate > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {quote.pricing.varianceFromEstimate > 0 ? '+' : ''}
                      {quote.pricing.varianceFromEstimate.toFixed(1)}% vs estimate
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{quote.timeline} days</div>
                  <div className="text-xs text-gray-500">
                    {Math.round(quote.timeline / 5)} weeks
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(quote.startDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(quote.projectedCompletionDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadgeColor(quote.id)}`}>
                    {getRiskLevel(quote.id)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {quote.aiAnalysis?.redFlags?.length || 0}
                  </div>
                  {quote.aiAnalysis?.redFlags && quote.aiAnalysis.redFlags.length > 0 && (
                    <div className="text-xs text-red-600">
                      {quote.aiAnalysis.redFlags.filter(f => f.severity === 'high').length} high,{' '}
                      {quote.aiAnalysis.redFlags.filter(f => f.severity === 'medium').length} medium
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onSelectBuilder(quote.id)}
                    className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                  >
                    Select Builder
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Analysis Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Best Value Recommendation</h4>
            <p className="text-sm text-gray-600">{comparison.analysis.bestValue.reasoning}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900">Fastest Completion</h4>
            <p className="text-sm text-gray-600">{comparison.analysis.fastestCompletion.reasoning}</p>
          </div>
        </div>
      </div>
    </div>
  );
};