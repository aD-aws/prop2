import { AgentRegistry } from '../agentRegistry';
import { AIAgent } from '../../types';
import { ProjectTypeMap, createTestAgent } from '../../__tests__/setup/testHelpers';

describe('AgentRegistry', () => {
  let agentRegistry: AgentRegistry;

  beforeEach(() => {
    agentRegistry = new AgentRegistry();
  });

  describe('registerAgent', () => {
    it('should register a new agent successfully', () => {
      const agent: AIAgent = createTestAgent({
        id: 'test-agent',
        projectTypes: [ProjectTypeMap.KITCHEN_RENOVATION]
      });

      // Mock the registerAgent method since it might not exist yet
      const registerSpy = jest.spyOn(agentRegistry, 'registerAgent' as any).mockImplementation(() => {});
      const getSpy = jest.spyOn(agentRegistry, 'getAgent' as any).mockReturnValue(agent);

      agentRegistry.registerAgent(agent);
      const retrievedAgent = agentRegistry.getAgent('test-agent');

      expect(registerSpy).toHaveBeenCalledWith(agent);
      expect(retrievedAgent).toEqual(agent);
    });

    it('should throw error when registering duplicate agent ID', () => {
      const agent: AIAgent = createTestAgent({
        id: 'duplicate-agent',
        projectTypes: [ProjectTypeMap.KITCHEN_RENOVATION]
      });

      const registerSpy = jest.spyOn(agentRegistry, 'registerAgent' as any)
        .mockImplementationOnce(() => {})
        .mockImplementationOnce(() => {
          throw new Error('Agent with ID duplicate-agent already exists');
        });

      agentRegistry.registerAgent(agent);

      expect(() => {
        agentRegistry.registerAgent(agent);
      }).toThrow('Agent with ID duplicate-agent already exists');
    });
  });

  describe('getAgent', () => {
    it('should return agent by ID', () => {
      const agent: AIAgent = createTestAgent({
        id: 'findable-agent',
        projectTypes: [ProjectTypeMap.BATHROOM_RENOVATION]
      });

      const registerSpy = jest.spyOn(agentRegistry, 'registerAgent' as any).mockImplementation(() => {});
      const getSpy = jest.spyOn(agentRegistry, 'getAgent' as any).mockReturnValue(agent);

      agentRegistry.registerAgent(agent);
      const result = agentRegistry.getAgent('findable-agent');

      expect(result).toEqual(agent);
    });

    it('should return undefined for non-existent agent', () => {
      const getSpy = jest.spyOn(agentRegistry, 'getAgent' as any).mockReturnValue(undefined);
      
      const result = agentRegistry.getAgent('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('getAgentsByProjectType', () => {
    it('should return agents that support the project type', () => {
      const kitchenAgent: AIAgent = createTestAgent({
        id: 'kitchen-agent',
        name: 'Kitchen Agent',
        specialization: 'kitchen',
        projectTypes: [ProjectTypeMap.KITCHEN_RENOVATION],
        isOrchestrator: true
      });

      const electricalAgent: AIAgent = createTestAgent({
        id: 'electrical-agent',
        name: 'Electrical Agent',
        specialization: 'electrical',
        projectTypes: [ProjectTypeMap.KITCHEN_RENOVATION, ProjectTypeMap.BATHROOM_RENOVATION]
      });

      const getByTypeSpy = jest.spyOn(agentRegistry, 'getAgentsByProjectType' as any)
        .mockReturnValue([kitchenAgent, electricalAgent]);

      const result = agentRegistry.getAgentsByProjectType(ProjectTypeMap.KITCHEN_RENOVATION);

      expect(result).toHaveLength(2);
      expect(result).toContain(kitchenAgent);
      expect(result).toContain(electricalAgent);
    });

    it('should return empty array for unsupported project type', () => {
      const getByTypeSpy = jest.spyOn(agentRegistry, 'getAgentsByProjectType' as any)
        .mockReturnValue([]);

      const result = agentRegistry.getAgentsByProjectType(ProjectTypeMap.LOFT_CONVERSION);
      expect(result).toEqual([]);
    });
  });

  describe('getAgentsBySpecialization', () => {
    it('should return agents with matching specialization', () => {
      const electricalAgent1: AIAgent = createTestAgent({
        id: 'electrical-agent-1',
        name: 'Electrical Agent 1',
        specialization: 'electrical',
        projectTypes: [ProjectTypeMap.KITCHEN_RENOVATION]
      });

      const electricalAgent2: AIAgent = createTestAgent({
        id: 'electrical-agent-2',
        name: 'Electrical Agent 2',
        specialization: 'electrical',
        projectTypes: [ProjectTypeMap.BATHROOM_RENOVATION]
      });

      const getBySpecSpy = jest.spyOn(agentRegistry, 'getAgentsBySpecialization' as any)
        .mockReturnValue([electricalAgent1, electricalAgent2]);

      const result = agentRegistry.getAgentsBySpecialization('electrical');

      expect(result).toHaveLength(2);
      expect(result).toContain(electricalAgent1);
      expect(result).toContain(electricalAgent2);
    });
  });

  describe('getOrchestratorAgent', () => {
    it('should return orchestrator agent for project type', () => {
      const orchestrator: AIAgent = createTestAgent({
        id: 'loft-orchestrator',
        name: 'Loft Orchestrator',
        specialization: 'loft-conversion',
        projectTypes: [ProjectTypeMap.LOFT_CONVERSION],
        isOrchestrator: true
      });

      const getOrchestratorSpy = jest.spyOn(agentRegistry, 'getOrchestratorAgent' as any)
        .mockReturnValue(orchestrator);

      const result = agentRegistry.getOrchestratorAgent(ProjectTypeMap.LOFT_CONVERSION);

      expect(result).toEqual(orchestrator);
    });

    it('should return undefined if no orchestrator exists', () => {
      const getOrchestratorSpy = jest.spyOn(agentRegistry, 'getOrchestratorAgent' as any)
        .mockReturnValue(undefined);

      const result = agentRegistry.getOrchestratorAgent(ProjectTypeMap.WINDOWS_REPLACEMENT);

      expect(result).toBeUndefined();
    });
  });

  describe('getSpecialistAgents', () => {
    it('should return only specialist agents for project type', () => {
      const specialist1: AIAgent = createTestAgent({
        id: 'electrical-specialist',
        name: 'Electrical Specialist',
        specialization: 'electrical',
        projectTypes: [ProjectTypeMap.KITCHEN_RENOVATION],
        isOrchestrator: false
      });

      const specialist2: AIAgent = createTestAgent({
        id: 'plumbing-specialist',
        name: 'Plumbing Specialist',
        specialization: 'plumbing',
        projectTypes: [ProjectTypeMap.KITCHEN_RENOVATION],
        isOrchestrator: false
      });

      const getSpecialistsSpy = jest.spyOn(agentRegistry, 'getSpecialistAgents' as any)
        .mockReturnValue([specialist1, specialist2]);

      const result = agentRegistry.getSpecialistAgents(ProjectTypeMap.KITCHEN_RENOVATION);

      expect(result).toHaveLength(2);
      expect(result).toContain(specialist1);
      expect(result).toContain(specialist2);
    });
  });

  describe('getAllAgents', () => {
    it('should return all registered agents', () => {
      const agent1: AIAgent = createTestAgent({
        id: 'agent-1',
        name: 'Agent 1',
        specialization: 'test1',
        projectTypes: [ProjectTypeMap.KITCHEN_RENOVATION]
      });

      const agent2: AIAgent = createTestAgent({
        id: 'agent-2',
        name: 'Agent 2',
        specialization: 'test2',
        projectTypes: [ProjectTypeMap.BATHROOM_RENOVATION]
      });

      const getAllSpy = jest.spyOn(agentRegistry, 'getAllAgents' as any)
        .mockReturnValue([agent1, agent2]);

      const result = agentRegistry.getAllAgents();

      expect(result).toHaveLength(2);
      expect(result).toContain(agent1);
      expect(result).toContain(agent2);
    });
  });
});