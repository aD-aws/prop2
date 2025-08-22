'use client';

import React, { useState } from 'react';
import { 
  GanttChart as GanttChartType, 
  GanttTask, 
  TaskTimeline,
  ProjectType 
} from '../../lib/types';
import { 
  TimelineOptimizationRequest,
  TimelineConstraints,
  TimelinePreferences,
  OptimizationResult,
  timelineOptimizationService
} from '../../lib/services/timelineOptimizationService';
import { 
  Calendar, 
  Clock, 
  Settings, 
  RefreshCw, 
  Save, 
  AlertCircle,
  CheckCircle,
  Plus,
  Minus
} from 'lucide-react';

export interface TimelineModificationProps {
  projectId: string;
  projectType: ProjectType;
  currentGanttChart: GanttChartType;
  currentTasks: TaskTimeline[];
  onTimelineUpdated: (result: OptimizationResult) => void;
  onCancel: () => void;
}

interface TaskModification {
  taskId: string;
  originalDuration: number;
  newDuration: number;
  originalName: string;
  newName: string;
  reasonForChange: string;
}

export const TimelineModification: React.FC<TimelineModificationProps> = ({
  projectId,
  projectType,
  currentGanttChart,
  currentTasks,
  onTimelineUpdated,
  onCancel
}) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'constraints' | 'preferences'>('tasks');
  const [taskModifications, setTaskModifications] = useState<TaskModification[]>([]);
  const [constraints, setConstraints] = useState<TimelineConstraints>({
    workingDaysPerWeek: 5,
    excludedDates: []
  });
  const [preferences, setPreferences] = useState<TimelinePreferences>({
    prioritizeSpeed: false,
    prioritizeCost: false,
    minimizeDisruption: false,
    preferredWorkingHours: {
      start: '08:00',
      end: '17:00'
    }
  });
  const [regenerationResult, setRegenerationResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize task modifications from current tasks
  React.useEffect(() => {
    const initialModifications = currentTasks.map(task => ({
      taskId: task.id,
      originalDuration: task.duration,
      newDuration: task.duration,
      originalName: task.name,
      newName: task.name,
      reasonForChange: ''
    }));
    setTaskModifications(initialModifications);
  }, [currentTasks]);

  // Handle task duration change
  const handleTaskDurationChange = (taskId: string, newDuration: number) => {
    setTaskModifications(prev => 
      prev.map(mod => 
        mod.taskId === taskId 
          ? { ...mod, newDuration: Math.max(1, newDuration) }
          : mod
      )
    );
  };

  // Handle task name change
  const handleTaskNameChange = (taskId: string, newName: string) => {
    setTaskModifications(prev => 
      prev.map(mod => 
        mod.taskId === taskId 
          ? { ...mod, newName }
          : mod
      )
    );
  };

  // Handle reason for change
  const handleReasonChange = (taskId: string, reason: string) => {
    setTaskModifications(prev => 
      prev.map(mod => 
        mod.taskId === taskId 
          ? { ...mod, reasonForChange: reason }
          : mod
      )
    );
  };

  // Add excluded date
  const addExcludedDate = () => {
    const newDate = new Date();
    setConstraints(prev => ({
      ...prev,
      excludedDates: [...(prev.excludedDates || []), newDate]
    }));
  };

  // Remove excluded date
  const removeExcludedDate = (index: number) => {
    setConstraints(prev => ({
      ...prev,
      excludedDates: prev.excludedDates?.filter((_, i) => i !== index) || []
    }));
  };

  // Update excluded date
  const updateExcludedDate = (index: number, date: Date) => {
    setConstraints(prev => ({
      ...prev,
      excludedDates: prev.excludedDates?.map((d, i) => i === index ? date : d) || []
    }));
  };

  // Regenerate timeline
  const handleRegenerateTimeline = async () => {
    setIsRegenerating(true);
    setError(null);

    try {
      // Prepare modified tasks
      const modifiedTasks = currentTasks.map(task => {
        const modification = taskModifications.find(mod => mod.taskId === task.id);
        if (!modification) return task;

        return {
          ...task,
          name: modification.newName,
          duration: modification.newDuration
        };
      });

      // Create optimization request
      const request: TimelineOptimizationRequest = {
        projectId,
        projectType,
        tasks: modifiedTasks,
        laborRequirements: [], // Would be fetched from project data
        constraints,
        userPreferences: preferences
      };

      // Call optimization service
      const result = await timelineOptimizationService.regenerateTimeline(request, {
        taskModifications: taskModifications
          .filter(mod => 
            mod.newDuration !== mod.originalDuration || 
            mod.newName !== mod.originalName
          )
          .map(mod => ({
            id: mod.taskId,
            name: mod.newName,
            duration: mod.newDuration
          })),
        constraintChanges: constraints,
        preferenceChanges: preferences
      });

      setRegenerationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate timeline');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Apply changes
  const handleApplyChanges = () => {
    if (regenerationResult) {
      onTimelineUpdated(regenerationResult);
    }
  };

  // Get modified tasks count
  const modifiedTasksCount = taskModifications.filter(mod => 
    mod.newDuration !== mod.originalDuration || 
    mod.newName !== mod.originalName
  ).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Modify Timeline</h2>
            <p className="text-sm text-gray-600 mt-1">
              Adjust tasks, constraints, and preferences to optimize your project timeline
            </p>
          </div>
          <div className="flex items-center gap-3">
            {modifiedTasksCount > 0 && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                {modifiedTasksCount} changes
              </span>
            )}
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'tasks', label: 'Tasks', icon: Clock },
            { id: 'constraints', label: 'Constraints', icon: Calendar },
            { id: 'preferences', label: 'Preferences', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Task Modifications</h3>
              <p className="text-sm text-gray-600">
                Adjust task durations and names as needed
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {taskModifications.map(modification => {
                const hasChanges = 
                  modification.newDuration !== modification.originalDuration ||
                  modification.newName !== modification.originalName;

                return (
                  <div 
                    key={modification.taskId}
                    className={`p-4 border rounded-lg ${
                      hasChanges ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Task Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Task Name
                        </label>
                        <input
                          type="text"
                          value={modification.newName}
                          onChange={(e) => handleTaskNameChange(modification.taskId, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (days)
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTaskDurationChange(
                              modification.taskId, 
                              modification.newDuration - 1
                            )}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={modification.newDuration}
                            onChange={(e) => handleTaskDurationChange(
                              modification.taskId, 
                              parseInt(e.target.value) || 1
                            )}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleTaskDurationChange(
                              modification.taskId, 
                              modification.newDuration + 1
                            )}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {modification.newDuration !== modification.originalDuration && (
                            <span className="text-sm text-blue-600">
                              (was {modification.originalDuration})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reason for Change */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason for Change
                        </label>
                        <input
                          type="text"
                          placeholder="Optional reason..."
                          value={modification.reasonForChange}
                          onChange={(e) => handleReasonChange(modification.taskId, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'constraints' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Constraints</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Working Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Days per Week
                  </label>
                  <select
                    value={constraints.workingDaysPerWeek}
                    onChange={(e) => setConstraints(prev => ({
                      ...prev,
                      workingDaysPerWeek: parseInt(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5 days (Mon-Fri)</option>
                    <option value={6}>6 days (Mon-Sat)</option>
                    <option value={7}>7 days (Every day)</option>
                  </select>
                </div>

                {/* Max Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Project Duration (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={constraints.maxDuration || ''}
                    onChange={(e) => setConstraints(prev => ({
                      ...prev,
                      maxDuration: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    placeholder="No limit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Start Date
                  </label>
                  <input
                    type="date"
                    value={constraints.availableStartDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setConstraints(prev => ({
                      ...prev,
                      availableStartDate: e.target.value ? new Date(e.target.value) : undefined
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Required End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required End Date
                  </label>
                  <input
                    type="date"
                    value={constraints.requiredEndDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setConstraints(prev => ({
                      ...prev,
                      requiredEndDate: e.target.value ? new Date(e.target.value) : undefined
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Excluded Dates */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Excluded Dates (holidays, unavailable periods)
                </label>
                <button
                  onClick={addExcludedDate}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-4 h-4" />
                  Add Date
                </button>
              </div>
              
              <div className="space-y-2">
                {constraints.excludedDates?.map((date, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="date"
                      value={date.toISOString().split('T')[0]}
                      onChange={(e) => updateExcludedDate(index, new Date(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeExcludedDate(index)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {(!constraints.excludedDates || constraints.excludedDates.length === 0) && (
                  <p className="text-sm text-gray-500 italic">No excluded dates</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Optimization Preferences</h3>
              
              <div className="space-y-4">
                {/* Priority Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={preferences.prioritizeSpeed || false}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        prioritizeSpeed: e.target.checked
                      }))}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <span className="font-medium">Prioritize Speed</span>
                      <p className="text-sm text-gray-600">Minimize total project duration</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={preferences.prioritizeCost || false}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        prioritizeCost: e.target.checked
                      }))}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <span className="font-medium">Prioritize Cost</span>
                      <p className="text-sm text-gray-600">Minimize labor costs through efficient scheduling</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={preferences.minimizeDisruption || false}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        minimizeDisruption: e.target.checked
                      }))}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <span className="font-medium">Minimize Disruption</span>
                      <p className="text-sm text-gray-600">Group disruptive work together</p>
                    </div>
                  </label>
                </div>

                {/* Working Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preferred Working Hours
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={preferences.preferredWorkingHours?.start || '08:00'}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          preferredWorkingHours: {
                            ...prev.preferredWorkingHours,
                            start: e.target.value,
                            end: prev.preferredWorkingHours?.end || '17:00'
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">End Time</label>
                      <input
                        type="time"
                        value={preferences.preferredWorkingHours?.end || '17:00'}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          preferredWorkingHours: {
                            ...prev.preferredWorkingHours,
                            start: prev.preferredWorkingHours?.start || '08:00',
                            end: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Regeneration Result */}
      {regenerationResult && (
        <div className="mx-6 mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 mb-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Timeline Optimized</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Original Duration:</span>
              <div className="font-medium">{regenerationResult.originalDuration} days</div>
            </div>
            <div>
              <span className="text-gray-600">Optimized Duration:</span>
              <div className="font-medium">{regenerationResult.optimizedDuration} days</div>
            </div>
            <div>
              <span className="text-gray-600">Time Saved:</span>
              <div className="font-medium text-green-600">
                {regenerationResult.timeSaved} days
              </div>
            </div>
            <div>
              <span className="text-gray-600">Parallel Opportunities:</span>
              <div className="font-medium">
                {regenerationResult.parallelWorkOpportunities.length}
              </div>
            </div>
          </div>

          {regenerationResult.recommendations.length > 0 && (
            <div className="mt-3">
              <span className="text-gray-600 text-sm">Key Recommendations:</span>
              <ul className="mt-1 space-y-1">
                {regenerationResult.recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    • {rec.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {modifiedTasksCount > 0 && (
              <span>{modifiedTasksCount} task(s) modified</span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRegenerateTimeline}
              disabled={isRegenerating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Regenerating...' : 'Regenerate Timeline'}
            </button>
            
            {regenerationResult && (
              <button
                onClick={handleApplyChanges}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Save className="w-4 h-4" />
                Apply Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};