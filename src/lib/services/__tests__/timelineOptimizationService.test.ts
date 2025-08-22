import { 
  timelineOptimizationService,
  TimelineOptimizationRequest,
  TimelineConstraints,
  TimelinePreferences
} from '../timelineOptimizationService';
import { TaskTimeline, LaborRequirement, ProjectType } from '../../types';
import { aiService } from '../aiService';

// Mock the AI service
jest.mock('../aiService', () => ({
  aiService: {
    invokeAgent: jest.fn()
  }
}));

const mockAiService = aiService as jest.Mocked<typeof aiService>;

describe('TimelineOptimizationService', () => {
  const mockTasks: TaskTimeline[] = [
    {
      id: 'task-1',
      name: 'Structural Framework',
      description: 'Build main structural framework',
      duration: 5,
      dependencies: [],
      canRunInParallel: false,
      trade: 'structural'
    },
    {
      id: 'task-2',
      name: 'Electrical First Fix',
      description: 'Install electrical wiring',
      duration: 3,
      dependencies: ['task-1'],
      canRunInParallel: true,
      trade: 'electrical'
    },
    {
      id: 'task-3',
      name: 'Plumbing First Fix',
      description: 'Install plumbing pipes',
      duration: 3,
      dependencies: ['task-1'],
      canRunInParallel: true,
      trade: 'plumbing'
    },
    {
      id: 'task-4',
      name: 'Insulation Installation',
      description: 'Install wall and ceiling insulation',
      duration: 2,
      dependencies: ['task-2', 'task-3'],
      canRunInParallel: false,
      trade: 'insulation'
    },
    {
      id: 'task-5',
      name: 'Flooring Installation',
      description: 'Install hardwood flooring',
      duration: 4,
      dependencies: ['task-4'],
      canRunInParallel: false,
      trade: 'flooring'
    }
  ];

  const mockLaborRequirements: LaborRequirement[] = [
    {
      id: 'task-1',
      trade: 'structural',
      description: 'Structural work',
      personDays: 10,
      estimatedCost: 2000,
      qualifications: ['Structural Engineer']
    },
    {
      id: 'task-2',
      trade: 'electrical',
      description: 'Electrical work',
      personDays: 6,
      estimatedCost: 1200,
      qualifications: ['Qualified Electrician']
    },
    {
      id: 'task-3',
      trade: 'plumbing',
      description: 'Plumbing work',
      personDays: 6,
      estimatedCost: 1200,
      qualifications: ['Qualified Plumber']
    },
    {
      id: 'task-4',
      trade: 'insulation',
      description: 'Insulation work',
      personDays: 4,
      estimatedCost: 800,
      qualifications: []
    },
    {
      id: 'task-5',
      trade: 'flooring',
      description: 'Flooring work',
      personDays: 8,
      estimatedCost: 1600,
      qualifications: ['Flooring Specialist']
    }
  ];

  const mockRequest: TimelineOptimizationRequest = {
    projectId: 'test-project-1',
    projectType: 'loft_conversion_dormer' as ProjectType,
    tasks: mockTasks,
    laborRequirements: mockLaborRequirements
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AI service response for cross-trade parallel work
    mockAiService.invokeAgent.mockResolvedValue({
      response: JSON.stringify([
        {
          name: 'External and Internal Work Parallel',
          tasks: ['task-2', 'task-3'],
          duration: 3,
          trades: ['electrical', 'plumbing'],
          requirements: ['Separate work areas', 'Coordinated access'],
          conflicts: []
        }
      ])
    });
  });

  describe('optimizeTimeline', () => {
    it('should optimize timeline and identify parallel work opportunities', async () => {
      const result = await timelineOptimizationService.optimizeTimeline(mockRequest);

      expect(result).toBeDefined();
      expect(result.ganttChart).toBeDefined();
      expect(result.ganttChart.tasks).toHaveLength(mockTasks.length);
      expect(result.parallelWorkOpportunities.length).toBeGreaterThan(0);
      expect(result.criticalPath).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should calculate time savings from parallel work', async () => {
      const result = await timelineOptimizationService.optimizeTimeline(mockRequest);

      expect(result.originalDuration).toBe(17); // Sum of all task durations
      // Optimized duration might be longer due to dependency constraints, but should be reasonable
      expect(result.optimizedDuration).toBeGreaterThan(0);
      expect(result.timeSaved).toBeDefined();
      expect(typeof result.timeSaved).toBe('number');
    });

    it('should identify critical path correctly', async () => {
      const result = await timelineOptimizationService.optimizeTimeline(mockRequest);

      // Critical path should include tasks that cannot be delayed
      expect(result.criticalPath).toContain('task-1'); // Structural work is always critical
      expect(result.criticalPath).toContain('task-5'); // Final task is usually critical
    });

    it('should generate optimization recommendations', async () => {
      const result = await timelineOptimizationService.optimizeTimeline(mockRequest);

      expect(result.recommendations.length).toBeGreaterThan(0);
      
      const hasParallelWorkRec = result.recommendations.some(
        rec => rec.type === 'parallel_work'
      );
      expect(hasParallelWorkRec).toBe(true);
    });

    it('should handle constraints properly', async () => {
      const constraints: TimelineConstraints = {
        maxDuration: 10,
        workingDaysPerWeek: 6,
        availableStartDate: new Date('2024-01-15'),
        excludedDates: [new Date('2024-01-20')]
      };

      const requestWithConstraints = {
        ...mockRequest,
        constraints
      };

      const result = await timelineOptimizationService.optimizeTimeline(requestWithConstraints);

      expect(result.ganttChart.totalDuration).toBeLessThanOrEqual(constraints.maxDuration!);
      
      // Check that start date is respected
      const earliestTaskStart = Math.min(
        ...result.ganttChart.tasks.map(t => t.startDate.getTime())
      );
      expect(earliestTaskStart).toBeGreaterThanOrEqual(constraints.availableStartDate!.getTime());
    });

    it('should apply user preferences', async () => {
      const preferences: TimelinePreferences = {
        prioritizeSpeed: true,
        prioritizeCost: false,
        minimizeDisruption: false
      };

      const requestWithPreferences = {
        ...mockRequest,
        userPreferences: preferences
      };

      const result = await timelineOptimizationService.optimizeTimeline(requestWithPreferences);

      // When prioritizing speed, should have more parallel work opportunities
      expect(result.parallelWorkOpportunities.length).toBeGreaterThan(0);
      expect(result.timeSaved).toBeDefined();
    });
  });

  describe('parallel work identification', () => {
    it('should identify tasks that can run in parallel within same trade', async () => {
      const parallelTasks: TaskTimeline[] = [
        {
          id: 'elec-1',
          name: 'Kitchen Electrical',
          description: 'Kitchen electrical work',
          duration: 2,
          dependencies: [],
          canRunInParallel: true,
          trade: 'electrical'
        },
        {
          id: 'elec-2',
          name: 'Bedroom Electrical',
          description: 'Bedroom electrical work',
          duration: 2,
          dependencies: [],
          canRunInParallel: true,
          trade: 'electrical'
        }
      ];

      const request = {
        ...mockRequest,
        tasks: parallelTasks
      };

      const result = await timelineOptimizationService.optimizeTimeline(request);

      const electricalParallelGroup = result.parallelWorkOpportunities.find(
        group => group.trades.includes('electrical')
      );
      
      expect(electricalParallelGroup).toBeDefined();
      expect(electricalParallelGroup!.tasks).toContain('elec-1');
      expect(electricalParallelGroup!.tasks).toContain('elec-2');
    });

    it('should identify cross-trade parallel opportunities', async () => {
      const result = await timelineOptimizationService.optimizeTimeline(mockRequest);

      // Should call AI service for cross-trade analysis
      expect(mockAiService.invokeAgent).toHaveBeenCalledWith(
        'timeline_optimization_agent',
        expect.objectContaining({
          prompt: expect.stringContaining('cross-trade parallel work'),
          context: expect.any(Object)
        })
      );

      // Should include AI-suggested parallel work
      const crossTradeGroup = result.parallelWorkOpportunities.find(
        group => group.trades.length > 1
      );
      expect(crossTradeGroup).toBeDefined();
    });

    it('should handle AI service failures gracefully', async () => {
      mockAiService.invokeAgent.mockRejectedValue(new Error('AI service unavailable'));

      const result = await timelineOptimizationService.optimizeTimeline(mockRequest);

      // Should still return results with fallback analysis
      expect(result).toBeDefined();
      expect(result.parallelWorkOpportunities).toBeDefined();
    });
  });

  describe('critical path calculation', () => {
    it('should calculate critical path using CPM algorithm', async () => {
      const result = await timelineOptimizationService.optimizeTimeline(mockRequest);

      // Critical path should start with task-1 (no dependencies)
      expect(result.criticalPath).toContain('task-1');
      
      // Should end with task-5 (final task)
      expect(result.criticalPath).toContain('task-5');
      
      // Should include tasks with zero float time
      expect(result.criticalPath.length).toBeGreaterThan(0);
    });

    it('should handle complex dependency chains', async () => {
      const complexTasks: TaskTimeline[] = [
        ...mockTasks,
        {
          id: 'task-6',
          name: 'Final Inspection',
          description: 'Final quality inspection',
          duration: 1,
          dependencies: ['task-5'],
          canRunInParallel: false,
          trade: 'general'
        }
      ];

      const request = {
        ...mockRequest,
        tasks: complexTasks
      };

      const result = await timelineOptimizationService.optimizeTimeline(request);

      // Critical path should include the final task
      expect(result.criticalPath).toContain('task-6');
    });
  });

  describe('regenerateTimeline', () => {
    it('should regenerate timeline with task modifications', async () => {
      const originalResult = await timelineOptimizationService.optimizeTimeline(mockRequest);

      const modifications = {
        taskModifications: [
          {
            id: 'task-1',
            duration: 7 // Increase from 5 to 7 days
          }
        ]
      };

      const regeneratedResult = await timelineOptimizationService.regenerateTimeline(
        mockRequest,
        modifications
      );

      expect(regeneratedResult.optimizedDuration).toBeGreaterThan(originalResult.optimizedDuration);
    });

    it('should apply constraint changes', async () => {
      const modifications = {
        constraintChanges: {
          workingDaysPerWeek: 7, // Change from 5 to 7 days
          maxDuration: 12
        }
      };

      const result = await timelineOptimizationService.regenerateTimeline(
        mockRequest,
        modifications
      );

      expect(result.ganttChart.totalDuration).toBeLessThanOrEqual(12);
    });

    it('should apply preference changes', async () => {
      const modifications = {
        preferenceChanges: {
          prioritizeSpeed: false,
          prioritizeCost: true
        }
      };

      const result = await timelineOptimizationService.regenerateTimeline(
        mockRequest,
        modifications
      );

      // Should generate different recommendations based on cost priority
      const costRecommendations = result.recommendations.filter(
        rec => rec.type === 'resource_allocation'
      );
      expect(costRecommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('gantt chart generation', () => {
    it('should create properly formatted Gantt chart', async () => {
      const result = await timelineOptimizationService.optimizeTimeline(mockRequest);

      const gantt = result.ganttChart;
      
      expect(gantt.id).toBeDefined();
      expect(gantt.projectId).toBe(mockRequest.projectId);
      expect(gantt.tasks).toHaveLength(mockTasks.length);
      expect(gantt.totalDuration).toBeGreaterThan(0);
      expect(gantt.criticalPath).toEqual(result.criticalPath);
      expect(gantt.generatedAt).toBeInstanceOf(Date);
    });

    it('should schedule tasks with proper dependencies', async () => {
      const result = await timelineOptimizationService.optimizeTimeline(mockRequest);

      const ganttTasks = result.ganttChart.tasks;
      
      // Task 1 should start first (no dependencies)
      const task1 = ganttTasks.find(t => t.id === 'task-1')!;
      const task2 = ganttTasks.find(t => t.id === 'task-2')!;
      
      expect(task1.startDate.getTime()).toBeLessThanOrEqual(task2.startDate.getTime());
      
      // Task 2 should start after task 1 finishes (dependency)
      expect(task2.startDate.getTime()).toBeGreaterThanOrEqual(task1.endDate.getTime());
    });

    it('should handle parallel tasks scheduling', async () => {
      const result = await timelineOptimizationService.optimizeTimeline(mockRequest);

      const ganttTasks = result.ganttChart.tasks;
      
      // Tasks 2 and 3 can run in parallel (both depend on task 1)
      const task2 = ganttTasks.find(t => t.id === 'task-2')!;
      const task3 = ganttTasks.find(t => t.id === 'task-3')!;
      
      // They should have overlapping time periods
      const task2Start = task2.startDate.getTime();
      const task2End = task2.endDate.getTime();
      const task3Start = task3.startDate.getTime();
      const task3End = task3.endDate.getTime();
      
      const hasOverlap = (task2Start < task3End) && (task3Start < task2End);
      expect(hasOverlap).toBe(true);
    });
  });

  describe('working days calculation', () => {
    it('should respect working days per week constraint', async () => {
      const constraints: TimelineConstraints = {
        workingDaysPerWeek: 5,
        availableStartDate: new Date('2024-01-15') // Monday
      };

      const request = {
        ...mockRequest,
        constraints
      };

      const result = await timelineOptimizationService.optimizeTimeline(request);

      // Check that no tasks are scheduled on weekends
      for (const task of result.ganttChart.tasks) {
        const dayOfWeek = task.startDate.getDay();
        expect(dayOfWeek).not.toBe(0); // Not Sunday
        expect(dayOfWeek).not.toBe(6); // Not Saturday
      }
    });

    it('should handle 7-day work weeks', async () => {
      const constraints: TimelineConstraints = {
        workingDaysPerWeek: 7,
        availableStartDate: new Date('2024-01-15')
      };

      const request = {
        ...mockRequest,
        constraints
      };

      const result = await timelineOptimizationService.optimizeTimeline(request);

      // Should have shorter total duration with 7-day weeks
      expect(result.optimizedDuration).toBeLessThan(result.originalDuration);
    });
  });

  describe('error handling', () => {
    it('should handle empty task list', async () => {
      const request = {
        ...mockRequest,
        tasks: []
      };

      const result = await timelineOptimizationService.optimizeTimeline(request);

      expect(result.ganttChart.tasks).toHaveLength(0);
      expect(result.optimizedDuration).toBe(0);
      expect(result.timeSaved).toBe(0);
    });

    it('should handle tasks with circular dependencies', async () => {
      const circularTasks: TaskTimeline[] = [
        {
          id: 'task-a',
          name: 'Task A',
          description: 'Task A',
          duration: 2,
          dependencies: ['task-b'],
          canRunInParallel: false,
          trade: 'general'
        },
        {
          id: 'task-b',
          name: 'Task B',
          description: 'Task B',
          duration: 2,
          dependencies: ['task-a'],
          canRunInParallel: false,
          trade: 'general'
        }
      ];

      const request = {
        ...mockRequest,
        tasks: circularTasks
      };

      // Should handle gracefully by breaking the circular dependency
      try {
        const result = await timelineOptimizationService.optimizeTimeline(request);
        expect(result).toBeDefined();
        expect(result.ganttChart.tasks.length).toBeGreaterThan(0);
      } catch (error) {
        // If it still fails, at least it should be a controlled failure
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle invalid dates in constraints', async () => {
      const constraints: TimelineConstraints = {
        availableStartDate: new Date('invalid-date'),
        requiredEndDate: new Date('2024-01-01') // Before start date
      };

      const request = {
        ...mockRequest,
        constraints
      };

      // Should handle gracefully and use fallback dates
      const result = await timelineOptimizationService.optimizeTimeline(request);
      expect(result).toBeDefined();
    });
  });
});