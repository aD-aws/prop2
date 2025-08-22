import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { 
  AIAgent, 
  AgentResponse, 
  ProjectContext, 
  ProjectType, 
  KnowledgeBase 
} from '../types';

export interface AIPrompt {
  id: string;
  agentId: string;
  version: number;
  promptTemplate: string;
  systemPrompt: string;
  userPromptTemplate: string;
  parameters: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentInvocation {
  agentId: string;
  context: ProjectContext;
  promptVersion?: number;
  parameters?: Record<string, unknown>;
  requestType?: 'generate_questions' | 'generate_followup_questions' | 'generate_sow' | 'analyze_project';
  additionalData?: Record<string, any>;
}

export interface AgentOrchestrationResult {
  projectId: string;
  orchestratorAgent: string;
  invokedAgents: string[];
  responses: AgentResponse[];
  finalResult: {
    sowSections: any[];
    timeline: any[];
    materials: any[];
    laborRequirements: any[];
  };
  processingTime: number;
}

export class AIAgentService {
  private dynamoClient: DynamoDBDocumentClient;
  private agentsTable = 'uk-home-improvement-ai-agents';
  private promptsTable = 'uk-home-improvement-ai-prompts';
  private agentCache = new Map<string, AIAgent>();
  private promptCache = new Map<string, AIPrompt>();

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'eu-west-2'
    });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
  }

  /**
   * Register a new AI agent in the system
   */
  async registerAgent(agent: Omit<AIAgent, 'id'>): Promise<AIAgent> {
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAgent: AIAgent = {
      ...agent,
      id: agentId
    };

    await this.dynamoClient.send(new PutCommand({
      TableName: this.agentsTable,
      Item: {
        ...newAgent,
        knowledgeBase: {
          ...newAgent.knowledgeBase,
          lastUpdated: newAgent.knowledgeBase.lastUpdated.toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }));

    // Cache the agent
    this.agentCache.set(agentId, newAgent);

    return newAgent;
  }

  /**
   * Get an AI agent by ID
   */
  async getAgent(agentId: string): Promise<AIAgent | null> {
    // Check cache first
    if (this.agentCache.has(agentId)) {
      return this.agentCache.get(agentId)!;
    }

    try {
      const result = await this.dynamoClient.send(new GetCommand({
        TableName: this.agentsTable,
        Key: { id: agentId }
      }));

      if (result.Item) {
        const agent = result.Item as AIAgent;
        this.agentCache.set(agentId, agent);
        return agent;
      }
    } catch (error) {
      console.error('Error fetching agent:', error);
    }

    return null;
  }

  /**
   * Get all agents that can handle a specific project type
   */
  async getAgentsForProjectType(projectType: ProjectType): Promise<AIAgent[]> {
    try {
      const result = await this.dynamoClient.send(new QueryCommand({
        TableName: this.agentsTable,
        IndexName: 'ProjectTypeIndex',
        KeyConditionExpression: 'projectType = :projectType',
        ExpressionAttributeValues: {
          ':projectType': projectType
        }
      }));

      return (result.Items || []) as AIAgent[];
    } catch (error) {
      console.error('Error fetching agents for project type:', error);
      return [];
    }
  }

  /**
   * Store a new prompt version for an agent
   */
  async storePrompt(prompt: Omit<AIPrompt, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIPrompt> {
    const promptId = `prompt_${prompt.agentId}_v${prompt.version}`;
    const newPrompt: AIPrompt = {
      ...prompt,
      id: promptId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.dynamoClient.send(new PutCommand({
      TableName: this.promptsTable,
      Item: {
        ...newPrompt,
        createdAt: newPrompt.createdAt.toISOString(),
        updatedAt: newPrompt.updatedAt.toISOString()
      }
    }));

    // Cache the prompt
    this.promptCache.set(promptId, newPrompt);

    return newPrompt;
  }

  /**
   * Get the active prompt for an agent
   */
  async getActivePrompt(agentId: string): Promise<AIPrompt | null> {
    try {
      const result = await this.dynamoClient.send(new QueryCommand({
        TableName: this.promptsTable,
        IndexName: 'AgentActivePromptIndex',
        KeyConditionExpression: 'agentId = :agentId AND isActive = :isActive',
        ExpressionAttributeValues: {
          ':agentId': agentId,
          ':isActive': true
        },
        ScanIndexForward: false, // Get latest version first
        Limit: 1
      }));

      if (result.Items && result.Items.length > 0) {
        const prompt = result.Items[0] as AIPrompt;
        prompt.createdAt = new Date(prompt.createdAt);
        prompt.updatedAt = new Date(prompt.updatedAt);
        return prompt;
      }
    } catch (error) {
      console.error('Error fetching active prompt:', error);
    }

    return null;
  }

  /**
   * Update prompt version status
   */
  async updatePromptStatus(promptId: string, isActive: boolean): Promise<void> {
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.promptsTable,
      Key: { id: promptId },
      UpdateExpression: 'SET isActive = :isActive, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isActive': isActive,
        ':updatedAt': new Date().toISOString()
      }
    }));

    // Update cache
    if (this.promptCache.has(promptId)) {
      const prompt = this.promptCache.get(promptId)!;
      prompt.isActive = isActive;
      prompt.updatedAt = new Date();
    }
  }

  /**
   * Invoke an AI agent with Claude Sonnet 4
   */
  async invokeAgent(invocation: AgentInvocation): Promise<AgentResponse> {
    const { agentId, context, promptVersion, parameters = {}, requestType, additionalData = {} } = invocation;

    // Get the agent
    const agent = await this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Get the prompt (specific version or active)
    let prompt: AIPrompt | null;
    if (promptVersion) {
      const promptId = `prompt_${agentId}_v${promptVersion}`;
      prompt = this.promptCache.get(promptId) || null;
      if (!prompt) {
        // Try to fetch from database
        const result = await this.dynamoClient.send(new GetCommand({
          TableName: this.promptsTable,
          Key: { id: promptId }
        }));
        if (result.Item) {
          prompt = result.Item as AIPrompt;
          prompt.createdAt = new Date(prompt.createdAt);
          prompt.updatedAt = new Date(prompt.updatedAt);
        }
      }
    } else {
      prompt = await this.getActivePrompt(agentId);
    }

    if (!prompt) {
      throw new Error(`No active prompt found for agent ${agentId}`);
    }

    // Prepare the prompt with context
    const compiledPrompt = this.compilePrompt(prompt, context, parameters, requestType, additionalData);

    // Call Claude Sonnet 4 (placeholder for actual implementation)
    const claudeResponse = await this.callClaudeSonnet4(compiledPrompt, requestType);

    // Parse and structure the response
    const agentResponse: AgentResponse = {
      agentId,
      response: claudeResponse.content,
      confidence: claudeResponse.confidence || 0.8,
      recommendations: claudeResponse.recommendations || [],
      nextQuestions: claudeResponse.nextQuestions || [],
      data: claudeResponse.structuredData || {}
    };

    return agentResponse;
  }

  /**
   * Compile prompt template with context and parameters
   */
  private compilePrompt(
    prompt: AIPrompt, 
    context: ProjectContext, 
    parameters: Record<string, unknown>,
    requestType?: string,
    additionalData?: Record<string, any>
  ): string {
    let compiledPrompt = prompt.promptTemplate;

    // Replace context variables
    compiledPrompt = compiledPrompt.replace(/\{\{projectType\}\}/g, context.projectType);
    compiledPrompt = compiledPrompt.replace(/\{\{projectId\}\}/g, context.projectId);
    
    // Replace property information
    if (context.property) {
      compiledPrompt = compiledPrompt.replace(/\{\{propertyAddress\}\}/g, 
        `${context.property.address.line1}, ${context.property.address.city}, ${context.property.address.postcode}`);
      compiledPrompt = compiledPrompt.replace(/\{\{isListedBuilding\}\}/g, 
        context.property.isListedBuilding.toString());
      compiledPrompt = compiledPrompt.replace(/\{\{isInConservationArea\}\}/g, 
        context.property.isInConservationArea.toString());
    }

    // Replace user responses
    if (context.userResponses) {
      Object.entries(context.userResponses).forEach(([key, value]) => {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        compiledPrompt = compiledPrompt.replace(placeholder, String(value));
      });
    }

    // Replace additional parameters
    Object.entries(parameters).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      compiledPrompt = compiledPrompt.replace(placeholder, String(value));
    });

    // Add request type specific instructions
    if (requestType) {
      compiledPrompt += `\n\nRequest Type: ${requestType}`;
      
      if (requestType === 'generate_questions') {
        compiledPrompt += '\n\nPlease generate a list of relevant questions for this project type. Return the response in JSON format with a "questions" array containing question objects with id, text, type, options (if applicable), validation, and helpText fields.';
      } else if (requestType === 'generate_followup_questions') {
        compiledPrompt += '\n\nBased on the previous answer, generate follow-up questions if needed. Return empty array if no follow-up questions are required.';
      }
    }

    // Add additional data
    if (additionalData && Object.keys(additionalData).length > 0) {
      compiledPrompt += '\n\nAdditional Context:\n' + JSON.stringify(additionalData, null, 2);
    }

    return compiledPrompt;
  }

  /**
   * Call Claude Sonnet 4 API (placeholder implementation)
   */
  private async callClaudeSonnet4(prompt: string, requestType?: string): Promise<{
    content: string;
    confidence?: number;
    recommendations?: string[];
    nextQuestions?: string[];
    structuredData?: Record<string, unknown>;
  }> {
    // This is a placeholder implementation
    // In production, this would integrate with AWS Bedrock and Claude Sonnet 4
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock response based on request type
      let mockResponse;
      
      if (requestType === 'generate_questions') {
        mockResponse = {
          content: 'Generated questions for project planning',
          confidence: 0.9,
          recommendations: [],
          nextQuestions: [],
          structuredData: {
            questions: [
              {
                id: 'project_budget',
                text: 'What is your approximate budget for this project?',
                type: 'select',
                options: ['Under £5,000', '£5,000 - £15,000', '£15,000 - £30,000', '£30,000 - £50,000', '£50,000 - £100,000', 'Over £100,000'],
                validation: { required: true },
                helpText: 'This helps us provide accurate recommendations and material suggestions.'
              },
              {
                id: 'project_timeline',
                text: 'When would you like to start this project?',
                type: 'select',
                options: ['As soon as possible', 'Within 1-3 months', 'Within 3-6 months', 'Within 6-12 months', 'More than 12 months'],
                validation: { required: true }
              }
            ]
          }
        };
      } else if (requestType === 'generate_followup_questions') {
        mockResponse = {
          content: 'Generated follow-up questions',
          confidence: 0.85,
          recommendations: [],
          nextQuestions: [],
          structuredData: {
            questions: [] // Would contain follow-up questions based on previous answers
          }
        };
      } else {
        mockResponse = {
          content: `AI Agent Response for: ${prompt.substring(0, 100)}...`,
          confidence: 0.85,
          recommendations: [
            "Consider consulting with a structural engineer",
            "Ensure compliance with local building regulations",
            "Plan for proper ventilation and insulation"
          ],
          nextQuestions: [
            "What is your preferred timeline for completion?",
            "Do you have any specific material preferences?",
            "What is your budget range for this project?"
          ],
          structuredData: {
            estimatedDuration: "4-6 weeks",
            complexity: "medium",
            requiredTrades: ["electrician", "plumber", "carpenter"]
          }
        };
      }

      return mockResponse;
    } catch (error) {
      console.error('Error calling Claude Sonnet 4:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Get all registered agents
   */
  async getAllAgents(): Promise<AIAgent[]> {
    try {
      const result = await this.dynamoClient.send(new QueryCommand({
        TableName: this.agentsTable
      }));

      return (result.Items || []) as AIAgent[];
    } catch (error) {
      console.error('Error fetching all agents:', error);
      return [];
    }
  }

  /**
   * Update agent configuration
   */
  async updateAgent(agentId: string, updates: Partial<AIAgent>): Promise<AIAgent | null> {
    const agent = await this.getAgent(agentId);
    if (!agent) {
      return null;
    }

    const updatedAgent = { ...agent, ...updates };

    await this.dynamoClient.send(new PutCommand({
      TableName: this.agentsTable,
      Item: {
        ...updatedAgent,
        updatedAt: new Date().toISOString()
      }
    }));

    // Update cache
    this.agentCache.set(agentId, updatedAgent);

    return updatedAgent;
  }
}

export const aiAgentService = new AIAgentService();