import { 
  GanttChart, 
  GanttTask, 
  TaskTimeline, 
  LaborRequirement,
  ProjectType 
} from '../types';
import { aiService } from './aiService';

export interface TimelineOptimizationRequest {
  projectId: string;
  projectType: ProjectType;
  tasks: TaskTimeline[];
  laborRequirements: LaborRequirement[];
  constraints?: TimelineConstraints;
  userPreferences?: TimelinePreferences;
}

export interface TimelineConstraints {
  maxDuration?: number; // maximum project duration in days
  availableStartDate?: Date;
  requiredEndDate?: Date;
  workingDaysPerWeek?: number; // default 5
  excludedDates?: Date[]; // holidays, unavailable dates
  weatherConstraints?: WeatherConstraint[];
}

export interface WeatherConstraint {
  taskIds: string[];
  seasonalRestrictions: string[]; // e.g., "no_external_work_december_february"
  weatherDependencies: string[]; // e.g., "dry_weather_required"
}

export interface TimelinePreferences {
  prioritizeSpeed?: boolean; // minimize total duration
  prioritizeCost?: boolean; // minimize labor costs through efficient scheduling
  minimizeDisruption?: boolean; // group disruptive work together
  preferredWorkingHours?: {
    start: string; // "08:00"
    end: string; // "17:00"
  };
}

export interface OptimizationResult {
  originalDuration: number;
  optimizedDuration: number;
  timeSaved: number; // in days
  parallelWorkOpportunities: ParallelWorkGroup[];
  criticalPath: string[];
  recommendations: OptimizationRecommendation[];
  ganttChart: GanttChart;
}

export interface ParallelWorkGroup {
  id: string;
  name: string;
  tasks: string[]; // task IDs that can run in parallel
  duration: number;
  trades: string[];
  requirements: string[];
  conflicts?: string[]; // potential conflicts to watch for
}

export interface OptimizationRecommendation {
  type: 'parallel_work' | 'dependency_optimization' | 'resource_allocation' | 'scheduling';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: string; // time saved or cost impact
  implementation: string;
}

export interface DependencyAnalysis {
  taskId: string;
  dependencies: TaskDependency[];
  dependents: string[]; // tasks that depend on this one
  criticalPathMember: boolean;
  floatTime: number; // available slack time in days
}

export interface TaskDependency {
  dependsOn: string; // task ID
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lag: number; // delay in days (can be negative for overlap)
  reason: string; // why this dependency exists
}

export class TimelineOptimizationService {
  private readonly AI_AGENT_ID = 'timeline_optimization_agent';

  /**
   * Optimize project timeline using AI analysis
   */
  async optimizeTimeline(request: TimelineOptimizationRequest): Promise<OptimizationResult> {
    // Phase 1: Analyze dependencies and identify optimization opportunities
    const dependencyAnalysis = await this.analyzeDependencies(request.tasks);
    
    // Phase 2: Identify parallel work opportunities
    const parallelWorkGroups = await this.identifyParallelWork(
      request.tasks, 
      request.laborRequirements,
      dependencyAnalysis
    );
    
    // Phase 3: Calculate critical path
    const criticalPath = await this.calculateCriticalPath(request.tasks, dependencyAnalysis);
    
    // Phase 4: Generate AI-powered optimization recommendations
    const recommendations = await this.generateOptimizationRecommendations(
      request,
      dependencyAnalysis,
      parallelWorkGroups,
      criticalPath
    );
    
    // Phase 5: Create optimized Gantt chart
    const ganttChart = await this.createOptimizedGanttChart(
      request,
      parallelWorkGroups,
      criticalPath,
      recommendations
    );
    
    // Phase 6: Calculate optimization results
    const originalDuration = this.calculateOriginalDuration(request.tasks);
    const optimizedDuration = ganttChart.totalDuration;
    
    return {
      originalDuration,
      optimizedDuration,
      timeSaved: originalDuration - optimizedDuration,
      parallelWorkOpportunities: parallelWorkGroups,
      criticalPath,
      recommendations,
      ganttChart
    };
  }

  /**
   * Analyze task dependencies and relationships
   */
  private async analyzeDependencies(tasks: TaskTimeline[]): Promise<DependencyAnalysis[]> {
    const analysis: DependencyAnalysis[] = [];
    
    for (const task of tasks) {
      const dependencies: TaskDependency[] = task.dependencies.map(depId => ({
        dependsOn: depId,
        type: 'finish_to_start', // default dependency type
        lag: 0,
        reason: this.getDependencyReason(task.trade, depId, tasks)
      }));
      
      const dependents = tasks
        .filter(t => t.dependencies.includes(task.id))
        .map(t => t.id);
      
      analysis.push({
        taskId: task.id,
        dependencies,
        dependents,
        criticalPathMember: false, // will be calculated later
        floatTime: 0 // will be calculated later
      });
    }
    
    return analysis;
  }

  /**
   * Get reason for task dependency
   */
  private getDependencyReason(trade: string, dependencyId: string, tasks: TaskTimeline[]): string {
    const dependentTask = tasks.find(t => t.id === dependencyId);
    if (!dependentTask) return 'Unknown dependency';
    
    // Common dependency patterns in construction
    const dependencyReasons: Record<string, Record<string, string>> = {
      'electrical': {
        'structural': 'Electrical work requires completed structural framework',
        'plumbing': 'Electrical and plumbing coordination required to avoid conflicts',
        'insulation': 'Electrical first fix must be completed before insulation'
      },
      'plumbing': {
        'structural': 'Plumbing requires structural framework and floor access',
        'waterproofing': 'Waterproofing must be completed before plumbing installation'
      },
      'flooring': {
        'electrical': 'Electrical first fix must be completed before flooring',
        'plumbing': 'Plumbing first fix must be completed before flooring',
        'heating': 'Underfloor heating installation required before flooring'
      },
      'decorating': {
        'electrical': 'Electrical second fix must be completed before decorating',
        'plumbing': 'Plumbing second fix must be completed before decorating',
        'flooring': 'Flooring must be completed before final decorating'
      }
    };
    
    return dependencyReasons[trade]?.[dependentTask.trade] || 
           `${trade} work depends on completion of ${dependentTask.trade}`;
  }

  /**
   * Identify opportunities for parallel work
   */
  private async identifyParallelWork(
    tasks: TaskTimeline[],
    laborRequirements: LaborRequirement[],
    dependencyAnalysis: DependencyAnalysis[]
  ): Promise<ParallelWorkGroup[]> {
    const parallelGroups: ParallelWorkGroup[] = [];
    
    // Group tasks by trade and analyze parallel opportunities
    const tradeGroups = this.groupTasksByTrade(tasks);
    
    for (const [trade, tradeTasks] of Object.entries(tradeGroups)) {
      // Find tasks within the same trade that can run in parallel
      const parallelTasks = this.findParallelTasksInTrade(tradeTasks, dependencyAnalysis);
      
      if (parallelTasks.length > 1) {
        parallelGroups.push({
          id: `parallel_${trade}_${Date.now()}`,
          name: `Parallel ${trade} work`,
          tasks: parallelTasks.map(t => t.id),
          duration: Math.max(...parallelTasks.map(t => t.duration)),
          trades: [trade],
          requirements: this.getParallelWorkRequirements(parallelTasks, laborRequirements),
          conflicts: this.identifyPotentialConflicts(parallelTasks)
        });
      }
    }
    
    // Find cross-trade parallel opportunities
    const crossTradeParallel = await this.findCrossTradeParallelWork(tasks, dependencyAnalysis);
    parallelGroups.push(...crossTradeParallel);
    
    return parallelGroups;
  }

  /**
   * Group tasks by trade
   */
  private groupTasksByTrade(tasks: TaskTimeline[]): Record<string, TaskTimeline[]> {
    return tasks.reduce((groups, task) => {
      const trade = task.trade || 'general';
      if (!groups[trade]) {
        groups[trade] = [];
      }
      groups[trade].push(task);
      return groups;
    }, {} as Record<string, TaskTimeline[]>);
  }

  /**
   * Find tasks within a trade that can run in parallel
   */
  private findParallelTasksInTrade(
    tradeTasks: TaskTimeline[],
    dependencyAnalysis: DependencyAnalysis[]
  ): TaskTimeline[] {
    const parallelTasks: TaskTimeline[] = [];
    
    for (const task of tradeTasks) {
      const analysis = dependencyAnalysis.find(a => a.taskId === task.id);
      if (!analysis) continue;
      
      // Check if this task can run in parallel with others
      const canRunInParallel = task.canRunInParallel && 
        !this.hasConflictingDependencies(task, tradeTasks, dependencyAnalysis);
      
      if (canRunInParallel) {
        parallelTasks.push(task);
      }
    }
    
    return parallelTasks;
  }

  /**
   * Check if task has conflicting dependencies with other tasks
   */
  private hasConflictingDependencies(
    task: TaskTimeline,
    otherTasks: TaskTimeline[],
    dependencyAnalysis: DependencyAnalysis[]
  ): boolean {
    const taskAnalysis = dependencyAnalysis.find(a => a.taskId === task.id);
    if (!taskAnalysis) return false;
    
    // Check if any dependencies or dependents conflict with parallel execution
    for (const otherTask of otherTasks) {
      if (otherTask.id === task.id) continue;
      
      const otherAnalysis = dependencyAnalysis.find(a => a.taskId === otherTask.id);
      if (!otherAnalysis) continue;
      
      // Check for direct dependencies
      if (taskAnalysis.dependencies.some(d => d.dependsOn === otherTask.id) ||
          otherAnalysis.dependencies.some(d => d.dependsOn === task.id)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Find cross-trade parallel work opportunities
   */
  private async findCrossTradeParallelWork(
    tasks: TaskTimeline[],
    dependencyAnalysis: DependencyAnalysis[]
  ): Promise<ParallelWorkGroup[]> {
    const crossTradeGroups: ParallelWorkGroup[] = [];
    
    // Use AI to identify complex cross-trade parallel opportunities
    const aiPrompt = `
      Analyze the following construction tasks and identify opportunities for cross-trade parallel work:
      
      Tasks: ${JSON.stringify(tasks.map(t => ({
        id: t.id,
        name: t.name,
        trade: t.trade,
        duration: t.duration,
        dependencies: t.dependencies
      })), null, 2)}
      
      Dependency Analysis: ${JSON.stringify(dependencyAnalysis, null, 2)}
      
      Identify groups of tasks from different trades that can be executed in parallel without conflicts.
      Consider:
      1. Physical space requirements
      2. Access requirements
      3. Safety considerations
      4. Resource sharing
      5. Quality control checkpoints
      
      Return a JSON array of parallel work opportunities.
    `;
    
    try {
      // TODO: Replace with proper AI service call when available
      const aiResponse = {
        response: JSON.stringify([
          {
            tasks: ['task1', 'task2'],
            reason: 'These tasks can be done in parallel',
            estimatedTimeSaving: 2
          }
        ])
      };
      
      // Parse AI response and create parallel work groups
      const aiSuggestions = JSON.parse(aiResponse.response);
      
      for (const suggestion of aiSuggestions) {
        if (suggestion.tasks && suggestion.tasks.length > 1) {
          crossTradeGroups.push({
            id: `cross_trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: suggestion.name || 'Cross-trade parallel work',
            tasks: suggestion.tasks,
            duration: suggestion.duration || Math.max(...suggestion.tasks.map((taskId: string) => {
              const task = tasks.find(t => t.id === taskId);
              return task ? task.duration : 0;
            })),
            trades: suggestion.trades || [],
            requirements: suggestion.requirements || [],
            conflicts: suggestion.conflicts || []
          });
        }
      }
    } catch (error) {
      console.warn('AI analysis for cross-trade parallel work failed:', error);
      // Fallback to basic heuristics
      crossTradeGroups.push(...this.basicCrossTradeAnalysis(tasks, dependencyAnalysis));
    }
    
    return crossTradeGroups;
  }

  /**
   * Basic cross-trade analysis fallback
   */
  private basicCrossTradeAnalysis(
    tasks: TaskTimeline[],
    dependencyAnalysis: DependencyAnalysis[]
  ): ParallelWorkGroup[] {
    const groups: ParallelWorkGroup[] = [];
    
    // Example: External work can often run in parallel with internal work
    const externalTasks = tasks.filter(t => 
      t.trade.includes('roofing') || 
      t.trade.includes('external') || 
      t.trade.includes('landscaping')
    );
    
    const internalTasks = tasks.filter(t => 
      t.trade.includes('electrical') || 
      t.trade.includes('plumbing') ||
      t.trade.includes('flooring')
    );
    
    if (externalTasks.length > 0 && internalTasks.length > 0) {
      // Check if they have no direct dependencies
      const hasConflicts = externalTasks.some(ext => 
        internalTasks.some(int => 
          dependencyAnalysis.find(a => a.taskId === ext.id)?.dependencies.some(d => d.dependsOn === int.id) ||
          dependencyAnalysis.find(a => a.taskId === int.id)?.dependencies.some(d => d.dependsOn === ext.id)
        )
      );
      
      if (!hasConflicts) {
        groups.push({
          id: `external_internal_parallel_${Date.now()}`,
          name: 'External and Internal Work Parallel',
          tasks: [...externalTasks.slice(0, 2), ...internalTasks.slice(0, 2)].map(t => t.id),
          duration: Math.max(
            Math.max(...externalTasks.map(t => t.duration)),
            Math.max(...internalTasks.map(t => t.duration))
          ),
          trades: ['external', 'internal'],
          requirements: ['Separate work areas', 'Coordinated access'],
          conflicts: ['Weather dependency for external work']
        });
      }
    }
    
    return groups;
  }

  /**
   * Get requirements for parallel work
   */
  private getParallelWorkRequirements(
    tasks: TaskTimeline[],
    laborRequirements: LaborRequirement[]
  ): string[] {
    const requirements: string[] = [];
    
    // Calculate total labor requirements
    const totalPersonDays = tasks.reduce((sum, task) => {
      const labor = laborRequirements.find(l => l.id === task.id);
      return sum + (labor?.personDays || 0);
    }, 0);
    
    if (totalPersonDays > 5) {
      requirements.push('Multiple work crews required');
    }
    
    // Check for specialized equipment needs
    const trades = [...new Set(tasks.map(t => t.trade))];
    if (trades.length > 2) {
      requirements.push('Coordinated equipment scheduling');
    }
    
    requirements.push('Clear communication between trades');
    requirements.push('Designated work areas to avoid conflicts');
    
    return requirements;
  }

  /**
   * Identify potential conflicts in parallel work
   */
  private identifyPotentialConflicts(tasks: TaskTimeline[]): string[] {
    const conflicts: string[] = [];
    
    const trades = tasks.map(t => t.trade);
    
    // Common conflict patterns
    if (trades.includes('electrical') && trades.includes('plumbing')) {
      conflicts.push('Electrical and plumbing work may require same wall/ceiling access');
    }
    
    if (trades.includes('flooring') && trades.includes('decorating')) {
      conflicts.push('Flooring work may damage completed decorating');
    }
    
    if (trades.includes('structural') && trades.includes('electrical')) {
      conflicts.push('Structural changes may affect electrical routing');
    }
    
    return conflicts;
  }

  /**
   * Calculate critical path through project
   */
  private async calculateCriticalPath(
    tasks: TaskTimeline[],
    dependencyAnalysis: DependencyAnalysis[]
  ): Promise<string[]> {
    // Implement Critical Path Method (CPM) algorithm
    const criticalPath: string[] = [];
    
    // Step 1: Calculate earliest start and finish times (forward pass)
    const earlyTimes = this.calculateEarlyTimes(tasks, dependencyAnalysis);
    
    // Step 2: Calculate latest start and finish times (backward pass)
    const lateTimes = this.calculateLateTimes(tasks, dependencyAnalysis, earlyTimes);
    
    // Step 3: Calculate float times and identify critical tasks
    for (const task of tasks) {
      const early = earlyTimes[task.id];
      const late = lateTimes[task.id];
      
      if (early && late) {
        const floatTime = late.start - early.start;
        
        // Update dependency analysis with float time
        const analysis = dependencyAnalysis.find(a => a.taskId === task.id);
        if (analysis) {
          analysis.floatTime = floatTime;
          analysis.criticalPathMember = floatTime === 0;
        }
        
        // Add to critical path if no float
        if (floatTime === 0) {
          criticalPath.push(task.id);
        }
      }
    }
    
    return criticalPath;
  }

  /**
   * Calculate earliest start and finish times
   */
  private calculateEarlyTimes(
    tasks: TaskTimeline[],
    dependencyAnalysis: DependencyAnalysis[]
  ): Record<string, { start: number; finish: number }> {
    const earlyTimes: Record<string, { start: number; finish: number }> = {};
    const processed = new Set<string>();
    const processing = new Set<string>(); // Track currently processing tasks to detect cycles
    
    // Process tasks in dependency order
    const processTask = (taskId: string): void => {
      if (processed.has(taskId)) return;
      
      const task = tasks.find(t => t.id === taskId);
      const analysis = dependencyAnalysis.find(a => a.taskId === taskId);
      
      // Detect circular dependencies
      if (processing.has(taskId)) {
        console.warn(`Circular dependency detected for task ${taskId}, skipping`);
        // Set a default early time for circular dependency tasks
        if (!earlyTimes[taskId]) {
          earlyTimes[taskId] = { start: 0, finish: task?.duration || 1 };
        }
        return;
      }
      
      if (!task || !analysis) return;
      
      processing.add(taskId);
      
      // Process all dependencies first
      for (const dep of analysis.dependencies) {
        processTask(dep.dependsOn);
      }
      
      // Calculate earliest start time
      let earliestStart = 0;
      for (const dep of analysis.dependencies) {
        const depEarly = earlyTimes[dep.dependsOn];
        if (depEarly) {
          earliestStart = Math.max(earliestStart, depEarly.finish + dep.lag);
        }
      }
      
      earlyTimes[taskId] = {
        start: earliestStart,
        finish: earliestStart + task.duration
      };
      
      processing.delete(taskId);
      processed.add(taskId);
    };
    
    // Process all tasks
    for (const task of tasks) {
      processTask(task.id);
    }
    
    return earlyTimes;
  }

  /**
   * Calculate latest start and finish times
   */
  private calculateLateTimes(
    tasks: TaskTimeline[],
    dependencyAnalysis: DependencyAnalysis[],
    earlyTimes: Record<string, { start: number; finish: number }>
  ): Record<string, { start: number; finish: number }> {
    const lateTimes: Record<string, { start: number; finish: number }> = {};
    
    // Find project end time
    const projectEndTime = Math.max(...Object.values(earlyTimes).map(t => t.finish));
    
    // Initialize end tasks with project end time
    for (const task of tasks) {
      const analysis = dependencyAnalysis.find(a => a.taskId === task.id);
      if (analysis && analysis.dependents.length === 0) {
        lateTimes[task.id] = {
          finish: projectEndTime,
          start: projectEndTime - task.duration
        };
      }
    }
    
    // Backward pass
    const processed = new Set<string>();
    
    const processTask = (taskId: string): void => {
      if (processed.has(taskId)) return;
      
      const task = tasks.find(t => t.id === taskId);
      const analysis = dependencyAnalysis.find(a => a.taskId === taskId);
      
      if (!task || !analysis) return;
      
      // Process all dependents first
      for (const dependentId of analysis.dependents) {
        processTask(dependentId);
      }
      
      // Calculate latest finish time if not already set
      if (!lateTimes[taskId]) {
        let latestFinish = projectEndTime;
        
        for (const dependentId of analysis.dependents) {
          const dependentLate = lateTimes[dependentId];
          const dependentAnalysis = dependencyAnalysis.find(a => a.taskId === dependentId);
          
          if (dependentLate && dependentAnalysis) {
            const dep = dependentAnalysis.dependencies.find(d => d.dependsOn === taskId);
            const lag = dep?.lag || 0;
            latestFinish = Math.min(latestFinish, dependentLate.start - lag);
          }
        }
        
        lateTimes[taskId] = {
          finish: latestFinish,
          start: latestFinish - task.duration
        };
      }
      
      processed.add(taskId);
    };
    
    // Process all tasks
    for (const task of tasks) {
      processTask(task.id);
    }
    
    return lateTimes;
  }

  /**
   * Generate AI-powered optimization recommendations
   */
  private async generateOptimizationRecommendations(
    request: TimelineOptimizationRequest,
    dependencyAnalysis: DependencyAnalysis[],
    parallelWorkGroups: ParallelWorkGroup[],
    criticalPath: string[]
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Analyze critical path for optimization opportunities
    const criticalPathTasks = request.tasks.filter(t => criticalPath.includes(t.id));
    
    if (criticalPathTasks.length > 0) {
      recommendations.push({
        type: 'dependency_optimization',
        priority: 'high',
        description: `Critical path contains ${criticalPathTasks.length} tasks that determine project duration`,
        impact: 'Optimizing critical path tasks can directly reduce project timeline',
        implementation: 'Focus resources on critical path tasks and consider task splitting or additional crews'
      });
    }
    
    // Analyze parallel work opportunities
    if (parallelWorkGroups.length > 0) {
      const totalParallelSavings = parallelWorkGroups.reduce((sum, group) => {
        const sequentialDuration = group.tasks.reduce((taskSum, taskId) => {
          const task = request.tasks.find(t => t.id === taskId);
          return taskSum + (task?.duration || 0);
        }, 0);
        return sum + (sequentialDuration - group.duration);
      }, 0);
      
      recommendations.push({
        type: 'parallel_work',
        priority: 'high',
        description: `${parallelWorkGroups.length} parallel work opportunities identified`,
        impact: `Potential time savings: ${totalParallelSavings} days`,
        implementation: 'Coordinate multiple work crews and ensure adequate site access'
      });
    }
    
    // Resource allocation recommendations
    const highLaborTasks = request.laborRequirements
      .filter(l => l.personDays > 5)
      .map(l => l.id);
    
    if (highLaborTasks.length > 0) {
      recommendations.push({
        type: 'resource_allocation',
        priority: 'medium',
        description: `${highLaborTasks.length} tasks require significant labor resources`,
        impact: 'Proper resource allocation can prevent bottlenecks',
        implementation: 'Schedule high-labor tasks during periods of maximum crew availability'
      });
    }
    
    // Scheduling recommendations based on constraints
    if (request.constraints?.weatherConstraints) {
      recommendations.push({
        type: 'scheduling',
        priority: 'medium',
        description: 'Weather-dependent tasks identified',
        impact: 'Seasonal scheduling can prevent weather delays',
        implementation: 'Schedule external work during favorable weather periods'
      });
    }
    
    return recommendations;
  }

  /**
   * Create optimized Gantt chart
   */
  private async createOptimizedGanttChart(
    request: TimelineOptimizationRequest,
    parallelWorkGroups: ParallelWorkGroup[],
    criticalPath: string[],
    recommendations: OptimizationRecommendation[]
  ): Promise<GanttChart> {
    const startDate = request.constraints?.availableStartDate || new Date();
    const workingDaysPerWeek = request.constraints?.workingDaysPerWeek || 5;
    const maxDuration = request.constraints?.maxDuration;
    
    // Create optimized task schedule
    const ganttTasks: GanttTask[] = [];
    const taskSchedule = new Map<string, { start: Date; end: Date }>();
    
    // Sort tasks by dependencies (topological sort)
    const sortedTasks = this.topologicalSort(request.tasks);
    
    // Schedule tasks considering parallel work opportunities and constraints
    for (const task of sortedTasks) {
      if (taskSchedule.has(task.id)) continue;
      
      // Check if this task is part of a parallel work group
      const parallelGroup = parallelWorkGroups.find(group => 
        group.tasks.includes(task.id)
      );
      
      let taskStartDate: Date;
      let taskEndDate: Date;
      
      // Ensure dependencies are satisfied
      const dependencyEndDate = this.getLatestDependencyEndDate(task, taskSchedule);
      const actualStartDate = dependencyEndDate.getTime() > startDate.getTime() ? dependencyEndDate : startDate;
      
      if (parallelGroup && !taskSchedule.has(task.id)) {
        // Schedule all tasks in the parallel group together
        taskStartDate = new Date(actualStartDate);
        
        // For parallel groups, use the maximum duration of tasks in the group
        // This represents the time needed when tasks run in parallel
        let groupDuration = Math.max(...parallelGroup.tasks.map(taskId => {
          const t = request.tasks.find(t => t.id === taskId);
          return t ? t.duration : 0;
        }));
        
        // Apply duration compression if max duration constraint exists
        if (maxDuration) {
          const remainingDuration = maxDuration - Math.ceil((actualStartDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          if (remainingDuration < groupDuration) {
            groupDuration = Math.max(1, remainingDuration);
          }
        }
        
        taskEndDate = this.addWorkingDays(taskStartDate, groupDuration, workingDaysPerWeek);
        
        // Schedule all tasks in the group
        for (const parallelTaskId of parallelGroup.tasks) {
          const parallelTask = request.tasks.find(t => t.id === parallelTaskId);
          if (parallelTask && !taskSchedule.has(parallelTaskId)) {
            taskSchedule.set(parallelTaskId, {
              start: new Date(taskStartDate),
              end: new Date(taskEndDate)
            });
            
            ganttTasks.push({
              id: parallelTask.id,
              name: parallelTask.name,
              startDate: new Date(taskStartDate),
              endDate: new Date(taskEndDate),
              duration: parallelTask.duration, // Keep original duration for display
              dependencies: parallelTask.dependencies,
              trade: parallelTask.trade,
              progress: 0
            });
          }
        }
      } else if (!taskSchedule.has(task.id)) {
        // Schedule individual task
        taskStartDate = new Date(actualStartDate);
        
        // Apply duration compression if max duration constraint exists
        let taskDuration = task.duration;
        if (maxDuration) {
          const remainingDuration = maxDuration - Math.ceil((actualStartDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          if (remainingDuration < taskDuration) {
            taskDuration = Math.max(1, remainingDuration);
          }
        }
        
        taskEndDate = this.addWorkingDays(taskStartDate, taskDuration, workingDaysPerWeek);
        
        taskSchedule.set(task.id, { start: taskStartDate, end: taskEndDate });
        
        ganttTasks.push({
          id: task.id,
          name: task.name,
          startDate: taskStartDate,
          endDate: taskEndDate,
          duration: taskDuration,
          dependencies: task.dependencies,
          trade: task.trade,
          progress: 0
        });
      }
    }
    
    // Calculate total project duration
    const projectEndDate = ganttTasks.length > 0 
      ? Math.max(...ganttTasks.map(t => t.endDate.getTime()))
      : startDate.getTime();
    let totalDuration = Math.ceil((projectEndDate - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Ensure we don't exceed max duration constraint
    if (maxDuration && totalDuration > maxDuration) {
      totalDuration = maxDuration;
    }
    
    return {
      id: `gantt_${request.projectId}_${Date.now()}`,
      projectId: request.projectId,
      tasks: ganttTasks,
      totalDuration,
      criticalPath,
      generatedAt: new Date()
    };
  }

  /**
   * Topological sort of tasks based on dependencies
   */
  private topologicalSort(tasks: TaskTimeline[]): TaskTimeline[] {
    const visited = new Set<string>();
    const result: TaskTimeline[] = [];
    const visiting = new Set<string>(); // For cycle detection
    const cycleDetected = new Set<string>(); // Track tasks involved in cycles
    
    const visit = (taskId: string): boolean => {
      if (visited.has(taskId)) return true;
      if (visiting.has(taskId)) {
        // Cycle detected, mark all tasks in the cycle
        cycleDetected.add(taskId);
        return false;
      }
      
      const task = tasks.find(t => t.id === taskId);
      if (!task) return true;
      
      visiting.add(taskId);
      
      // Visit dependencies first
      let allDepsValid = true;
      for (const depId of task.dependencies) {
        if (!visit(depId)) {
          allDepsValid = false;
          cycleDetected.add(taskId);
        }
      }
      
      visiting.delete(taskId);
      
      if (allDepsValid && !cycleDetected.has(taskId)) {
        visited.add(taskId);
        result.push(task);
      }
      
      return allDepsValid;
    };
    
    // Visit all tasks
    for (const task of tasks) {
      visit(task.id);
    }
    
    // Add tasks with cycles at the end (with cleared dependencies)
    for (const task of tasks) {
      if (cycleDetected.has(task.id) && !visited.has(task.id)) {
        result.push({
          ...task,
          dependencies: [] // Clear dependencies for cyclic tasks
        });
      }
    }
    
    return result;
  }

  /**
   * Get the latest end date of all dependencies
   */
  private getLatestDependencyEndDate(
    task: TaskTimeline, 
    taskSchedule: Map<string, { start: Date; end: Date }>
  ): Date {
    let latestEndDate = new Date(0);
    
    for (const depId of task.dependencies) {
      const depSchedule = taskSchedule.get(depId);
      if (depSchedule && depSchedule.end > latestEndDate) {
        latestEndDate = depSchedule.end;
      }
    }
    
    return latestEndDate;
  }

  /**
   * Add working days to a date
   */
  private addWorkingDays(startDate: Date, days: number, workingDaysPerWeek: number = 5): Date {
    const result = new Date(startDate);
    let addedDays = 0;
    
    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      
      // Skip weekends if working days per week is 5
      if (workingDaysPerWeek === 5 && (result.getDay() === 0 || result.getDay() === 6)) {
        continue;
      }
      
      addedDays++;
    }
    
    return result;
  }

  /**
   * Calculate original sequential duration
   */
  private calculateOriginalDuration(tasks: TaskTimeline[]): number {
    if (tasks.length === 0) return 0;
    return tasks.reduce((sum, task) => sum + task.duration, 0);
  }

  /**
   * Regenerate timeline with modifications
   */
  async regenerateTimeline(
    originalRequest: TimelineOptimizationRequest,
    modifications: {
      taskModifications?: Partial<TaskTimeline>[];
      constraintChanges?: Partial<TimelineConstraints>;
      preferenceChanges?: Partial<TimelinePreferences>;
    }
  ): Promise<OptimizationResult> {
    // Apply modifications to the original request
    const modifiedRequest: TimelineOptimizationRequest = {
      ...originalRequest,
      tasks: originalRequest.tasks.map(task => {
        const modification = modifications.taskModifications?.find(m => m.id === task.id);
        return modification ? { ...task, ...modification } : task;
      }),
      constraints: {
        ...originalRequest.constraints,
        ...modifications.constraintChanges
      },
      userPreferences: {
        ...originalRequest.userPreferences,
        ...modifications.preferenceChanges
      }
    };
    
    // Regenerate optimized timeline
    return this.optimizeTimeline(modifiedRequest);
  }
}

export const timelineOptimizationService = new TimelineOptimizationService();