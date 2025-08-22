'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { GanttChart as GanttChartType, GanttTask } from '../../lib/types';
import { Calendar, Clock, Users, AlertTriangle, CheckCircle } from 'lucide-react';

export interface GanttChartProps {
  ganttChart: GanttChartType;
  onTaskClick?: (task: GanttTask) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<GanttTask>) => void;
  showCriticalPath?: boolean;
  showProgress?: boolean;
  interactive?: boolean;
  height?: number;
}

interface GanttChartData {
  taskId: string;
  taskName: string;
  trade: string;
  startDay: number;
  duration: number;
  endDay: number;
  progress: number;
  isCritical: boolean;
  dependencies: string[];
  startDate: Date;
  endDate: Date;
}

const TRADE_COLORS: Record<string, string> = {
  'structural': '#8B5CF6',
  'electrical': '#F59E0B',
  'plumbing': '#3B82F6',
  'heating': '#EF4444',
  'flooring': '#10B981',
  'decorating': '#F97316',
  'roofing': '#6B7280',
  'windows': '#06B6D4',
  'doors': '#84CC16',
  'kitchen': '#EC4899',
  'bathroom': '#14B8A6',
  'landscaping': '#22C55E',
  'general': '#64748B'
};

const CRITICAL_PATH_COLOR = '#DC2626';
const COMPLETED_COLOR = '#059669';
const IN_PROGRESS_COLOR = '#D97706';

export const GanttChart: React.FC<GanttChartProps> = ({
  ganttChart,
  onTaskClick,
  onTaskUpdate,
  showCriticalPath = true,
  showProgress = true,
  interactive = true,
  height = 600
}) => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'days' | 'weeks'>('days');
  const [showDependencies, setShowDependencies] = useState(false);

  // Transform Gantt data for Recharts
  const chartData = useMemo(() => {
    const projectStartDate = new Date(Math.min(...ganttChart.tasks.map(t => t.startDate.getTime())));
    
    return ganttChart.tasks.map((task): GanttChartData => {
      const startDay = Math.ceil((task.startDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const endDay = Math.ceil((task.endDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        taskId: task.id,
        taskName: task.name.length > 30 ? `${task.name.substring(0, 30)}...` : task.name,
        trade: task.trade,
        startDay,
        duration: task.duration,
        endDay,
        progress: task.progress,
        isCritical: ganttChart.criticalPath.includes(task.id),
        dependencies: task.dependencies,
        startDate: task.startDate,
        endDate: task.endDate
      };
    }).sort((a, b) => a.startDay - b.startDay);
  }, [ganttChart]);

  // Calculate project timeline info
  const projectInfo = useMemo(() => {
    const startDate = new Date(Math.min(...ganttChart.tasks.map(t => t.startDate.getTime())));
    const endDate = new Date(Math.max(...ganttChart.tasks.map(t => t.endDate.getTime())));
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      startDate,
      endDate,
      totalDays,
      totalTasks: ganttChart.tasks.length,
      criticalPathTasks: ganttChart.criticalPath.length,
      completedTasks: ganttChart.tasks.filter(t => t.progress === 100).length,
      inProgressTasks: ganttChart.tasks.filter(t => t.progress > 0 && t.progress < 100).length
    };
  }, [ganttChart]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as GanttChartData;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-2">{data.taskName}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span>Trade: {data.trade}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>Duration: {data.duration} days</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>Start: {data.startDate.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>End: {data.endDate.toLocaleDateString()}</span>
            </div>
            {showProgress && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gray-500" />
                <span>Progress: {data.progress}%</span>
              </div>
            )}
            {data.isCritical && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span>Critical Path Task</span>
              </div>
            )}
            {data.dependencies.length > 0 && (
              <div className="mt-2">
                <span className="text-gray-600">Dependencies: {data.dependencies.length}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Get bar color based on task status and type
  const getBarColor = (data: GanttChartData) => {
    if (showCriticalPath && data.isCritical) {
      return CRITICAL_PATH_COLOR;
    }
    
    if (showProgress) {
      if (data.progress === 100) return COMPLETED_COLOR;
      if (data.progress > 0) return IN_PROGRESS_COLOR;
    }
    
    return TRADE_COLORS[data.trade] || TRADE_COLORS.general;
  };

  // Handle task click
  const handleTaskClick = (data: any) => {
    if (!interactive) return;
    
    // Extract the payload data from the recharts click event
    const chartData = data?.payload as GanttChartData;
    if (!chartData) return;
    
    setSelectedTask(chartData.taskId);
    const task = ganttChart.tasks.find(t => t.id === chartData.taskId);
    if (task && onTaskClick) {
      onTaskClick(task);
    }
  };

  // Generate X-axis ticks based on view mode
  const generateXAxisTicks = () => {
    const ticks = [];
    const maxDay = Math.max(...chartData.map(d => d.endDay));
    
    if (viewMode === 'days') {
      for (let i = 0; i <= maxDay; i += Math.ceil(maxDay / 20)) {
        ticks.push(i);
      }
    } else {
      for (let i = 0; i <= maxDay; i += 7) {
        ticks.push(i);
      }
    }
    
    return ticks;
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Project Timeline</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('days')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'days' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Days
              </button>
              <button
                onClick={() => setViewMode('weeks')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'weeks' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Weeks
              </button>
            </div>
            
            {interactive && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showDependencies}
                    onChange={(e) => setShowDependencies(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Show Dependencies
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Project Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>Duration: {projectInfo.totalDays} days</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span>Tasks: {projectInfo.totalTasks}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>Critical: {projectInfo.criticalPathTasks}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Completed: {projectInfo.completedTasks}</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm">
          {Object.entries(TRADE_COLORS).map(([trade, color]) => {
            const hasTradeTask = chartData.some(d => d.trade === trade);
            if (!hasTradeTask) return null;
            
            return (
              <div key={trade} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="capitalize">{trade}</span>
              </div>
            );
          })}
          
          {showCriticalPath && (
            <div className="flex items-center gap-2 ml-4">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: CRITICAL_PATH_COLOR }}
              />
              <span>Critical Path</span>
            </div>
          )}
          
          {showProgress && (
            <>
              <div className="flex items-center gap-2 ml-4">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: COMPLETED_COLOR }}
                />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: IN_PROGRESS_COLOR }}
                />
                <span>In Progress</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="p-4">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
            layout="horizontal"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              domain={[0, 'dataMax']}
              ticks={generateXAxisTicks()}
              tickFormatter={(value) => {
                if (viewMode === 'weeks') {
                  return `Week ${Math.ceil(value / 7)}`;
                }
                return `Day ${value}`;
              }}
            />
            <YAxis 
              type="category" 
              dataKey="taskName"
              width={90}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Task bars */}
            <Bar 
              dataKey="duration" 
              onClick={handleTaskClick}
              cursor={interactive ? 'pointer' : 'default'}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry)}
                  stroke={selectedTask === entry.taskId ? '#1F2937' : 'none'}
                  strokeWidth={selectedTask === entry.taskId ? 2 : 0}
                />
              ))}
            </Bar>
            
            {/* Progress overlay bars */}
            {showProgress && (
              <Bar 
                dataKey={(data: GanttChartData) => (data.duration * data.progress) / 100}
                fill="rgba(0, 0, 0, 0.3)"
              />
            )}
            
            {/* Critical path reference lines */}
            {showCriticalPath && ganttChart.criticalPath.map((taskId, index) => {
              const task = chartData.find(d => d.taskId === taskId);
              if (!task) return null;
              
              return (
                <ReferenceLine 
                  key={`critical-${index}`}
                  y={task.taskName}
                  stroke={CRITICAL_PATH_COLOR}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Task Details Panel */}
      {selectedTask && interactive && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {(() => {
            const task = ganttChart.tasks.find(t => t.id === selectedTask);
            const taskData = chartData.find(d => d.taskId === selectedTask);
            
            if (!task || !taskData) return null;
            
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{task.name}</h3>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Trade:</span>
                    <div className="font-medium">{task.trade}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <div className="font-medium">{task.duration} days</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Start Date:</span>
                    <div className="font-medium">{task.startDate.toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">End Date:</span>
                    <div className="font-medium">{task.endDate.toLocaleDateString()}</div>
                  </div>
                </div>
                
                {task.dependencies.length > 0 && (
                  <div>
                    <span className="text-gray-600 text-sm">Dependencies:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {task.dependencies.map(depId => {
                        const depTask = ganttChart.tasks.find(t => t.id === depId);
                        return (
                          <span 
                            key={depId}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                          >
                            {depTask?.name || depId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {taskData.isCritical && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>This task is on the critical path - delays will affect project completion</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};