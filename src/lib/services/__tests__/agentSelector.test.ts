import { AgentSelector } from '../agentSelector';
import { AgentRegistry } from '../agentRegistry';
import { ProjectType, AIAgent } from '../../types';

// Mock dependencies
jest.mock('../agentRegistry');

describe('AgentSelector', () => {
  let agentSelector: AgentSelector;
  let mockAgentRegistry: jest.Mocked<AgentRegistry>;

  beforeEach(() => {
    mockAgentRegistry = new AgentRegistry() as jest.Mocked<AgentRegistry>;
    agentSelector = new AgentSelector(mockAgentRegistry);
  });

  describe('getRequiredAgents', () => {
    it('should return orchestrator and specialists for loft conversion', () => {
      const loftOrchestrator: AIAgent = {
        id: 'loft-conversion-orchestrator',
        name: 'Loft Conversion Orchestrator',
        specialization: 'loft-conversion',
        projectTypes: ['loft_conversion_dormer' as ProjectType],
        promptTemplate: 'loft-conversion-prompt',
        knowledgeBase: {
          id: 'kb-001',
          domain: 'loft-conversion',
          facts: [],
          regulations: [],
          bestPractices: [],
          lastUpdated: new Date()
        },
        dependencies: ['electrical', 'plumbing', 'insulation'],
        isOrchestrator: true
      };

      const specialists: AIAgent[] = [
        {
          id: 'electrical-agent',
          name: 'Electrical Agent',
          specialization: 'electrical',
          projectTypes: [ProjectType.LOFT_CONVERSION],
          promptTemplate: 'electrical-prompt',
          knowledgeBase: {},
          dependencies: [],
          isOrchestrator: false
        },
        {
          id: 'plumbing-agent',
          name: 'Plumbing Agent',
          specialization: 'plumbing',
          projectTypes: [ProjectType.LOFT_CONVERSION],
          promptTemplate: 'plumbing-prompt',
          knowledgeBase: {},
          dependencies: [],
          isOrchestrator: false
        }
      ];

      mockAgentRegistry.getAgentsByProjectType.mockReturnValue([loftOrchestrator, ...specialists]);
      mockAgentRegistry.getOrchestratorAgent.mockReturnValue(loftOrchestrator);
      mockAgentRegistry.getSpecialistAgents.mockReturnValue(specialists);

      const result = agentSelector.getRequiredAgents(ProjectType.LOFT_CONVERSION);

      expect(result.orchestrator).toEqual(loftOrchestrator);
      expect(result.specialists).toEqual(specialists);
      expect(mockAgentRegistry.getAgentsByProjectType).toHaveBeenCalledWith(ProjectType.LOFT_CONVERSION);
    });

    it('should return only specialists for simple projects without orchestrator', () => {
      const specialists: AIAgent[] = [
        {
          id: 'windows-agent',
          name: 'Windows Agent',
          specialization: 'windows',
          projectTypes: [ProjectType.WINDOWS_REPLACEMENT],
          promptTemplate: 'windows-prompt',
          knowledgeBase: {},
          dependencies: [],
          isOrchestrator: false
        }
      ];

      mockAgentRegistry.getAgentsByProjectType.mockReturnValue(specialists);
      mockAgentRegistry.getOrchestratorAgent.mockReturnValue(undefined);
      mockAgentRegistry.getSpecialistAgents.mockReturnValue(specialists);

      const result = agentSelector.getRequiredAgents(ProjectType.WINDOWS_REPLACEMENT);

      expect(result.orchestrator).toBeUndefined();
      expect(result.specialists).toEqual(specialists);
    });

    it('should handle unknown project types gracefully', () => {
      mockAgentRegistry.getAgentsByProjectType.mockReturnValue([]);
      mockAgentRegistry.getOrchestratorAgent.mockReturnValue(undefined);
      mockAgentRegistry.getSpecialistAgents.mockReturnValue([]);

      const result = agentSelector.getRequiredAgents('UNKNOWN_PROJECT' as ProjectType);

      expect(result.orchestrator).toBeUndefined();
      expect(result.specialists).toEqual([]);
    });
  });

  describe('selectAgentsByDependencies', () => {
    it('should select agents based on dependency chain', () => {
      const agents: AIAgent[] = [
        {
          id: 'electrical-agent',
          name: 'Electrical Agent',
          specialization: 'electrical',
          projectTypes: [ProjectType.KITCHEN_RENOVATION],
          promptTemplate: 'electrical-prompt',
          knowledgeBase: {},
          dependencies: [],
          isOrchestrator: false
        },
        {
          id: 'plumbing-agent',
          name: 'Plumbing Agent',
          specialization: 'plumbing',
          projectTypes: [ProjectType.KITCHEN_RENOVATION],
          promptTemplate: 'plumbing-prompt',
          knowledgeBase: {},
          dependencies: ['electrical'],
          isOrchestrator: false
        }
      ];

      mockAgentRegistry.getAgentsBySpecialization.mockImplementation((spec) => {
        return agents.filter(agent => agent.specialization === spec);
      });

      const dependencies = ['electrical', 'plumbing'];
      const result = agentSelector.selectAgentsByDependencies(dependencies);

      expect(result).toHaveLength(2);
      expect(result.map(a => a.specialization)).toEqual(['electrical', 'plumbing']);
    });
  });

  describe('validateAgentCompatibility', () => {
    it('should validate that agents are compatible with project type', () => {
      const agents: AIAgent[] = [
        {
          id: 'kitchen-agent',
          name: 'Kitchen Agent',
          specialization: 'kitchen',
          projectTypes: ['kitchen_full_refit' as ProjectType],
          promptTemplate: 'kitchen-prompt',
          knowledgeBase: {
            id: 'kb-kitchen',
            domain: 'kitchen',
            facts: [],
            regulations: [],
            bestPractices: [],
            lastUpdated: new Date()
          },
          dependencies: [],
          isOrchestrator: true
        }
      ];

      const result = agentSelector.validateAgentCompatibility(agents, 'kitchen_full_refit' as ProjectType);

      expect(result).toBe(true);
    });

    it('should return false for incompatible agents', () => {
      const agents: AIAgent[] = [
        {
          id: 'kitchen-agent',
          name: 'Kitchen Agent',
          specialization: 'kitchen',
          projectTypes: ['kitchen_full_refit' as ProjectType],
          promptTemplate: 'kitchen-prompt',
          knowledgeBase: {
            id: 'kb-kitchen-2',
            domain: 'kitchen',
            facts: [],
            regulations: [],
            bestPractices: [],
            lastUpdated: new Date()
          },
          dependencies: [],
          isOrchestrator: true
        }
      ];

      const result = agentSelector.validateAgentCompatibility(agents, 'bathroom_full_refit' as ProjectType);

      expect(result).toBe(false);
    });
  });
});