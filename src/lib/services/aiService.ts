import { 
  ProjectContext, 
  ProjectType, 
  SoWDocument, 
  GanttChart,
  AgentResponse 
} from '../types';
import { aiAgentService, AgentOrchestrationResult } from './aiAgentService';
import { agentOrchestrator } from './agentOrchestrator';
import { agentSelector } from './agentSelector';
import { agentRegistry } from './agentRegistry';
import { promptManager } from './promptManager';

export interface SoWGenerationRequest {
  projectId: string;
  projectType: ProjectType;
  propertyId: string;
  userResponses: Record<string, unknown>;
  customDescription?: string; // For "others" projects
}

export interface SoWGenerationResult {
  sowDocument: SoWDocument;
  ganttChart: GanttChart;
  processingTime: number;
  agentsUsed: string[];
  orchestrationId: string;
}

export interface AIServiceStatus {
  initialized: boolean;
  agentsRegistered: number;
  promptsCreated: number;
  activeOrchestrations: number;
}

export class AIService {
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the AI service and all agents
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('Initializing AI Service...');
      
      // Initialize agent registry (registers all agents and creates prompts)
      await agentRegistry.initializeAgents();
      
      console.log('AI Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Service:', error);
      this.initializationPromise = null; // Reset so it can be retried
      throw error;
    }
  }

  /**
   * Generate Scope of Work using multi-agent AI system
   */
  async generateSoW(request: SoWGenerationRequest): Promise<SoWGenerationResult> {
    // Ensure AI service is initialized
    await this.initialize();

    const startTime = Date.now();

    try {
      // Create project context
      const context: ProjectContext = {
        projectId: request.projectId,
        projectType: request.projectType,
        property: {} as any, // Would be fetched from property service
        userResponses: request.userResponses,
        previousAgentResponses: []
      };

      // Handle "others" project type with AI analysis
      if (request.projectType === 'others' && request.customDescription) {
        context.userResponses.projectDescription = request.customDescription;
        
        // Analyze the custom description to determine project type and agents
        const analysisResult = await agentSelector.analyzeOthersProject(request.customDescription);
        
        // Update context with analysis results
        context.userResponses.aiAnalysis = analysisResult;
      }

      // Orchestrate the multi-agent process
      const orchestrationResult = await agentOrchestrator.orchestrateProject(context);

      // Generate SoW document from orchestration results
      const sowDocument = await this.createSoWDocument(orchestrationResult, request);

      // Generate Gantt chart from timeline data
      const ganttChart = await this.createGanttChart(orchestrationResult, request);

      const processingTime = Date.now() - startTime;

      return {
        sowDocument,
        ganttChart,
        processingTime,
        agentsUsed: orchestrationResult.invokedAgents,
        orchestrationId: orchestrationResult.projectId
      };
    } catch (error) {
      console.error('Error generating SoW:', error);
      throw new Error(`Failed to generate SoW: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create SoW document from orchestration results
   */
  private async createSoWDocument(
    orchestrationResult: AgentOrchestrationResult,
    request: SoWGenerationRequest
  ): Promise<SoWDocument> {
    const sowId = `sow_${request.projectId}_${Date.now()}`;

    return {
      id: sowId,
      projectId: request.projectId,
      version: 1,
      sections: orchestrationResult.finalResult.sowSections || [],
      materials: orchestrationResult.finalResult.materials || [],
      laborRequirements: orchestrationResult.finalResult.laborRequirements || [],
      timeline: orchestrationResult.finalResult.timeline || [],
      estimatedCosts: {
        totalEstimate: 0, // Would be calculated from materials and labor
        laborCosts: 0,
        materialCosts: 0,
        builderMaterials: 0,
        homeownerMaterials: 0,
        breakdown: []
      },
      regulatoryRequirements: [], // Would be extracted from agent responses
      generatedAt: new Date()
    };
  }

  /**
   * Create Gantt chart from orchestration results
   */
  private async createGanttChart(
    orchestrationResult: AgentOrchestrationResult,
    request: SoWGenerationRequest
  ): Promise<GanttChart> {
    const ganttId = `gantt_${request.projectId}_${Date.now()}`;

    return {
      id: ganttId,
      projectId: request.projectId,
      tasks: [], // Would be converted from timeline data
      totalDuration: 0, // Would be calculated from tasks
      criticalPath: [], // Would be determined by timeline optimization agent
      generatedAt: new Date()
    };
  }

  /**
   * Regenerate SoW with modifications
   */
  async regenerateSoW(
    originalRequest: SoWGenerationRequest,
    modifications: Record<string, unknown>
  ): Promise<SoWGenerationResult> {
    const modifiedRequest = {
      ...originalRequest,
      userResponses: {
        ...originalRequest.userResponses,
        ...modifications
      }
    };

    return this.generateSoW(modifiedRequest);
  }

  /**
   * Get AI service status
   */
  async getStatus(): Promise<AIServiceStatus> {
    const initialized = agentRegistry.isInitialized();
    
    let agentsRegistered = 0;
    let promptsCreated = 0;
    let activeOrchestrations = 0;

    if (initialized) {
      try {
        const agents = await aiAgentService.getAllAgents();
        agentsRegistered = agents.length;

        // Count prompts (simplified - would need proper counting)
        promptsCreated = 50; // Placeholder

        // Count active orchestrations (would need proper tracking)
        activeOrchestrations = 0; // Placeholder
      } catch (error) {
        console.error('Error getting AI service status:', error);
      }
    }

    return {
      initialized,
      agentsRegistered,
      promptsCreated,
      activeOrchestrations
    };
  }

  /**
   * Test AI agent functionality
   */
  async testAgent(agentId: string, testInput: Record<string, unknown>): Promise<AgentResponse> {
    await this.initialize();

    const testContext: ProjectContext = {
      projectId: 'test_project',
      projectType: 'kitchen_full_refit',
      property: {} as any,
      userResponses: testInput,
      previousAgentResponses: []
    };

    return aiAgentService.invokeAgent({
      agentId,
      context: testContext
    });
  }

  /**
   * Get available project types and their complexity
   */
  async getProjectTypeComplexity(): Promise<Record<ProjectType, 'low' | 'medium' | 'high'>> {
    await this.initialize();

    const complexityMap: Record<string, 'low' | 'medium' | 'high'> = {};
    
    // Get all project types from the enum
    const projectTypes = Object.values({
      // This would include all ProjectType enum values
      // For now, showing a few examples
      'kitchen_full_refit': 'medium',
      'loft_conversion_dormer': 'high',
      'electrical_rewiring': 'low',
      'bathroom_full_refit': 'medium'
    });

    return complexityMap as Record<ProjectType, 'low' | 'medium' | 'high'>;
  }

  /**
   * Get agents required for a project type
   */
  async getRequiredAgents(projectType: ProjectType): Promise<{
    orchestrator?: string;
    specialists: string[];
  }> {
    await this.initialize();

    const result = await agentSelector.getRequiredAgents(projectType);
    
    return {
      orchestrator: result.orchestrator?.id,
      specialists: result.specialists.map(agent => agent.id)
    };
  }

  /**
   * Update agent prompt
   */
  async updateAgentPrompt(
    agentId: string,
    newPrompt: string,
    changelog: string,
    updatedBy: string
  ): Promise<void> {
    await this.initialize();

    // Get prompts by category to find the agent's prompt
    const prompts = await promptManager.getPromptsByCategory('specialist');
    const agentPrompt = prompts.find(p => p.name.toLowerCase().includes(agentId.toLowerCase()));
    
    if (!agentPrompt) {
      throw new Error(`No prompt found for agent ${agentId}`);
    }

    // Create a new version of the prompt with updated template
    await promptManager.createPrompt({
      name: agentPrompt.name,
      description: agentPrompt.description,
      category: agentPrompt.category,
      template: newPrompt,
      variables: agentPrompt.variables,
      version: agentPrompt.version + 1,
      isActive: true,
      createdBy: updatedBy
    });
  }

  /**
   * Get agent performance metrics
   */
  async getAgentMetrics(agentId: string): Promise<any> {
    await this.initialize();

    // Get prompts by category to find the agent's prompt
    const prompts = await promptManager.getPromptsByCategory('specialist');
    const agentPrompt = prompts.find(p => p.name.toLowerCase().includes(agentId.toLowerCase()));
    
    if (!agentPrompt) {
      return null;
    }

    return promptManager.getPromptMetrics(agentPrompt.id, agentPrompt.version);
  }

  /**
   * Generate AI insights for builder analytics
   */
  async generateInsights(prompt: string): Promise<string> {
    await this.initialize();

    try {
      // Use a general AI agent for insights generation
      const insightsAgent = await aiAgentService.getAgent('insights-agent');
      
      if (!insightsAgent) {
        throw new Error('Insights agent not available');
      }

      const testContext: ProjectContext = {
        projectId: 'insights_analysis',
        projectType: 'others',
        property: {} as any,
        userResponses: { analysisPrompt: prompt },
        previousAgentResponses: []
      };

      const response = await aiAgentService.invokeAgent({
        agentId: 'insights-agent',
        context: testContext
      });

      return response.response || 'Unable to generate insights at this time.';
    } catch (error) {
      console.error('Error generating AI insights:', error);
      throw new Error('Failed to generate AI insights');
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cancel any active orchestrations
    // Clear caches
    // Close connections
    console.log('AI Service cleanup completed');
  }
}

export const aiService = new AIService();