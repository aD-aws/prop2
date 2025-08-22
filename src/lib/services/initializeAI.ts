import { aiService } from './aiService';

/**
 * Initialize AI system on application startup
 */
export async function initializeAI(): Promise<void> {
  try {
    console.log('Starting AI system initialization...');
    
    // Initialize the AI service (this will register all agents and create prompts)
    await aiService.initialize();
    
    // Get initialization status
    const status = await aiService.getStatus();
    
    console.log('AI system initialization completed:', {
      initialized: status.initialized,
      agentsRegistered: status.agentsRegistered,
      promptsCreated: status.promptsCreated
    });
    
    if (!status.initialized) {
      throw new Error('AI system failed to initialize properly');
    }
    
  } catch (error) {
    console.error('Failed to initialize AI system:', error);
    throw error;
  }
}

/**
 * Health check for AI system
 */
export async function checkAIHealth(): Promise<{
  healthy: boolean;
  status: any;
  error?: string;
}> {
  try {
    const status = await aiService.getStatus();
    
    return {
      healthy: status.initialized && status.agentsRegistered > 0,
      status
    };
  } catch (error) {
    return {
      healthy: false,
      status: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test AI system functionality
 */
export async function testAISystem(): Promise<{
  success: boolean;
  results: any[];
  errors: string[];
}> {
  const results: any[] = [];
  const errors: string[] = [];
  
  try {
    // Test basic agent functionality
    const testCases = [
      {
        name: 'Kitchen Orchestrator Test',
        agentId: 'kitchen_orchestrator',
        input: {
          kitchenSize: '4m x 3m',
          budget: '20000',
          style: 'modern'
        }
      },
      {
        name: 'Electrical Agent Test',
        agentId: 'electrical_agent',
        input: {
          roomType: 'kitchen',
          currentWiring: 'old',
          requirements: 'full_upgrade'
        }
      },
      {
        name: 'Plumbing Agent Test',
        agentId: 'plumbing_agent',
        input: {
          roomType: 'bathroom',
          fixtures: 'bath_shower_toilet_basin',
          waterPressure: 'low'
        }
      }
    ];
    
    for (const testCase of testCases) {
      try {
        const response = await aiService.testAgent(testCase.agentId, testCase.input);
        results.push({
          testName: testCase.name,
          agentId: testCase.agentId,
          success: true,
          response: {
            confidence: response.confidence,
            hasRecommendations: response.recommendations.length > 0,
            hasNextQuestions: response.nextQuestions.length > 0,
            responseLength: response.response.length
          }
        });
      } catch (error) {
        errors.push(`${testCase.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        results.push({
          testName: testCase.name,
          agentId: testCase.agentId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Test SoW generation
    try {
      const sowResult = await aiService.generateSoW({
        projectId: 'test_project_health_check',
        projectType: 'kitchen_full_refit',
        propertyId: 'test_property_health_check',
        userResponses: {
          kitchenSize: 'medium',
          budget: '25000',
          timeline: 'flexible'
        }
      });
      
      results.push({
        testName: 'SoW Generation Test',
        success: true,
        response: {
          processingTime: sowResult.processingTime,
          agentsUsed: sowResult.agentsUsed.length,
          hasSoW: !!sowResult.sowDocument,
          hasGantt: !!sowResult.ganttChart
        }
      });
    } catch (error) {
      errors.push(`SoW Generation Test: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push({
        testName: 'SoW Generation Test',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return {
      success: errors.length === 0,
      results,
      errors
    };
    
  } catch (error) {
    errors.push(`Test system error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      results,
      errors
    };
  }
}

/**
 * Get AI system metrics
 */
export async function getAIMetrics(): Promise<{
  systemStatus: any;
  agentMetrics: any[];
  performanceMetrics: {
    averageResponseTime: number;
    successRate: number;
    totalRequests: number;
  };
}> {
  try {
    const systemStatus = await aiService.getStatus();
    
    // Get metrics for key agents
    const keyAgents = [
      'kitchen_orchestrator',
      'bathroom_orchestrator',
      'loft_conversion_orchestrator',
      'extension_orchestrator',
      'electrical_agent',
      'plumbing_agent'
    ];
    
    const agentMetrics = [];
    for (const agentId of keyAgents) {
      try {
        const metrics = await aiService.getAgentMetrics(agentId);
        agentMetrics.push({
          agentId,
          metrics: metrics || { noData: true }
        });
      } catch (error) {
        agentMetrics.push({
          agentId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Calculate overall performance metrics
    const performanceMetrics = {
      averageResponseTime: 2500, // Placeholder - would be calculated from actual metrics
      successRate: 0.95, // Placeholder - would be calculated from actual metrics
      totalRequests: 0 // Placeholder - would be tracked in production
    };
    
    return {
      systemStatus,
      agentMetrics,
      performanceMetrics
    };
    
  } catch (error) {
    throw new Error(`Failed to get AI metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}