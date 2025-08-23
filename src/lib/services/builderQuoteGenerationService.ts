import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { v4 as uuidv4 } from 'uuid';
import { ProjectType } from '../types';
import { aiService } from './aiService';
import { sowGenerationService } from './sowGenerationService';
import { timelineOptimizationService } from './timelineOptimizationService';
import { builderSubscriptionService } from './builderSubscriptionService';
import { awsConfig } from '../config/aws';

// Initialize AWS clients with proper configuration
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: awsConfig.region,
  ...(process.env.NODE_ENV === 'development' && {
    credentials: process.env.AWS_ACCESS_KEY_ID ? undefined : {
      accessKeyId: 'mock',
      secretAccessKey: 'mock',
    },
  }),
}));

const sesClient = new SESClient({
  region: awsConfig.region,
  ...(process.env.NODE_ENV === 'development' && {
    credentials: process.env.AWS_ACCESS_KEY_ID ? undefined : {
      accessKeyId: 'mock',
      secretAccessKey: 'mock',
    },
  }),
});

export interface BuilderQuoteProject {
  id: string;
  builderId: string;
  clientName: string;
  clientEmail: string;
  projectType: string;
  propertyAddress: string;
  projectDetails: any;
  sowDocument?: any;
  ganttChart?: any;
  quote?: BuilderQuote;
  invitationToken: string;
  status: 'draft' | 'sow_generating' | 'ready' | 'sent' | 'viewed';
  createdAt: Date;
  updatedAt: Date;
  viewedAt?: Date;
  usageTracked: boolean;
}

export interface BuilderQuote {
  totalAmount: number;
  laborCosts: number;
  materialCosts: number;
  breakdown: QuoteBreakdown[];
  timeline: number; // working days
  startDate: Date;
  projectedCompletionDate: Date;
  terms: string;
  validUntil: Date;
}

export interface QuoteBreakdown {
  category: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: 'labor' | 'material' | 'other';
}

export interface ClientInvitation {
  token: string;
  projectId: string;
  clientEmail: string;
  sentAt: Date;
  viewedAt?: Date;
  expiresAt: Date;
}

class BuilderQuoteGenerationService {
  async createBuilderProject(
    builderId: string,
    projectData: {
      clientName: string;
      clientEmail: string;
      projectType: string;
      propertyAddress: string;
      projectDetails: any;
    }
  ): Promise<BuilderQuoteProject> {
    // Verify builder has active subscription
    const subscription = await builderSubscriptionService.getBuilderSubscription(builderId);
    if (!subscription || subscription.status !== 'active') {
      throw new Error('Active subscription required for professional quote generation');
    }

    const projectId = uuidv4();
    const invitationToken = uuidv4();

    const project: BuilderQuoteProject = {
      id: projectId,
      builderId,
      clientName: projectData.clientName,
      clientEmail: projectData.clientEmail,
      projectType: projectData.projectType,
      propertyAddress: projectData.propertyAddress,
      projectDetails: projectData.projectDetails,
      invitationToken,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      usageTracked: false
    };

    await dynamoClient.send(new PutCommand({
      TableName: 'BuilderQuoteProjects',
      Item: project
    }));

    return project;
  }

  async generateSoWForBuilderProject(projectId: string): Promise<{ success: boolean; jobId: string; estimatedCompletionTime: Date; message: string; }> {
    const project = await this.getBuilderProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Update status to generating
    await this.updateProjectStatus(projectId, 'sow_generating');

    try {
      // Generate SoW using existing AI services
      const sowJob = await sowGenerationService.startSoWGeneration({
        projectId: projectId,
        projectType: (project.projectType as ProjectType) || 'others',
        propertyId: '', // No propertyId available in BuilderQuoteProject
        userResponses: {
          propertyDetails: { address: project.propertyAddress },
          projectDetails: project.projectDetails,
          includeCosting: true // Include pricing for builders
        }
      }, {
        preferredMethod: 'email' // Default notification method
      });

      // Store the job ID for tracking
      await dynamoClient.send(new UpdateCommand({
        TableName: 'BuilderQuoteProjects',
        Key: { id: projectId },
        UpdateExpression: 'SET sowJobId = :jobId, sowJobStatus = :status, estimatedCompletionTime = :completionTime, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':jobId': sowJob.jobId,
          ':status': 'processing',
          ':completionTime': sowJob.estimatedCompletionTime.toISOString(),
          ':updatedAt': new Date().toISOString()
        }
      }));

      // Return job information instead of trying to process immediately
      return {
        success: true,
        jobId: sowJob.jobId,
        estimatedCompletionTime: sowJob.estimatedCompletionTime,
        message: 'SoW generation started. You will be notified when complete.'
      };

    } catch (error) {
      // Reset status on error
      await this.updateProjectStatus(projectId, 'draft');
      throw error;
    }
  }

  async createQuoteForProject(
    projectId: string,
    quoteData: {
      totalAmount: number;
      laborCosts: number;
      materialCosts: number;
      breakdown: QuoteBreakdown[];
      timeline: number;
      startDate: Date;
      terms: string;
      validUntil: Date;
    }
  ): Promise<void> {
    const project = await this.getBuilderProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const projectedCompletionDate = new Date(quoteData.startDate);
    projectedCompletionDate.setDate(projectedCompletionDate.getDate() + quoteData.timeline);

    const quote: BuilderQuote = {
      ...quoteData,
      projectedCompletionDate
    };

    await dynamoClient.send(new UpdateCommand({
      TableName: 'BuilderQuoteProjects',
      Key: { id: projectId },
      UpdateExpression: 'SET quote = :quote, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':quote': quote,
        ':updatedAt': new Date().toISOString()
      }
    }));
  }

  async sendInvitationToClient(projectId: string): Promise<void> {
    const project = await this.getBuilderProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    if (project.status !== 'ready' || !project.quote) {
      throw new Error('Project must have SoW and quote ready before sending invitation');
    }

    // Track usage for billing
    if (!project.usageTracked) {
      await builderSubscriptionService.trackUsage(project.builderId, 'quote_generation', 1);
      await this.markUsageTracked(projectId);
    }

    const invitation: ClientInvitation = {
      token: project.invitationToken,
      projectId,
      clientEmail: project.clientEmail,
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    // Store invitation
    await dynamoClient.send(new PutCommand({
      TableName: 'ClientInvitations',
      Item: invitation
    }));

    // Send email
    const viewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quote/view/${project.invitationToken}`;
    
    const emailParams = {
      Source: process.env.FROM_EMAIL || 'noreply@platform.com',
      Destination: {
        ToAddresses: [project.clientEmail]
      },
      Message: {
        Subject: {
          Data: `Professional Quote for Your ${project.projectType} Project`
        },
        Body: {
          Html: {
            Data: this.generateInvitationEmailHtml(project, viewUrl)
          },
          Text: {
            Data: this.generateInvitationEmailText(project, viewUrl)
          }
        }
      }
    };

    await sesClient.send(new SendEmailCommand(emailParams));

    // Update project status
    await this.updateProjectStatus(projectId, 'sent');
  }

  async getQuoteByToken(token: string): Promise<{ project: BuilderQuoteProject; builder: any } | null> {
    try {
      const result = await dynamoClient.send(new QueryCommand({
        TableName: 'BuilderQuoteProjects',
        IndexName: 'InvitationTokenIndex',
        KeyConditionExpression: 'invitationToken = :token',
        ExpressionAttributeValues: {
          ':token': token
        }
      }));

      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      const project = result.Items[0] as BuilderQuoteProject;

      // Get builder information
      const builderResult = await dynamoClient.send(new GetCommand({
        TableName: 'Builders',
        Key: { id: project.builderId }
      }));

      const builder = builderResult.Item;

      // Track view if first time
      if (project.status === 'sent') {
        await this.updateProjectStatus(project.id, 'viewed');
        await dynamoClient.send(new UpdateCommand({
          TableName: 'BuilderQuoteProjects',
          Key: { id: project.id },
          UpdateExpression: 'SET viewedAt = :viewedAt',
          ExpressionAttributeValues: {
            ':viewedAt': new Date().toISOString()
          }
        }));
      }

      return { project, builder };
    } catch (error) {
      console.error('Error getting quote by token:', error);
      return null;
    }
  }

  async getBuilderProjects(builderId: string): Promise<BuilderQuoteProject[]> {
    const result = await dynamoClient.send(new QueryCommand({
      TableName: 'BuilderQuoteProjects',
      IndexName: 'BuilderIdIndex',
      KeyConditionExpression: 'builderId = :builderId',
      ExpressionAttributeValues: {
        ':builderId': builderId
      },
      ScanIndexForward: false // Most recent first
    }));

    return (result.Items || []) as BuilderQuoteProject[];
  }

  private async getBuilderProject(projectId: string): Promise<BuilderQuoteProject | null> {
    const result = await dynamoClient.send(new GetCommand({
      TableName: 'BuilderQuoteProjects',
      Key: { id: projectId }
    }));

    return result.Item as BuilderQuoteProject || null;
  }

  private async updateProjectStatus(projectId: string, status: BuilderQuoteProject['status']): Promise<void> {
    await dynamoClient.send(new UpdateCommand({
      TableName: 'BuilderQuoteProjects',
      Key: { id: projectId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      }
    }));
  }

  private async markUsageTracked(projectId: string): Promise<void> {
    await dynamoClient.send(new UpdateCommand({
      TableName: 'BuilderQuoteProjects',
      Key: { id: projectId },
      UpdateExpression: 'SET usageTracked = :tracked',
      ExpressionAttributeValues: {
        ':tracked': true
      }
    }));
  }

  private generateInvitationEmailHtml(project: BuilderQuoteProject, viewUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Professional Quote for Your Project</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Professional Quote for Your ${project.projectType} Project</h1>
          
          <p>Dear ${project.clientName},</p>
          
          <p>I'm pleased to provide you with a detailed professional quote for your ${project.projectType} project at ${project.propertyAddress}.</p>
          
          <p>This comprehensive quote includes:</p>
          <ul>
            <li>Detailed Scope of Work (SoW) with specifications</li>
            <li>Interactive project timeline with Gantt chart</li>
            <li>Complete cost breakdown for materials and labor</li>
            <li>Professional terms and conditions</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${viewUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Professional Quote</a>
          </div>
          
          <p>This quote is valid until ${project.quote?.validUntil ? new Date(project.quote.validUntil).toLocaleDateString() : 'the date specified in the quote'}.</p>
          
          <p>If you have any questions about the quote or would like to discuss the project further, please don't hesitate to contact me.</p>
          
          <p>Best regards,<br>Your Builder</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            This quote was generated using professional quote generation tools. 
            The link will expire in 30 days from the date this email was sent.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private generateInvitationEmailText(project: BuilderQuoteProject, viewUrl: string): string {
    return `
Professional Quote for Your ${project.projectType} Project

Dear ${project.clientName},

I'm pleased to provide you with a detailed professional quote for your ${project.projectType} project at ${project.propertyAddress}.

This comprehensive quote includes:
- Detailed Scope of Work (SoW) with specifications
- Interactive project timeline with Gantt chart
- Complete cost breakdown for materials and labor
- Professional terms and conditions

View Your Professional Quote: ${viewUrl}

This quote is valid until ${project.quote?.validUntil ? new Date(project.quote.validUntil).toLocaleDateString() : 'the date specified in the quote'}.

If you have any questions about the quote or would like to discuss the project further, please don't hesitate to contact me.

Best regards,
Your Builder

---
This quote was generated using professional quote generation tools. 
The link will expire in 30 days from the date this email was sent.
    `;
  }
}

export const builderQuoteGenerationService = new BuilderQuoteGenerationService();