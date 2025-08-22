'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { builderQuoteGenerationService, BuilderQuoteProject } from '@/lib/services/builderQuoteGenerationService';
import { GanttChart } from '@/components/timeline/GanttChart';

interface QuoteViewData {
  project: BuilderQuoteProject;
  builder: any;
}

export default function QuoteViewPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [quoteData, setQuoteData] = useState<QuoteViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuote = async () => {
      try {
        const data = await builderQuoteGenerationService.getQuoteByToken(token);
        if (data) {
          setQuoteData(data);
        } else {
          setError('Quote not found or link has expired');
        }
      } catch (err) {
        setError('Failed to load quote');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadQuote();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !quoteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Quote Not Found</h1>
          <p className="text-gray-600">{error || 'The quote you are looking for does not exist or has expired.'}</p>
        </div>
      </div>
    );
  }

  const { project, builder } = quoteData;
  const quote = project.quote!;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Professional Quote
            </h1>
            <p className="text-lg text-gray-600">
              {project.projectType} Project at {project.propertyAddress}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Project Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Project Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Client Information</h3>
              <p className="text-gray-600">{project.clientName}</p>
              <p className="text-gray-600">{project.propertyAddress}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Builder Information</h3>
              <p className="text-gray-600">{builder?.companyName || 'Professional Builder'}</p>
              {builder?.email && <p className="text-gray-600">{builder.email}</p>}
              {builder?.phone && <p className="text-gray-600">{builder.phone}</p>}
            </div>
          </div>
        </div>

        {/* Quote Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Quote Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Project Cost</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(quote.totalAmount)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Project Timeline</p>
              <p className="text-2xl font-bold text-green-600">{quote.timeline} days</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Start Date</p>
              <p className="text-lg font-bold text-purple-600">
                {formatDate(quote.startDate)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Cost Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Labor Costs:</span>
                  <span className="font-medium">{formatCurrency(quote.laborCosts)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Material Costs:</span>
                  <span className="font-medium">{formatCurrency(quote.materialCosts)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(quote.totalAmount)}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Timeline</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Earliest Start:</span>
                  <span className="font-medium">{formatDate(quote.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Projected Completion:</span>
                  <span className="font-medium">{formatDate(quote.projectedCompletionDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Working Days:</span>
                  <span className="font-medium">{quote.timeline} days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        {quote.breakdown && quote.breakdown.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Detailed Cost Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Category</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-right py-2">Quantity</th>
                    <th className="text-right py-2">Unit Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.breakdown.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{item.category}</td>
                      <td className="py-2">{item.description}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.type === 'labor' ? 'bg-blue-100 text-blue-800' :
                          item.type === 'material' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="text-right py-2">{item.quantity}</td>
                      <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                      <td className="text-right py-2 font-medium">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scope of Work */}
        {project.sowDocument && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Scope of Work</h2>
            <div className="prose max-w-none">
              {project.sowDocument.sections?.map((section: any, index: number) => (
                <div key={index} className="mb-6">
                  <h3 className="text-lg font-medium mb-2">{section.title}</h3>
                  <div className="text-gray-700 whitespace-pre-wrap">{section.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Timeline */}
        {project.ganttChart && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Project Timeline</h2>
            <GanttChart 
              ganttChart={project.ganttChart}
            />
          </div>
        )}

        {/* Terms and Conditions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Terms and Conditions</h2>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">{quote.terms}</div>
          </div>
        </div>

        {/* Quote Validity */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Quote Validity</h3>
              <p className="text-sm text-yellow-700 mt-1">
                This quote is valid until {formatDate(quote.validUntil)}. 
                Please contact the builder directly to accept this quote or discuss any modifications.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Next Steps</h2>
          <p className="text-blue-800 mb-4">
            If you're happy with this quote and would like to proceed, please contact the builder directly using the information provided above.
          </p>
          <p className="text-sm text-blue-700">
            This professional quote was generated using advanced AI-powered tools to ensure accuracy and completeness.
          </p>
        </div>
      </div>
    </div>
  );
}