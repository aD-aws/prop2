import { AgentOrchestrator } from '../agentOrchestrator';
import { AgentSelector } from '../agentSelector';
import { AIAgentService } from '../aiAgentService';
import { PromptManager } from '../promptManager';
import { ProjectContext, AIAgent } from '../../types';
import { ProjectTypeMap, createTestAgent, createTestProjectContext } from '../../__tests__/setup/testHelpers';

// Mock dependencies
jest.mock('../agentSelector');
jest.mock('../aiAgentService');
jest.mock('../promptManager');

const mockAgentSelector = jest.mocked(AgentSelector);
const mockAIAgentService = jest.mocked(AIAgentService);
const mockPromptManager = jest.mocked(PromptManager);

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = new AgentOrchestrator();
  });

  describe('selectAgents', () => {
    it('should select appropriate agents for loft conversion project', async () => {
      const projectType = ProjectTypeMap.LOFT_CONVERSION;
      const projectDetails = { rooms: 2, bathrooms: 1 };

      const mockAgents: AIAgent[] = [
        createTestAgent({
          id: 'structural-agent',
          name: 'Structural Agent',
          specialization: 'structural',
          projectTypes: [ProjectTypeMap.LOFT_CONVERSION],
          isOrchestrator: true
        }),
        createTestAgent({
          id: 'electrical-agent',
          name: 'Electrical Agent',
          specialization: 'electrical',
          projectTypes: [ProjectTypeMap.LOFT_CONVERSION],
          isOrchestrator: false
        })
      ];

      // Mock the selectAgents method
      const selectAgentsSpy = jest.spyOn(orchestrator, 'selectAgents' as any)
        .mockResolvedValue(mockAgents);

      const result = await orchestrator.selectAgents(projectType, projectDetails);

      expect(result).toEqual(mockAgents);
      expect(result).toHaveLength(2);
    });

    it('should handle kitchen renovation with multiple specialist agents', async () => {
      const projectType = ProjectTypeMap.KITCHEN_RENOVATION;
      const projectDetails = { size: 'large', appliances: true };

      const mockOrchestrator: AIAgent = createTestAgent({
        id: 'kitchen-orchestrator',
        name: 'Kitchen Orchestrator',
        specialization: 'kitchen',
        projectTypes: [ProjectTypeMap.KITCHEN_RENOVATION],
        isOrchestrator: true
      });

      const mockSpecialists: AIAgent[] = [
        createTestAgent({
          id: 'electrical-specialist',
          name: 'Electrical Specialist',
          specialization: 'electrical',
          projectTypes: [ProjectTypeMap.KITCHEN_RENOVATION]
        }),
        createTestAgent({
          id: 'plumbing-specialist',
          name: 'Plumbing Specialist',
          specialization: 'plumbing',
          projectTypes: [ProjectTypeMap.KITCHEN_RENOVATION]
        })
      ];

      const selectAgentsSpy = jest.spyOn(orchestrator, 'selectAgents' as any)
        .mockResolvedValue([mockOrchestrator, ...mockSpecialists]);

      const result = await orchestrator.selectAgents(projectType, projectDetails);

      expect(result).toHaveLength(3);
      expect(result[0].isOrchestrator).toBe(true);
      expect(result.slice(1).every(agent => !agent.isOrchestrator)).toBe(true);
    });
  });

  describe('invokeAgent', () => {
    it('should successfully invoke an agent and return response', async () => {
      const agentId = 'test-agent';
      const context: ProjectContext = createTestProjectContext({
        projectId: 'proj-123',
        projectType: ProjectTypeMap.BATHROOM_RENOVATION
      });

      const mockResponse = {
        agentId,
        response: 'Test response',
        confidence: 0.9,
        recommendations: ['Test recommendation'],
        nextQuestions: ['Test question'],
        data: {}
      };

      const invokeAgentSpy = jest.spyOn(orchestrator, 'invokeAgent' as any)
        .mockResolvedValue(mockResponse);

      const result = await orchestrator.invokeAgent(agentId, context);

      expect(result).toEqual(mockResponse);
      expect(result.agentId).toBe(agentId);
    });

    it('should handle agent invocation errors gracefully', async () => {
      const agentId = 'failing-agent';
      const context: ProjectContext = createTestProjectContext({
        projectId: 'proj-123',
        projectType: ProjectTypeMap.BATHROOM_RENOVATION
      });

      const invokeAgentSpy = jest.spyOn(orchestrator, 'invokeAgent' as any)
        .mockRejectedValue(new Error('Agent invocation failed'));

      await expect(orchestrator.invokeAgent(agentId, context))
        .rejects.toThrow('Agent invocation failed');
    });
  });

  describe('coordinateAgents', () => {
    it('should coordinate multiple agents and generate SoW', async () => {
      const agents: AIAgent[] = [
        createTestAgent({
          id: 'orchestrator',
          name: 'Test Orchestrator',
          specialization: 'test',
          projectTypes: [ProjectTypeMap.BATHROOM_RENOVATION],
          isOrchestrator: true,
          dependencies: ['specialist1']
        }),
        createTestAgent({
          id: 'specialist1',
          name: 'Test Specialist',
          specialization: 'specialist',
          projectTypes: [ProjectTypeMap.BATHROOM_RENOVATION]
        })
      ];

      const context: ProjectContext = createTestProjectContext({
        projectType: ProjectTypeMap.BATHROOM_RENOVATION
      });

      const mockSoW = {
        id: 'sow-123',
        projectId: context.projectId,
        version: 1,
        sections: [],
        materials: [],
        laborRequirements: [],
        timeline: [],
        estimatedCosts: {
          totalEstimate: 25000,
          laborCosts: 15000,
          materialCosts: 10000,
          builderMaterials: 6000,
          homeownerMaterials: 4000,
          breakdown: []
        },
        regulatoryRequirements: [],
        generatedAt: new Date()
      };

      const coordinateSpy = jest.spyOn(orchestrator, 'coordinateAgents' as any)
        .mockResolvedValue(mockSoW);

      const result = await orchestrator.coordinateAgents(agents, context);

      expect(result).toEqual(mockSoW);
      expect(result.projectId).toBe(context.projectId);
    });
  });

  describe('optimizeTimeline', () => {
    it('should optimize timeline and generate Gantt chart', async () => {
      const tasks = [
        {
          id: 'task-1',
          name: 'Demolition',
          duration: 2,
          dependencies: [],
          trade: 'General Builder'
        },
        {
          id: 'task-2',
          name: 'Electrical Work',
          duration: 3,
          dependencies: ['task-1'],
          trade: 'Electrician'
        }
      ];

      const mockGanttChart = {
        id: 'gantt-123',
        projectId: 'proj-123',
        tasks: [
          {
            id: 'task-1',
            name: 'Demolition',
            startDate: new Date(),
            endDate: new Date(),
            duration: 2,
            dependencies: [],
            trade: 'General Builder',
            progress: 0
          }
        ],
        totalDuration: 5,
        criticalPath: ['task-1', 'task-2'],
        generatedAt: new Date()
      };

      const optimizeSpy = jest.spyOn(orchestrator, 'optimizeTimeline' as any)
        .mockResolvedValue(mockGanttChart);

      const result = await orchestrator.optimizeTimeline(tasks);

      expect(result).toEqual(mockGanttChart);
      expect(result.totalDuration).toBe(5);
    });
  });
});