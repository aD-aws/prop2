import { 
  AIAgent, 
  AgentResponse, 
  ProjectContext, 
  ProjectType, 
  SoWDocument,
  GanttChart,
  TaskTimeline,
  MaterialSpecification,
  LaborRequirement
} from '../types';
import { aiAgentService, AgentOrchestrationResult } from './aiAgentService';
import { agentSelector } from './agentSelector';

export interface OrchestrationPlan {
  orchestratorAgent?: AIAgent;
  specialistAgents: AIAgent[];
  executionOrder: string[];
  parallelGroups: string[][];
}

export interface OrchestrationContext extends ProjectContext {
  orchestrationId: string;
  startTime: Date;
  currentPhase: 'planning' | 'execution' | 'optimization' | 'completion';
  agentResponses: Map<string, AgentResponse>;
}

export class AgentOrchestrator {
  private activeOrchestrations = new Map<string, OrchestrationContext>();

  /**
   * Orchestrate multiple AI agents for complex project planning
   */
  async orchestrateProject(context: ProjectContext): Promise<AgentOrchestrationResult> {
    const orchestrationId = `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();

    // Create orchestration context
    const orchContext: OrchestrationContext = {
      ...context,
      orchestrationId,
      startTime,
      currentPhase: 'planning',
      agentResponses: new Map()
    };

    this.activeOrchestrations.set(orchestrationId, orchContext);

    try {
      // Phase 1: Planning - Determine required agents
      orchContext.currentPhase = 'planning';
      const plan = await this.createOrchestrationPlan(context);

      // Phase 2: Execution - Invoke agents in planned order
      orchContext.currentPhase = 'execution';
      const responses = await this.executeOrchestrationPlan(plan, orchContext);

      // Phase 3: Optimization - Coordinate timeline and dependencies
      orchContext.currentPhase = 'optimization';
      const optimizedResult = await this.optimizeResults(responses, orchContext);

      // Phase 4: Completion - Finalize and structure output
      orchContext.currentPhase = 'completion';
      const finalResult = await this.finalizeOrchestration(optimizedResult, orchContext);

      const processingTime = Date.now() - startTime.getTime();

      const result: AgentOrchestrationResult = {
        projectId: context.projectId,
        orchestratorAgent: plan.orchestratorAgent?.id || 'none',
        invokedAgents: responses.map(r => r.agentId),
        responses,
        finalResult,
        processingTime
      };

      return result;
    } finally {
      // Clean up orchestration context
      this.activeOrchestrations.delete(orchestrationId);
    }
  }

  /**
   * Create an orchestration plan based on project requirements
   */
  private async createOrchestrationPlan(context: ProjectContext): Promise<OrchestrationPlan> {
    // Use agent selector to determine required agents
    const requiredAgents = await agentSelector.getRequiredAgents(context.projectType);

    // Determine execution order based on dependencies
    const executionOrder = this.calculateExecutionOrder(requiredAgents);

    // Identify parallel execution groups
    const parallelGroups = this.identifyParallelGroups(requiredAgents);

    return {
      orchestratorAgent: requiredAgents.orchestrator,
      specialistAgents: requiredAgents.specialists,
      executionOrder,
      parallelGroups
    };
  }

  /**
   * Execute the orchestration plan
   */
  private async executeOrchestrationPlan(
    plan: OrchestrationPlan, 
    orchContext: OrchestrationContext
  ): Promise<AgentResponse[]> {
    const responses: AgentResponse[] = [];

    // Start with orchestrator if present
    if (plan.orchestratorAgent) {
      const orchResponse = await aiAgentService.invokeAgent({
        agentId: plan.orchestratorAgent.id,
        context: orchContext
      });
      responses.push(orchResponse);
      orchContext.agentResponses.set(plan.orchestratorAgent.id, orchResponse);

      // Update context with orchestrator insights
      orchContext.userResponses = {
        ...orchContext.userResponses,
        ...orchResponse.data
      };
    }

    // Execute specialist agents in parallel groups
    for (const parallelGroup of plan.parallelGroups) {
      const groupPromises = parallelGroup.map(async (agentId) => {
        const agent = plan.specialistAgents.find(a => a.id === agentId);
        if (!agent) return null;

        // Update context with previous responses
        const updatedContext = {
          ...orchContext,
          previousAgentResponses: Array.from(orchContext.agentResponses.values())
        };

        const response = await aiAgentService.invokeAgent({
          agentId,
          context: updatedContext
        });

        orchContext.agentResponses.set(agentId, response);
        return response;
      });

      const groupResponses = await Promise.all(groupPromises);
      responses.push(...groupResponses.filter(r => r !== null) as AgentResponse[]);
    }

    return responses;
  }

  /**
   * Optimize results by coordinating agent outputs
   */
  private async optimizeResults(
    responses: AgentResponse[], 
    orchContext: OrchestrationContext
  ): Promise<{
    sowSections: any[];
    timeline: TaskTimeline[];
    materials: MaterialSpecification[];
    laborRequirements: LaborRequirement[];
  }> {
    // Invoke Timeline Optimization Agent
    const timelineAgent = await aiAgentService.getAgent('timeline_optimization_agent');
    if (timelineAgent) {
      const timelineResponse = await aiAgentService.invokeAgent({
        agentId: timelineAgent.id,
        context: {
          ...orchContext,
          previousAgentResponses: responses
        }
      });
      responses.push(timelineResponse);
    }

    // Consolidate all agent outputs
    const sowSections = this.consolidateSoWSections(responses);
    const timeline = this.consolidateTimeline(responses);
    const materials = this.consolidateMaterials(responses);
    const laborRequirements = this.consolidateLaborRequirements(responses);

    return {
      sowSections,
      timeline,
      materials,
      laborRequirements
    };
  }

  /**
   * Finalize orchestration and prepare structured output
   */
  private async finalizeOrchestration(
    optimizedResult: any,
    orchContext: OrchestrationContext
  ): Promise<{
    sowSections: any[];
    timeline: any[];
    materials: any[];
    laborRequirements: any[];
  }> {
    // Apply final validation and formatting
    return {
      sowSections: optimizedResult.sowSections,
      timeline: optimizedResult.timeline,
      materials: optimizedResult.materials,
      laborRequirements: optimizedResult.laborRequirements
    };
  }

  /**
   * Calculate execution order based on agent dependencies
   */
  private calculateExecutionOrder(requiredAgents: {
    orchestrator?: AIAgent;
    specialists: AIAgent[];
  }): string[] {
    const order: string[] = [];

    // Orchestrator goes first if present
    if (requiredAgents.orchestrator) {
      order.push(requiredAgents.orchestrator.id);
    }

    // Sort specialists by dependencies
    const remaining = [...requiredAgents.specialists];
    const processed = new Set<string>();

    while (remaining.length > 0) {
      const canProcess = remaining.filter(agent => 
        agent.dependencies.every(dep => processed.has(dep))
      );

      if (canProcess.length === 0) {
        // No dependencies, add remaining agents
        remaining.forEach(agent => order.push(agent.id));
        break;
      }

      canProcess.forEach(agent => {
        order.push(agent.id);
        processed.add(agent.id);
        const index = remaining.indexOf(agent);
        remaining.splice(index, 1);
      });
    }

    return order;
  }

  /**
   * Identify groups of agents that can run in parallel
   */
  private identifyParallelGroups(requiredAgents: {
    orchestrator?: AIAgent;
    specialists: AIAgent[];
  }): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();

    // Group agents with no dependencies or same dependencies
    const remaining = [...requiredAgents.specialists];

    while (remaining.length > 0) {
      const currentGroup: string[] = [];
      const firstAgent = remaining[0];
      
      // Find all agents with same dependency pattern
      const samePattern = remaining.filter(agent => 
        this.haveSameDependencies(agent.dependencies, firstAgent.dependencies) &&
        agent.dependencies.every(dep => processed.has(dep))
      );

      samePattern.forEach(agent => {
        currentGroup.push(agent.id);
        processed.add(agent.id);
        const index = remaining.indexOf(agent);
        remaining.splice(index, 1);
      });

      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
    }

    return groups;
  }

  /**
   * Check if two dependency arrays are the same
   */
  private haveSameDependencies(deps1: string[], deps2: string[]): boolean {
    if (deps1.length !== deps2.length) return false;
    return deps1.every(dep => deps2.includes(dep));
  }

  /**
   * Consolidate SoW sections from all agent responses
   */
  private consolidateSoWSections(responses: AgentResponse[]): any[] {
    const sections: any[] = [];

    responses.forEach(response => {
      if (response.data.sowSections && Array.isArray(response.data.sowSections)) {
        sections.push(...response.data.sowSections);
      }
    });

    return sections;
  }

  /**
   * Consolidate timeline from all agent responses
   */
  private consolidateTimeline(responses: AgentResponse[]): TaskTimeline[] {
    const tasks: TaskTimeline[] = [];

    responses.forEach(response => {
      if (response.data.timeline && Array.isArray(response.data.timeline)) {
        tasks.push(...response.data.timeline);
      }
    });

    return tasks;
  }

  /**
   * Consolidate materials from all agent responses
   */
  private consolidateMaterials(responses: AgentResponse[]): MaterialSpecification[] {
    const materials: MaterialSpecification[] = [];

    responses.forEach(response => {
      if (response.data.materials && Array.isArray(response.data.materials)) {
        materials.push(...response.data.materials);
      }
    });

    return materials;
  }

  /**
   * Consolidate labor requirements from all agent responses
   */
  private consolidateLaborRequirements(responses: AgentResponse[]): LaborRequirement[] {
    const laborReqs: LaborRequirement[] = [];

    responses.forEach(response => {
      if (response.data.laborRequirements && Array.isArray(response.data.laborRequirements)) {
        laborReqs.push(...response.data.laborRequirements);
      }
    });

    return laborReqs;
  }

  /**
   * Get orchestration status
   */
  getOrchestrationStatus(orchestrationId: string): OrchestrationContext | null {
    return this.activeOrchestrations.get(orchestrationId) || null;
  }

  /**
   * Cancel an active orchestration
   */
  cancelOrchestration(orchestrationId: string): boolean {
    return this.activeOrchestrations.delete(orchestrationId);
  }
}

export const agentOrchestrator = new AgentOrchestrator();