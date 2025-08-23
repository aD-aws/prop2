// DynamoDB service for data operations

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand 
} from '@aws-sdk/lib-dynamodb';
import { awsConfig } from '../config/aws';

// Initialize DynamoDB client lazily to avoid build-time issues
let client: DynamoDBClient | null = null;
let docClient: DynamoDBDocumentClient | null = null;

function initializeDynamoClient() {
  if (!client && typeof window === 'undefined') {
    client = new DynamoDBClient({
      region: awsConfig.region,
      // In development, use local credentials or mock
      ...(process.env.NODE_ENV === 'development' && {
        endpoint: process.env.DYNAMODB_ENDPOINT,
        credentials: process.env.AWS_ACCESS_KEY_ID ? undefined : {
          accessKeyId: 'mock',
          secretAccessKey: 'mock',
        },
      }),
    });
    docClient = DynamoDBDocumentClient.from(client);
  }
}

export class DynamoDBService {
  
  /**
   * Put an item into a table
   */
  static async putItem(tableName: string, item: Record<string, unknown>) {
    initializeDynamoClient();
    
    if (!docClient) {
      throw new Error('DynamoDB client not available');
    }

    try {
      const command = new PutCommand({
        TableName: tableName,
        Item: {
          ...item,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      
      await docClient.send(command);
      return { success: true };
    } catch (error) {
      console.error('DynamoDB put item error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Put item failed',
      };
    }
  }
  
  /**
   * Get an item from a table
   */
  static async getItem(tableName: string, key: Record<string, unknown>) {
    initializeDynamoClient();
    
    if (!docClient) {
      throw new Error('DynamoDB client not available');
    }

    try {
      const command = new GetCommand({
        TableName: tableName,
        Key: key,
      });
      
      const result = await docClient.send(command);
      return {
        success: true,
        Item: result.Item,
      };
    } catch (error) {
      console.error('DynamoDB get item error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Get item failed',
      };
    }
  }
  
  /**
   * Update an item in a table
   */
  static async updateItem(
    tableName: string, 
    key: Record<string, unknown>, 
    updates: Record<string, unknown>
  ) {
    initializeDynamoClient();
    
    if (!docClient) {
      throw new Error('DynamoDB client not available');
    }

    try {
      const updateExpression = Object.keys(updates)
        .map(key => `#${key} = :${key}`)
        .join(', ');
      
      const expressionAttributeNames: Record<string, string> = Object.keys(updates)
        .reduce((acc, key) => ({ ...acc, [`#${key}`]: key }), {});
      
      const expressionAttributeValues: Record<string, unknown> = Object.keys(updates)
        .reduce((acc, key) => ({ ...acc, [`:${key}`]: updates[key] }), {});
      
      // Always update the updatedAt timestamp
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();
      
      const command = new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: `SET ${updateExpression}, #updatedAt = :updatedAt`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      });
      
      const result = await docClient.send(command);
      return {
        success: true,
        item: result.Attributes,
      };
    } catch (error) {
      console.error('DynamoDB update item error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update item failed',
      };
    }
  }
  
  /**
   * Delete an item from a table
   */
  static async deleteItem(tableName: string, key: Record<string, unknown>) {
    initializeDynamoClient();
    
    if (!docClient) {
      throw new Error('DynamoDB client not available');
    }

    try {
      const command = new DeleteCommand({
        TableName: tableName,
        Key: key,
      });
      
      await docClient.send(command);
      return { success: true };
    } catch (error) {
      console.error('DynamoDB delete item error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete item failed',
      };
    }
  }
  
  /**
   * Query items from a table
   */
  static async queryItems(
    tableName: string,
    indexName: string,
    keyCondition: Record<string, unknown>,
    limit?: number
  ) {
    initializeDynamoClient();
    
    if (!docClient) {
      throw new Error('DynamoDB client not available');
    }

    try {
      const keyConditionExpression = Object.keys(keyCondition)
        .map(key => `#${key} = :${key}`)
        .join(' AND ');
      
      const expressionAttributeNames: Record<string, string> = Object.keys(keyCondition)
        .reduce((acc, key) => ({ ...acc, [`#${key}`]: key }), {});
      
      const expressionAttributeValues: Record<string, unknown> = Object.keys(keyCondition)
        .reduce((acc, key) => ({ ...acc, [`:${key}`]: keyCondition[key] }), {});

      const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        IndexName: indexName,
        Limit: limit,
      });
      
      const result = await docClient.send(command);
      return {
        success: true,
        Items: result.Items || [],
        LastEvaluatedKey: result.LastEvaluatedKey,
      };
    } catch (error) {
      console.error('DynamoDB query items error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query items failed',
      };
    }
  }

  /**
   * Scan table
   */
  static async scanTable(tableName: string) {
    initializeDynamoClient();
    
    if (!docClient) {
      throw new Error('DynamoDB client not available');
    }

    try {
      const command = new ScanCommand({
        TableName: tableName,
      });
      
      const result = await docClient.send(command);
      return {
        success: true,
        Items: result.Items || [],
      };
    } catch (error) {
      console.error('DynamoDB scan table error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Scan table failed',
      };
    }
  }
  
  /**
   * Scan items from a table
   */
  static async scanItems(
    tableName: string,
    filterExpression?: string,
    expressionAttributeValues?: Record<string, unknown>,
    limit?: number
  ) {
    initializeDynamoClient();
    
    if (!docClient) {
      throw new Error('DynamoDB client not available');
    }

    try {
      const command = new ScanCommand({
        TableName: tableName,
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: limit,
      });
      
      const result = await docClient.send(command);
      return {
        success: true,
        items: result.Items || [],
        lastEvaluatedKey: result.LastEvaluatedKey,
      };
    } catch (error) {
      console.error('DynamoDB scan items error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Scan items failed',
      };
    }
  }
}

// Specific service classes for each table

export class UsersService extends DynamoDBService {
  private static tableName = awsConfig.dynamodb.usersTable;
  
  static async createUser(user: Record<string, unknown>) {
    return this.putItem(this.tableName, user);
  }
  
  static async getUserById(userId: string) {
    return this.getItem(this.tableName, { userId });
  }
  
  static async getUserByEmail(email: string) {
    return this.queryItems(
      this.tableName,
      'EmailIndex',
      { email }
    );
  }
  
  static async updateUser(userId: string, updates: Record<string, unknown>) {
    return this.updateItem(this.tableName, { userId }, updates);
  }
}

export class ProjectsService extends DynamoDBService {
  private static tableName = awsConfig.dynamodb.projectsTable;
  
  static async createProject(project: Record<string, unknown>) {
    return this.putItem(this.tableName, project);
  }
  
  static async getProjectById(projectId: string) {
    return this.getItem(this.tableName, { projectId });
  }
  
  static async getProjectsByHomeowner(homeownerId: string) {
    return this.queryItems(
      this.tableName,
      'HomeownerIndex',
      { homeownerId }
    );
  }
  
  static async updateProject(projectId: string, updates: Record<string, unknown>) {
    return this.updateItem(this.tableName, { projectId }, updates);
  }
}

export class BuildersService extends DynamoDBService {
  private static tableName = awsConfig.dynamodb.buildersTable;
  
  static async createBuilder(builder: Record<string, unknown>) {
    return this.putItem(this.tableName, builder);
  }
  
  static async getBuilderById(builderId: string) {
    return this.getItem(this.tableName, { builderId });
  }
  
  static async getBuildersByPostcodeAndSpecialization(postcode: string, specialization: string) {
    return this.queryItems(
      this.tableName,
      'PostcodeSpecializationIndex',
      { postcode, specialization }
    );
  }
  
  static async updateBuilder(builderId: string, updates: Record<string, unknown>) {
    return this.updateItem(this.tableName, { builderId }, updates);
  }
}

export class PropertiesService extends DynamoDBService {
  private static tableName = awsConfig.dynamodb.propertiesTable;
  
  static async createProperty(property: Record<string, unknown>) {
    return this.putItem(this.tableName, property);
  }
  
  static async getPropertyById(propertyId: string) {
    return this.getItem(this.tableName, { propertyId });
  }
  
  static async getPropertiesByPostcode(postcode: string) {
    return this.queryItems(
      this.tableName,
      'PostcodeIndex',
      { postcode }
    );
  }
  
  static async updateProperty(propertyId: string, updates: Record<string, unknown>) {
    return this.updateItem(this.tableName, { propertyId }, updates);
  }
}

export class QuotesService extends DynamoDBService {
  private static tableName = awsConfig.dynamodb.quotesTable;
  
  static async createQuote(quote: Record<string, unknown>) {
    return this.putItem(this.tableName, quote);
  }
  
  static async getQuoteById(quoteId: string) {
    return this.getItem(this.tableName, { quoteId });
  }
  
  static async getQuotesByProject(projectId: string) {
    return this.queryItems(
      this.tableName,
      'ProjectIndex',
      { projectId }
    );
  }
  
  static async getQuotesByBuilder(builderId: string) {
    return this.queryItems(
      this.tableName,
      'BuilderIndex',
      { builderId }
    );
  }
  
  static async updateQuote(quoteId: string, updates: Record<string, unknown>) {
    return this.updateItem(this.tableName, { quoteId }, updates);
  }
}