'use client';

import React, { useState } from 'react';
import { BuilderLeadPriority, ProjectType } from '../../lib/types';
import { builderPrioritizationService } from '../../lib/services/builderPrioritizationService';

interface LeadDistributionDashboardProps {
  onDistributeLeads?: (projectId: string, builders: BuilderLeadPriority[]) => void;
}

export const LeadDistributionDashboard: React.FC<LeadDistributionDashboardProps> = ({
  onDistributeLeads = () => {}
}) => {
  const [testPostcode, setTestPostcode] = useState('SW1A 1AA');
  const [testProjectType, setTestProjectType] = useState<ProjectType>('kitchen_full_refit');
  const [prioritizedBuilders, setPrioritizedBuilders] = useState<BuilderLeadPriority[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBuilder, setSelectedBuilder] = useState<string | null>(null);
  const [priorityExplanation, setPriorityExplanation] = useState<Record<string, unknown> | null>(null);

  const projectTypes: { value: ProjectType; label: string }[] = [
    { value: 'kitchen_full_refit', label: 'Kitchen Full Refit' },
    { value: 'bathroom_full_refit', label: 'Bathroom Full Refit' },
    { value: 'loft_conversion_dormer', label: 'Loft Conversion (Dormer)' },
    { value: 'rear_extension_single_storey', label: 'Rear Extension (Single Storey)' },
    { value: 'electrical_rewiring', label: 'Electrical Rewiring' },
    { value: 'plumbing_bathroom', label: 'Plumbing (Bathroom)' },
    { value: 'roofing_re_roofing', label: 'Re-roofing' },
    { value: 'flooring_hardwood_solid', label: 'Hardwood Flooring' }
  ];

  const testPrioritization = async () => {
    setIsLoading(true);
    try {
      const builders = await builderPrioritizationService.getPrioritizedBuilders(
        testPostcode,
        testProjectType,
        10
      );
      setPrioritizedBuilders(builders);
    } catch (error) {
      console.error('Error testing prioritization:', error);
      alert('Failed to test prioritization');
    } finally {
      setIsLoading(false);
    }
  };

  const showPriorityExplanation = async (builderId: string) => {
    try {
      const explanation = await builderPrioritizationService.getBuilderPriorityExplanation(builderId);
      setPriorityExplanation(explanation);
      setSelectedBuilder(builderId);
    } catch (error) {
      console.error('Error getting priority explanation:', error);
      alert('Failed to get priority explanation');
    }
  };

  const PriorityBar: React.FC<{ score: number; maxScore: number; label: string }> = ({ 
    score, 
    maxScore, 
    label 
  }) => {
    const percentage = (score / maxScore) * 100;
    
    return (
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span>{label}</span>
          <span>{score}/{maxScore}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Lead Distribution System
        </h2>

        {/* Test Controls */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Test Builder Prioritization
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postcode
              </label>
              <input
                type="text"
                value={testPostcode}
                onChange={(e) => setTestPostcode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SW1A 1AA"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type
              </label>
              <select
                value={testProjectType}
                onChange={(e) => setTestProjectType(e.target.value as ProjectType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projectTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={testPrioritization}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Testing...' : 'Test Prioritization'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {prioritizedBuilders.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Prioritized Builders (Top {prioritizedBuilders.length})
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Builder ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reviews
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Response Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acceptance Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prioritizedBuilders.map((builder, index) => (
                    <tr key={builder.builderId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {builder.builderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {builder.priority}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex text-yellow-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={star <= Math.round(builder.rating) ? '' : 'text-gray-300'}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {builder.rating.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {builder.totalReviews}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {builder.responseTime}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {builder.acceptanceRate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => showPriorityExplanation(builder.builderId)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Explain Score
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Priority Explanation Modal */}
        {selectedBuilder && priorityExplanation && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Priority Score Breakdown
                </h3>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {(priorityExplanation as any)?.totalScore}
                  </div>
                  <div className="text-sm text-gray-600">Total Priority Score</div>
                </div>
                
                <div className="space-y-3">
                  <PriorityBar 
                    score={(priorityExplanation as any)?.breakdown?.rating || 0} 
                    maxScore={50} 
                    label="Rating & Reviews" 
                  />
                  <PriorityBar 
                    score={(priorityExplanation as any)?.breakdown?.responseTime || 0} 
                    maxScore={20} 
                    label="Response Time" 
                  />
                  <PriorityBar 
                    score={(priorityExplanation as any)?.breakdown?.acceptanceRate || 0} 
                    maxScore={15} 
                    label="Acceptance Rate" 
                  />
                  <PriorityBar 
                    score={(priorityExplanation as any)?.breakdown?.completionRate || 0} 
                    maxScore={15} 
                    label="Completion Rate" 
                  />
                  <PriorityBar 
                    score={(priorityExplanation as any)?.breakdown?.activity || 0} 
                    maxScore={10} 
                    label="Recent Activity" 
                  />
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setSelectedBuilder(null);
                      setPriorityExplanation(null);
                    }}
                    className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lead Distribution Statistics */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Lead Distribution Statistics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">1,247</div>
            <div className="text-sm text-gray-600">Total Leads Distributed</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">78%</div>
            <div className="text-sm text-gray-600">Average Acceptance Rate</div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">14h</div>
            <div className="text-sm text-gray-600">Average Response Time</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">4.3</div>
            <div className="text-sm text-gray-600">Average Builder Rating</div>
          </div>
        </div>
      </div>
    </div>
  );
};