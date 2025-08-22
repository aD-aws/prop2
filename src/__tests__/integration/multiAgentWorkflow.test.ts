import { AgentOrchestrator } from '../../lib/services/agentOrchestrator';
import { AgentSelector } from '../../lib/services/agentSelector';
import { AIAgentService } from '../../lib/services/aiAgentService';
import { PromptManager } from '../../lib/services/promptManager';
import { SoWGenerationService } from '../../lib/services/sowGenerationService';
import { ProjectType, ProjectContext } from '../../lib/types';

describe('Multi-Agent Workflow Integration Tests', () => {
  let orchestrator: AgentOrchestrator;
  let agentSelector: AgentSelector;
  let aiAgentService: AIAgentService;
  let promptManager: PromptManager;
  let sowService: SoWGenerationService;

  beforeEach(() => {
    // Initialize services with real implementations for integration testing
    promptManager = new PromptManager();
    aiAgentService = new AIAgentService();
    agentSelector = new AgentSelector();
    orchestrator = new AgentOrchestrator(agentSelector, aiAgentService, promptManager);
    sowService = new SoWGenerationService();
  });

  describe('Kitchen Renovation Workflow', () => {
    it('should complete full kitchen renovation workflow with multiple agents', async () => {
      const projectContext: ProjectContext = {
        projectId: 'integration-test-kitchen-001',
        projectType: ProjectType.KITCHEN_RENOVATION,
        propertyDetails: {
          propertyType: 'terraced',
          yearBuilt: 1960,
          currentKitchenSize: 'medium',
          structuralLimitations: ['load-bearing wall'],
          utilities: {
            gas: true,
            electricity: true,
            water: true
          }
        },
        userResponses: {
          budget: '£30000',
          timeline: '10 weeks',
          style: 'modern',
          appliances: 'integrated',
          flooring: 'tiles',
          worktops: 'quartz'
        },
        currentStep: 1
      };

      // Step 1: Select required agents
      const agents = await orchestrator.selectAgents(
        ProjectType.KITCHEN_RENOVATION,
        projectContext.propertyDetails
      );

      expect(agents.length).toBeGreaterThan(0);
      
      // Should include orchestrator and specialists
      const orchestratorAgent = agents.find(a => a.isOrchestrator);
      const specialists = agents.filter(a => !a.isOrchestrator);
      
      expect(orchestratorAgent).toBeDefined();
      expect(specialists.length).toBeGreaterThan(0);

      // Step 2: Coordinate agents to generate SoW
      const sowResult = await orchestrator.coordinateAgents(agents, projectContext);

      expect(sowResult).toBeDefined();
      expect(sowResult.sowDocument).toBeDefined();
      expect(sowResult.ganttChart).toBeDefined();

      // Validate SoW content
      expect(sowResult.sowDocument.projectId).toBe(projectContext.projectId);
      expect(sowResult.sowDocument.sections.length).toBeGreaterThan(0);
      expect(sowResult.sowDocument.materials.length).toBeGreaterThan(0);
      expect(sowResult.sowDocument.laborRequirements.length).toBeGreaterThan(0);
      expect(sowResult.sowDocument.estimatedCosts.total).toBeGreaterThan(0);

      // Validate timeline
      expect(sowResult.ganttChart.tasks.length).toBeGreaterThan(0);
      expect(sowResult.ganttChart.totalDuration).toBeGreaterThan(0);
    }, 30000); // Extended timeout for integration test

    it('should handle complex kitchen renovation with structural changes', async () => {
      const projectContext: ProjectContext = {
        projectId: 'integration-test-kitchen-002',
        projectType: ProjectType.KITCHEN_RENOVATION,
        propertyDetails: {
          propertyType: 'detached',
          yearBuilt: 1950,
          currentKitchenSize: 'small',
          structuralChanges: ['wall removal', 'beam installation'],
          utilities: {
            gas: true,
            electricity: true,
            water: true
          }
        },
        userResponses: {
          budget: '£50000',
          timeline: '14 weeks',
          structuralWork: 'yes',
          planningPermission: 'required'
        },
        currentStep: 1
      };

      const agents = await orchestrator.selectAgents(
        ProjectType.KITCHEN_RENOVATION,
        projectContext.propertyDetails
      );

      // Should include structural engineering agent for complex work
      const structuralAgent = agents.find(a => 
        a.specialization === 'structural-engineering'
      );
      expect(structuralAgent).toBeDefined();

      const sowResult = await orchestrator.coordinateAgents(agents, projectContext);

      // Should include regulatory requirements for structural work
      expect(sowResult.sowDocument.regulatoryRequirements.length).toBeGreaterThan(0);
      expect(sowResult.sowDocument.regulatoryRequirements).toContain(
        expect.objectContaining({
          type: 'building-regulations'
        })
      );
    }, 30000);
  });

  describe('Bathroom Renovation Workflow', () => {
    it('should complete bathroom renovation with accessibility requirements', async () => {
      const projectContext: ProjectContext = {
        projectId: 'integration-test-bathroom-001',
        projectType: ProjectType.BATHROOM_RENOVATION,
        propertyDetails: {
          propertyType: 'bungalow',
          yearBuilt: 1980,
          currentBathroomSize: 'standard',
          accessibility: {
            wheelchairAccess: true,
            grabRails: true,
            levelAccess: true
          }
        },
        userResponses: {
          budget: '£20000',
          timeline: '8 weeks',
          accessibility: 'full',
          fixtures: 'accessible'
        },
        currentStep: 1
      };

      const agents = await orchestrator.selectAgents(
        ProjectType.BATHROOM_RENOVATION,
        projectContext.propertyDetails
      );

      const sowResult = await orchestrator.coordinateAgents(agents, projectContext);

      // Should include accessibility-specific materials and requirements
      const accessibilityMaterials = sowResult.sowDocument.materials.filter(m =>
        m.description.toLowerCase().includes('accessible') ||
        m.description.toLowerCase().includes('grab rail') ||
        m.description.toLowerCase().includes('level access')
      );

      expect(accessibilityMaterials.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Loft Conversion Workflow', () => {
    it('should handle complex loft conversion with planning permission', async () => {
      const projectContext: ProjectContext = {
        projectId: 'integration-test-loft-001',
        projectType: ProjectType.LOFT_CONVERSION,
        propertyDetails: {
          propertyType: 'terraced',
          yearBuilt: 1930,
          loftSpace: {
            headHeight: '2.1m',
            floorArea: '25sqm',
            access: 'none'
          },
          planningConstraints: ['conservation area']
        },
        userResponses: {
          budget: '£40000',
          timeline: '16 weeks',
          use: 'bedroom',
          ensuite: 'yes',
          dormerWindows: 'yes'
        },
        currentStep: 1
      };

      const agents = await orchestrator.selectAgents(
        ProjectType.LOFT_CONVERSION,
        projectContext.propertyDetails
      );

      const sowResult = await orchestrator.coordinateAgents(agents, projectContext);

      // Should include planning permission requirements
      expect(sowResult.sowDocument.regulatoryRequirements).toContain(
        expect.objectContaining({
          type: 'planning-permission'
        })
      );

      // Should include structural work for dormer windows
      const structuralTasks = sowResult.ganttChart.tasks.filter(t =>
        t.name.toLowerCase().includes('structural') ||
        t.name.toLowerCase().includes('dormer')
      );

      expect(structuralTasks.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Error Handling and Recovery', () => {
    it('should handle agent failure gracefully', async () => {
      const projectContext: ProjectContext = {
        projectId: 'integration-test-error-001',
        projectType: ProjectType.KITCHEN_RENOVATION,
        propertyDetails: {},
        userResponses: {},
        currentStep: 1
      };

      // Mock a failing agent
      jest.spyOn(aiAgentService, 'invokeAgent').mockRejectedValueOnce(
        new Error('Agent service unavailable')
      );

      const agents = await orchestrator.selectAgents(
        ProjectType.KITCHEN_RENOVATION,
        {}
      );

      // Should handle the error and potentially retry or use fallback
      await expect(
        orchestrator.coordinateAgents(agents, projectContext)
      ).rejects.toThrow();
    });

    it('should validate agent compatibility before workflow execution', async () => {
      const projectContext: ProjectContext = {
        projectId: 'integration-test-validation-001',
        projectType: ProjectType.BATHROOM_RENOVATION,
        propertyDetails: {},
        userResponses: {},
        currentStep: 1
      };

      // Try to use kitchen agents for bathroom project
      const incompatibleAgents = await orchestrator.selectAgents(
        ProjectType.KITCHEN_RENOVATION,
        {}
      );

      const isCompatible = agentSelector.validateAgentCompatibility(
        incompatibleAgents,
        ProjectType.BATHROOM_RENOVATION
      );

      expect(isCompatible).toBe(false);
    });
  });

  describe('Performance and Scalability', () => {
    it('should complete workflow within acceptable time limits', async () => {
      const startTime = Date.now();

      const projectContext: ProjectContext = {
        projectId: 'integration-test-performance-001',
        projectType: ProjectType.KITCHEN_RENOVATION,
        propertyDetails: {
          propertyType: 'detached',
          yearBuilt: 1990
        },
        userResponses: {
          budget: '£25000',
          timeline: '8 weeks'
        },
        currentStep: 1
      };

      const agents = await orchestrator.selectAgents(
        ProjectType.KITCHEN_RENOVATION,
        projectContext.propertyDetails
      );

      const sowResult = await orchestrator.coordinateAgents(agents, projectContext);

      const executionTime = Date.now() - startTime;

      expect(sowResult).toBeDefined();
      expect(executionTime).toBeLessThan(15000); // Should complete within 15 seconds
    }, 20000);
  });
});