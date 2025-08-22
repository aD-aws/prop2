'use client';

import React, { useState } from 'react';
import { NegotiationTip, QuestionCategory, ComparisonRecommendation } from '@/lib/services/quoteComparisonService';

interface NegotiationGuidanceProps {
  negotiationTips: NegotiationTip[];
  questionsToAsk: QuestionCategory[];
  recommendations: ComparisonRecommendation[];
}

export const NegotiationGuidance: React.FC<NegotiationGuidanceProps> = ({
  negotiationTips,
  questionsToAsk,
  recommendations
}) => {
  const [activeSection, setActiveSection] = useState<'recommendations' | 'negotiation' | 'questions'>('recommendations');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const getPriorityColor = (priority: ComparisonRecommendation['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'pricing':
        return (
          <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd" />
          </svg>
        );
      case 'timeline':
        return (
          <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'scope':
        return (
          <svg className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2H5v-2h10z" clipRule="evenodd" />
          </svg>
        );
      case 'terms':
        return (
          <svg className="h-5 w-5 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 2h6v4H7V6zm8 8v2H5v-2h10z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getImportanceColor = (importance: 'critical' | 'important' | 'nice-to-know') => {
    switch (importance) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'important':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSection('recommendations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'recommendations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recommendations
          </button>
          <button
            onClick={() => setActiveSection('negotiation')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'negotiation'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Negotiation Tips
          </button>
          <button
            onClick={() => setActiveSection('questions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'questions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Questions to Ask
          </button>
        </nav>
      </div>

      {/* Recommendations Section */}
      {activeSection === 'recommendations' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
            <p className="text-sm text-gray-600 mt-1">
              Based on your quote analysis, here are our key recommendations
            </p>
          </div>
          <div className="p-6 space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className={`border rounded-lg p-4 ${getPriorityColor(rec.priority)}`}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getCategoryIcon(rec.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-semibold">{rec.title}</h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white bg-opacity-50">
                        {rec.priority} priority
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{rec.description}</p>
                    <div className="mt-3">
                      <h5 className="text-xs font-medium uppercase tracking-wide mb-2">Action Items:</h5>
                      <ul className="space-y-1">
                        {rec.actionItems.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start space-x-2 text-sm">
                            <span className="text-xs mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Negotiation Tips Section */}
      {activeSection === 'negotiation' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Negotiation Tips</h3>
            <p className="text-sm text-gray-600 mt-1">
              Expert advice on how to negotiate effectively with builders
            </p>
          </div>
          <div className="p-6 space-y-4">
            {negotiationTips.map((tip, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getCategoryIcon(tip.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-semibold text-gray-900 capitalize">
                        {tip.category} Negotiation
                      </h4>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{tip.tip}</p>
                    
                    {tip.example && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <h5 className="text-xs font-medium text-blue-800 mb-1">Example:</h5>
                        <p className="text-sm text-blue-700 italic">"{tip.example}"</p>
                      </div>
                    )}
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <h5 className="text-xs font-medium text-gray-700 mb-1">When to use:</h5>
                      <p className="text-sm text-gray-600">{tip.whenToUse}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions to Ask Section */}
      {activeSection === 'questions' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Questions to Ask Builders</h3>
            <p className="text-sm text-gray-600 mt-1">
              Essential questions organized by category to help you evaluate builders
            </p>
          </div>
          <div className="p-6 space-y-4">
            {questionsToAsk.map((category, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setExpandedCategory(
                    expandedCategory === category.category ? null : category.category
                  )}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 rounded-t-lg"
                >
                  <h4 className="text-sm font-semibold text-gray-900">{category.category}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {category.questions.length} question{category.questions.length !== 1 ? 's' : ''}
                    </span>
                    <svg
                      className={`h-5 w-5 text-gray-400 transform transition-transform ${
                        expandedCategory === category.category ? 'rotate-180' : ''
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>

                {expandedCategory === category.category && (
                  <div className="px-4 pb-4 space-y-3">
                    {category.questions.map((question, qIndex) => (
                      <div key={qIndex} className="border-l-4 border-blue-200 pl-4 py-2">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900 flex-1">
                            {question.question}
                          </p>
                          <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getImportanceColor(question.importance)}`}>
                            {question.importance}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{question.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};