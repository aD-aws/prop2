import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { AIPrompt } from './aiAgentService';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'orchestrator' | 'specialist' | 'analysis' | 'optimization';
  template: string;
  variables: PromptVariable[];
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    options?: string[];
  };
}

export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  template: string;
  changelog: string;
  performanceMetrics?: PromptMetrics;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface PromptMetrics {
  averageResponseTime: number;
  successRate: number;
  userSatisfactionScore: number;
  usageCount: number;
  errorRate: number;
  lastEvaluated: Date;
}

export interface PromptTestResult {
  promptId: string;
  version: number;
  testCases: TestCase[];
  overallScore: number;
  passedTests: number;
  failedTests: number;
  executedAt: Date;
}

export interface TestCase {
  id: string;
  name: string;
  input: Record<string, unknown>;
  expectedOutput: any;
  actualOutput?: any;
  passed: boolean;
  score: number;
  executionTime: number;
}

export class PromptManager {
  private dynamoClient: DynamoDBDocumentClient;
  private promptsTable = 'uk-home-improvement-ai-prompts';
  private promptVersionsTable = 'uk-home-improvement-ai-prompt-versions';
  private promptMetricsTable = 'uk-home-improvement-ai-prompt-metrics';
  private promptTestsTable = 'uk-home-improvement-ai-prompt-tests';

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'eu-west-2'
    });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
  }

  /**
   * Create a new prompt template
   */
  async createPrompt(prompt: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptTemplate> {
    const promptId = `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newPrompt: PromptTemplate = {
      ...prompt,
      id: promptId,
      createdAt: now,
      updatedAt: now
    };

    await this.dynamoClient.send(new PutCommand({
      TableName: this.promptsTable,
      Item: {
        ...newPrompt,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    }));

    // Create initial version
    await this.createPromptVersion(promptId, prompt.template, 'Initial version', prompt.createdBy);

    return newPrompt;
  }

  /**
   * Get a prompt template by ID
   */
  async getPrompt(promptId: string): Promise<PromptTemplate | null> {
    try {
      const result = await this.dynamoClient.send(new GetCommand({
        TableName: this.promptsTable,
        Key: { id: promptId }
      }));

      if (result.Item) {
        const prompt = result.Item as PromptTemplate;
        prompt.createdAt = new Date(prompt.createdAt);
        prompt.updatedAt = new Date(prompt.updatedAt);
        return prompt;
      }
    } catch (error) {
      console.error('Error fetching prompt:', error);
    }

    return null;
  }

  /**
   * Update a prompt template
   */
  async updatePrompt(
    promptId: string, 
    updates: Partial<PromptTemplate>, 
    changelog: string,
    updatedBy: string
  ): Promise<PromptTemplate | null> {
    const existingPrompt = await this.getPrompt(promptId);
    if (!existingPrompt) {
      return null;
    }

    const updatedPrompt = {
      ...existingPrompt,
      ...updates,
      updatedAt: new Date()
    };

    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.promptsTable,
      Key: { id: promptId },
      UpdateExpression: 'SET #template = :template, #variables = :variables, #version = :version, #isActive = :isActive, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#template': 'template',
        '#variables': 'variables',
        '#version': 'version',
        '#isActive': 'isActive',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':template': updates.template || existingPrompt.template,
        ':variables': updates.variables || existingPrompt.variables,
        ':version': (existingPrompt.version || 0) + 1,
        ':isActive': updates.isActive !== undefined ? updates.isActive : existingPrompt.isActive,
        ':updatedAt': updatedPrompt.updatedAt.toISOString()
      }
    }));

    // Create new version if template changed
    if (updates.template && updates.template !== existingPrompt.template) {
      await this.createPromptVersion(promptId, updates.template, changelog, updatedBy);
    }

    return updatedPrompt;
  }

  /**
   * Create a new version of a prompt
   */
  async createPromptVersion(
    promptId: string, 
    template: string, 
    changelog: string, 
    createdBy: string
  ): Promise<PromptVersion> {
    // Get current version number
    const versions = await this.getPromptVersions(promptId);
    const newVersionNumber = versions.length > 0 ? Math.max(...versions.map(v => v.version)) + 1 : 1;

    const versionId = `${promptId}_v${newVersionNumber}`;
    const version: PromptVersion = {
      id: versionId,
      promptId,
      version: newVersionNumber,
      template,
      changelog,
      isActive: true,
      createdAt: new Date(),
      createdBy
    };

    // Deactivate previous versions
    await this.deactivatePreviousVersions(promptId);

    await this.dynamoClient.send(new PutCommand({
      TableName: this.promptVersionsTable,
      Item: {
        ...version,
        createdAt: version.createdAt.toISOString()
      }
    }));

    return version;
  }

  /**
   * Get all versions of a prompt
   */
  async getPromptVersions(promptId: string): Promise<PromptVersion[]> {
    try {
      const result = await this.dynamoClient.send(new QueryCommand({
        TableName: this.promptVersionsTable,
        IndexName: 'PromptIdIndex',
        KeyConditionExpression: 'promptId = :promptId',
        ExpressionAttributeValues: {
          ':promptId': promptId
        },
        ScanIndexForward: false // Latest first
      }));

      return (result.Items || []).map(item => ({
        ...item,
        createdAt: new Date(item.createdAt)
      })) as PromptVersion[];
    } catch (error) {
      console.error('Error fetching prompt versions:', error);
      return [];
    }
  }

  /**
   * Get active version of a prompt
   */
  async getActivePromptVersion(promptId: string): Promise<PromptVersion | null> {
    try {
      const result = await this.dynamoClient.send(new QueryCommand({
        TableName: this.promptVersionsTable,
        IndexName: 'PromptIdActiveIndex',
        KeyConditionExpression: 'promptId = :promptId AND isActive = :isActive',
        ExpressionAttributeValues: {
          ':promptId': promptId,
          ':isActive': true
        },
        Limit: 1
      }));

      if (result.Items && result.Items.length > 0) {
        const version = result.Items[0] as PromptVersion;
        version.createdAt = new Date(version.createdAt);
        return version;
      }
    } catch (error) {
      console.error('Error fetching active prompt version:', error);
    }

    return null;
  }

  /**
   * Activate a specific prompt version
   */
  async activatePromptVersion(promptId: string, version: number): Promise<void> {
    // Deactivate all versions first
    await this.deactivatePreviousVersions(promptId);

    // Activate the specified version
    const versionId = `${promptId}_v${version}`;
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.promptVersionsTable,
      Key: { id: versionId },
      UpdateExpression: 'SET isActive = :isActive',
      ExpressionAttributeValues: {
        ':isActive': true
      }
    }));
  }

  /**
   * Deactivate all previous versions of a prompt
   */
  private async deactivatePreviousVersions(promptId: string): Promise<void> {
    const versions = await this.getPromptVersions(promptId);
    
    for (const version of versions) {
      if (version.isActive) {
        await this.dynamoClient.send(new UpdateCommand({
          TableName: this.promptVersionsTable,
          Key: { id: version.id },
          UpdateExpression: 'SET isActive = :isActive',
          ExpressionAttributeValues: {
            ':isActive': false
          }
        }));
      }
    }
  }

  /**
   * Record prompt performance metrics
   */
  async recordPromptMetrics(
    promptId: string, 
    version: number, 
    metrics: Partial<PromptMetrics>
  ): Promise<void> {
    const metricsId = `${promptId}_v${version}_metrics`;
    
    try {
      // Get existing metrics
      const existing = await this.dynamoClient.send(new GetCommand({
        TableName: this.promptMetricsTable,
        Key: { id: metricsId }
      }));

      let updatedMetrics: PromptMetrics;
      
      if (existing.Item) {
        // Update existing metrics
        const existingMetrics = existing.Item as PromptMetrics;
        updatedMetrics = {
          ...existingMetrics,
          ...metrics,
          usageCount: (existingMetrics.usageCount || 0) + 1,
          lastEvaluated: new Date()
        };
      } else {
        // Create new metrics
        updatedMetrics = {
          averageResponseTime: metrics.averageResponseTime || 0,
          successRate: metrics.successRate || 0,
          userSatisfactionScore: metrics.userSatisfactionScore || 0,
          usageCount: 1,
          errorRate: metrics.errorRate || 0,
          lastEvaluated: new Date()
        };
      }

      await this.dynamoClient.send(new PutCommand({
        TableName: this.promptMetricsTable,
        Item: {
          id: metricsId,
          promptId,
          version,
          ...updatedMetrics,
          lastEvaluated: updatedMetrics.lastEvaluated.toISOString()
        }
      }));
    } catch (error) {
      console.error('Error recording prompt metrics:', error);
    }
  }

  /**
   * Get prompt performance metrics
   */
  async getPromptMetrics(promptId: string, version: number): Promise<PromptMetrics | null> {
    const metricsId = `${promptId}_v${version}_metrics`;
    
    try {
      const result = await this.dynamoClient.send(new GetCommand({
        TableName: this.promptMetricsTable,
        Key: { id: metricsId }
      }));

      if (result.Item) {
        const metrics = result.Item as PromptMetrics;
        metrics.lastEvaluated = new Date(metrics.lastEvaluated);
        return metrics;
      }
    } catch (error) {
      console.error('Error fetching prompt metrics:', error);
    }

    return null;
  }

  /**
   * Run regression tests on a prompt
   */
  async runPromptTests(promptId: string, version: number, testCases: TestCase[]): Promise<PromptTestResult> {
    const testId = `${promptId}_v${version}_test_${Date.now()}`;
    const executedAt = new Date();
    
    let passedTests = 0;
    let totalScore = 0;

    // Execute test cases (placeholder implementation)
    for (const testCase of testCases) {
      try {
        // In production, this would actually invoke the AI agent with the test input
        testCase.actualOutput = `Mock output for ${testCase.name}`;
        testCase.passed = this.evaluateTestCase(testCase);
        testCase.score = testCase.passed ? 1 : 0;
        testCase.executionTime = Math.random() * 1000; // Mock execution time
        
        if (testCase.passed) passedTests++;
        totalScore += testCase.score;
      } catch (error) {
        testCase.passed = false;
        testCase.score = 0;
        testCase.executionTime = 0;
      }
    }

    const result: PromptTestResult = {
      promptId,
      version,
      testCases,
      overallScore: testCases.length > 0 ? totalScore / testCases.length : 0,
      passedTests,
      failedTests: testCases.length - passedTests,
      executedAt
    };

    // Store test results
    await this.dynamoClient.send(new PutCommand({
      TableName: this.promptTestsTable,
      Item: {
        id: testId,
        ...result,
        executedAt: executedAt.toISOString()
      }
    }));

    return result;
  }

  /**
   * Evaluate a test case (placeholder implementation)
   */
  private evaluateTestCase(testCase: TestCase): boolean {
    // This is a simplified evaluation
    // In production, this would use more sophisticated comparison logic
    return testCase.actualOutput !== null && testCase.actualOutput !== undefined;
  }

  /**
   * Get all prompts by category
   */
  async getPromptsByCategory(category: string): Promise<PromptTemplate[]> {
    try {
      const result = await this.dynamoClient.send(new QueryCommand({
        TableName: this.promptsTable,
        IndexName: 'CategoryIndex',
        KeyConditionExpression: 'category = :category',
        ExpressionAttributeValues: {
          ':category': category
        }
      }));

      return (result.Items || []).map(item => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      })) as PromptTemplate[];
    } catch (error) {
      console.error('Error fetching prompts by category:', error);
      return [];
    }
  }

  /**
   * Delete a prompt and all its versions
   */
  async deletePrompt(promptId: string): Promise<void> {
    try {
      // Delete all versions
      const versions = await this.getPromptVersions(promptId);
      for (const version of versions) {
        await this.dynamoClient.send(new DeleteCommand({
          TableName: this.promptVersionsTable,
          Key: { id: version.id }
        }));
      }

      // Delete the prompt
      await this.dynamoClient.send(new DeleteCommand({
        TableName: this.promptsTable,
        Key: { id: promptId }
      }));
    } catch (error) {
      console.error('Error deleting prompt:', error);
      throw error;
    }
  }

  /**
   * Search prompts by name or description
   */
  async searchPrompts(query: string): Promise<PromptTemplate[]> {
    // This is a simplified search implementation
    // In production, you might use Amazon OpenSearch or implement more sophisticated search
    try {
      const result = await this.dynamoClient.send(new QueryCommand({
        TableName: this.promptsTable
      }));

      const allPrompts = (result.Items || []).map(item => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      })) as PromptTemplate[];

      // Filter by query
      return allPrompts.filter(prompt => 
        prompt.name.toLowerCase().includes(query.toLowerCase()) ||
        prompt.description.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching prompts:', error);
      return [];
    }
  }
}

export const promptManager = new PromptManager();