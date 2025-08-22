'use client';

import React, { useState, useEffect } from 'react';
import { 
  GanttChart as GanttChartType, 
  GanttTask, 
  TaskTimeline,
  ProjectType,
  Project
} from '../../lib/types';
import { 
  OptimizationResult,
  ParallelWorkGroup,
  OptimizationRecommendation,
  timelineOptimizationService
} from '../../lib/services/timelineOptimizationService';
import { GanttChart } from './GanttChart';
import { TimelineModification } from './TimelineModification';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Edit3,
  Download,
  Share2,
  BarChart3,
  Zap
} from 'lucide-react';

export interface TimelineDashboardProps {
  project: Project;
  onProjectUpdate?: (updates: Partial<Project>) => void;
}

export const TimelineDashboard: React.FC<TimelineDashboardProps> = ({
  project,
  onProjectUpdate
}) => {
  const [isModifying, setIsModifying] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<OptimizationRecommendation | null>(null);
  const [showParallelWork, setShowParallelWork] = useState(false);

  // Initialize optimization on component mount
  useEffect(() => {
    if (project.sowDocument && project.ganttChart) {
      initializeOptimization();
    }
  }, [project]);

  const initializeOptimization = async () => {
    if (!project.sowDocument || !project.ganttChart) return;

    setIsOptimizing(true);
    try {
      const result = await timelineOptimizationService.optimizeTimeline({
        projectId: project.id,
        projectType: project.projectType,
        tasks: project.sowDocument.timeline,
        laborRequirements: project.sowDocument.laborRequirements,
        constraints: {
          workingDaysPerWeek: 5,
          availableStartDate: project.timeline.estimatedStartDate
        },
        userPreferences: {
          prioritizeSpeed: true
        }
      });
      
      setOptimizationResult(result);
    } catch (error) {
      console.error('Failed to optimize timeline:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleTimelineUpdated = (result: OptimizationResult) => {
    setOptimizationResult(result);
    setIsModifying(false);
    
    // Update project with new timeline
    if (onProjectUpdate) {
      onProjectUpdate({
        ganttChart: result.ganttChart,
        timeline: {
          ...project.timeline,
          estimatedEndDate: new Date(
            Math.max(...result.ganttChart.tasks.map(t => t.endDate.getTime()))
          )
        }
      });
    }
  };

  const handleTaskClick = (task: GanttTask) => {
    console.log('Task clicked:', task);
    // Could open task details modal or navigate to task page
  };

  const handleExportTimeline = () => {
    // Export timeline as PDF or image
    console.log('Exporting timeline...');
  };

  const handleShareTimeline = () => {
    // Share timeline with builders or stakeholders
    console.log('Sharing timeline...');
  };

  if (!project.ganttChart) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeline Available</h3>
        <p className="text-gray-600">
          Generate a Scope of Work first to create your project timeline.
        </p>
      </div>
    );
  }

  const currentGantt = optimizationResult?.ganttChart || project.ganttChart;
  const currentTasks = project.sowDocument?.timeline || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Timeline</h1>
            <p className="text-gray-600 mt-1">
              Optimized schedule with critical path analysis and parallel work opportunities
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModifying(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Edit3 className="w-4 h-4" />
              Modify Timeline
            </button>
            
            <button
              onClick={handleExportTimeline}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            
            <button
              onClick={handleShareTimeline}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* Timeline Stats */}
        {optimizationResult && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Duration</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {optimizationResult.optimizedDuration}
                <span className="text-sm font-normal ml-1">days</span>
              </div>
              {optimizationResult.timeSaved > 0 && (
                <div className="text-xs text-green-600 mt-1">
                  {optimizationResult.timeSaved} days saved
                </div>
              )}
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Parallel Work</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {optimizationResult.parallelWorkOpportunities.length}
                <span className="text-sm font-normal ml-1">groups</span>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Critical Path</span>
              </div>
              <div className="text-2xl font-bold text-red-900">
                {optimizationResult.criticalPath.length}
                <span className="text-sm font-normal ml-1">tasks</span>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-purple-700 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Efficiency</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {Math.round((optimizationResult.timeSaved / optimizationResult.originalDuration) * 100)}
                <span className="text-sm font-normal ml-1">%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Optimization Recommendations */}
      {optimizationResult && optimizationResult.recommendations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Optimization Recommendations</h2>
          
          <div className="space-y-3">
            {optimizationResult.recommendations.map((recommendation, index) => (
              <div 
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedRecommendation === recommendation
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRecommendation(
                  selectedRecommendation === recommendation ? null : recommendation
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        recommendation.priority === 'high' 
                          ? 'bg-red-100 text-red-700'
                          : recommendation.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {recommendation.priority} priority
                      </span>
                      <span className="text-sm text-gray-600 capitalize">
                        {recommendation.type.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <h3 className="font-medium text-gray-900 mb-1">
                      {recommendation.description}
                    </h3>
                    
                    <p className="text-sm text-gray-600">
                      Impact: {recommendation.impact}
                    </p>
                    
                    {selectedRecommendation === recommendation && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <h4 className="font-medium text-gray-900 mb-2">Implementation:</h4>
                        <p className="text-sm text-gray-700">{recommendation.implementation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parallel Work Opportunities */}
      {optimizationResult && optimizationResult.parallelWorkOpportunities.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Parallel Work Opportunities</h2>
            <button
              onClick={() => setShowParallelWork(!showParallelWork)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {showParallelWork ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          {showParallelWork && (
            <div className="space-y-4">
              {optimizationResult.parallelWorkOpportunities.map((group, index) => (
                <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{group.name}</h3>
                    <span className="text-sm text-gray-600">
                      {group.duration} days • {group.trades.length} trades
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tasks:</span>
                      <div className="mt-1">
                        {group.tasks.map(taskId => {
                          const task = currentTasks.find(t => t.id === taskId);
                          return (
                            <div key={taskId} className="text-gray-900">
                              • {task?.name || taskId}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Requirements:</span>
                      <div className="mt-1">
                        {group.requirements.map((req, reqIndex) => (
                          <div key={reqIndex} className="text-gray-900">
                            • {req}
                          </div>
                        ))}
                      </div>
                      
                      {group.conflicts && group.conflicts.length > 0 && (
                        <div className="mt-2">
                          <span className="text-red-600">Potential Conflicts:</span>
                          <div className="mt-1">
                            {group.conflicts.map((conflict, conflictIndex) => (
                              <div key={conflictIndex} className="text-red-700 text-xs">
                                ⚠ {conflict}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gantt Chart */}
      <div className="bg-white rounded-lg border border-gray-200">
        {isOptimizing ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Optimizing timeline...</p>
          </div>
        ) : (
          <GanttChart
            ganttChart={currentGantt}
            onTaskClick={handleTaskClick}
            showCriticalPath={true}
            showProgress={true}
            interactive={true}
            height={500}
          />
        )}
      </div>

      {/* Timeline Modification Modal */}
      {isModifying && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <TimelineModification
              projectId={project.id}
              projectType={project.projectType}
              currentGanttChart={currentGantt}
              currentTasks={currentTasks}
              onTimelineUpdated={handleTimelineUpdated}
              onCancel={() => setIsModifying(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};