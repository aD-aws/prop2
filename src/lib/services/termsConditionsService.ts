import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-2' });
const docClient = DynamoDBDocumentClient.from(client);

export interface TermsAndConditions {
  id: string;
  projectType: string;
  version: number;
  title: string;
  content: string;
  sections: TermsSection[];
  isStandard: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface TermsSection {
  id: string;
  title: string;
  content: string;
  order: number;
  isRequired: boolean;
  canBeAmended: boolean;
}

export interface TermsAmendment {
  id: string;
  originalTermsId: string;
  builderId: string;
  projectId: string;
  sectionId: string;
  originalContent: string;
  proposedContent: string;
  reason: string;
  status: 'proposed' | 'accepted' | 'rejected';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface ProjectTerms {
  id: string;
  projectId: string;
  baseTermsId: string;
  amendments: TermsAmendment[];
  finalTerms: TermsAndConditions;
  agreedAt?: Date;
  homeownerAccepted: boolean;
  builderAccepted: boolean;
}

export class TermsConditionsService {
  private tableName = process.env.DYNAMODB_TABLE_NAME || 'uk-home-improvement-platform';

  /**
   * Get standard Terms & Conditions for a project type
   */
  async getStandardTerms(projectType: string): Promise<TermsAndConditions | null> {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          PK: `TERMS#${projectType}`,
          SK: 'STANDARD'
        }
      };

      const result = await docClient.send(new GetCommand(params));
      return result.Item as TermsAndConditions || null;
    } catch (error) {
      console.error('Error getting standard terms:', error);
      throw new Error('Failed to retrieve standard terms and conditions');
    }
  }

  /**
   * Create standard Terms & Conditions template for a project type
   */
  async createStandardTerms(projectType: string, terms: Omit<TermsAndConditions, 'id' | 'createdAt' | 'updatedAt'>): Promise<TermsAndConditions> {
    try {
      const termsId = uuidv4();
      const now = new Date();

      const standardTerms: TermsAndConditions = {
        ...terms,
        id: termsId,
        projectType,
        isStandard: true,
        createdAt: now,
        updatedAt: now,
        isActive: true
      };

      const params = {
        TableName: this.tableName,
        Item: {
          PK: `TERMS#${projectType}`,
          SK: 'STANDARD',
          ...standardTerms,
          GSI1PK: 'TERMS',
          GSI1SK: `${projectType}#STANDARD`,
          EntityType: 'TermsAndConditions'
        }
      };

      await docClient.send(new PutCommand(params));
      return standardTerms;
    } catch (error) {
      console.error('Error creating standard terms:', error);
      throw new Error('Failed to create standard terms and conditions');
    }
  }

  /**
   * Propose amendment to Terms & Conditions by builder
   */
  async proposeAmendment(
    projectId: string,
    builderId: string,
    originalTermsId: string,
    sectionId: string,
    proposedContent: string,
    reason: string
  ): Promise<TermsAmendment> {
    try {
      const amendmentId = uuidv4();
      const now = new Date();

      // Get original terms to capture current content
      const originalTerms = await this.getTermsById(originalTermsId);
      if (!originalTerms) {
        throw new Error('Original terms not found');
      }

      const section = originalTerms.sections.find(s => s.id === sectionId);
      if (!section) {
        throw new Error('Section not found in original terms');
      }

      if (!section.canBeAmended) {
        throw new Error('This section cannot be amended');
      }

      const amendment: TermsAmendment = {
        id: amendmentId,
        originalTermsId,
        builderId,
        projectId,
        sectionId,
        originalContent: section.content,
        proposedContent,
        reason,
        status: 'proposed',
        createdAt: now
      };

      const params = {
        TableName: this.tableName,
        Item: {
          PK: `PROJECT#${projectId}`,
          SK: `AMENDMENT#${amendmentId}`,
          ...amendment,
          GSI1PK: `BUILDER#${builderId}`,
          GSI1SK: `AMENDMENT#${now.toISOString()}`,
          EntityType: 'TermsAmendment'
        }
      };

      await docClient.send(new PutCommand(params));
      return amendment;
    } catch (error) {
      console.error('Error proposing amendment:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to propose terms amendment');
    }
  }

  /**
   * Get all amendments for a project
   */
  async getProjectAmendments(projectId: string): Promise<TermsAmendment[]> {
    try {
      const params = {
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `PROJECT#${projectId}`,
          ':sk': 'AMENDMENT#'
        }
      };

      const result = await docClient.send(new QueryCommand(params));
      return (result.Items || []) as TermsAmendment[];
    } catch (error) {
      console.error('Error getting project amendments:', error);
      throw new Error('Failed to retrieve project amendments');
    }
  }

  /**
   * Review and accept/reject amendment
   */
  async reviewAmendment(
    amendmentId: string,
    projectId: string,
    reviewerId: string,
    status: 'accepted' | 'rejected'
  ): Promise<TermsAmendment> {
    try {
      const now = new Date();

      const params = {
        TableName: this.tableName,
        Key: {
          PK: `PROJECT#${projectId}`,
          SK: `AMENDMENT#${amendmentId}`
        },
        UpdateExpression: 'SET #status = :status, reviewedAt = :reviewedAt, reviewedBy = :reviewedBy, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':reviewedAt': now,
          ':reviewedBy': reviewerId,
          ':updatedAt': now
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await docClient.send(new UpdateCommand(params));
      return result.Attributes as TermsAmendment;
    } catch (error) {
      console.error('Error reviewing amendment:', error);
      throw new Error('Failed to review amendment');
    }
  }

  /**
   * Generate final terms with accepted amendments
   */
  async generateFinalTerms(projectId: string, baseTermsId: string): Promise<ProjectTerms> {
    try {
      const [baseTerms, amendments] = await Promise.all([
        this.getTermsById(baseTermsId),
        this.getProjectAmendments(projectId)
      ]);

      if (!baseTerms) {
        throw new Error('Base terms not found');
      }

      const acceptedAmendments = amendments.filter(a => a.status === 'accepted');
      
      // Apply amendments to create final terms
      const finalTerms: TermsAndConditions = {
        ...baseTerms,
        id: uuidv4(),
        sections: baseTerms.sections.map(section => {
          const amendment = acceptedAmendments.find(a => a.sectionId === section.id);
          if (amendment) {
            return {
              ...section,
              content: amendment.proposedContent
            };
          }
          return section;
        }),
        updatedAt: new Date()
      };

      const projectTerms: ProjectTerms = {
        id: uuidv4(),
        projectId,
        baseTermsId,
        amendments: acceptedAmendments,
        finalTerms,
        homeownerAccepted: false,
        builderAccepted: false
      };

      const params = {
        TableName: this.tableName,
        Item: {
          PK: `PROJECT#${projectId}`,
          SK: 'FINAL_TERMS',
          ...projectTerms,
          GSI1PK: 'PROJECT_TERMS',
          GSI1SK: projectId,
          EntityType: 'ProjectTerms'
        }
      };

      await docClient.send(new PutCommand(params));
      return projectTerms;
    } catch (error) {
      console.error('Error generating final terms:', error);
      throw new Error('Failed to generate final terms');
    }
  }

  /**
   * Accept terms by homeowner or builder
   */
  async acceptTerms(projectId: string, userId: string, userType: 'homeowner' | 'builder'): Promise<ProjectTerms> {
    try {
      const now = new Date();
      const updateField = userType === 'homeowner' ? 'homeownerAccepted' : 'builderAccepted';

      const params = {
        TableName: this.tableName,
        Key: {
          PK: `PROJECT#${projectId}`,
          SK: 'FINAL_TERMS'
        },
        UpdateExpression: `SET ${updateField} = :accepted, updatedAt = :updatedAt`,
        ExpressionAttributeValues: {
          ':accepted': true,
          ':updatedAt': now
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await docClient.send(new UpdateCommand(params));
      const projectTerms = result.Attributes as ProjectTerms;

      // If both parties have accepted, mark as agreed
      if (projectTerms.homeownerAccepted && projectTerms.builderAccepted && !projectTerms.agreedAt) {
        const agreeParams = {
          TableName: this.tableName,
          Key: {
            PK: `PROJECT#${projectId}`,
            SK: 'FINAL_TERMS'
          },
          UpdateExpression: 'SET agreedAt = :agreedAt',
          ExpressionAttributeValues: {
            ':agreedAt': now
          },
          ReturnValues: 'ALL_NEW'
        };

        const agreeResult = await docClient.send(new UpdateCommand(agreeParams));
        return agreeResult.Attributes as ProjectTerms;
      }

      return projectTerms;
    } catch (error) {
      console.error('Error accepting terms:', error);
      throw new Error('Failed to accept terms');
    }
  }

  /**
   * Get project terms
   */
  async getProjectTerms(projectId: string): Promise<ProjectTerms | null> {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          PK: `PROJECT#${projectId}`,
          SK: 'FINAL_TERMS'
        }
      };

      const result = await docClient.send(new GetCommand(params));
      return result.Item as ProjectTerms || null;
    } catch (error) {
      console.error('Error getting project terms:', error);
      throw new Error('Failed to retrieve project terms');
    }
  }

  /**
   * Get terms by ID
   */
  private async getTermsById(termsId: string): Promise<TermsAndConditions | null> {
    try {
      const params = {
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
        ExpressionAttributeValues: {
          ':pk': 'TERMS',
          ':sk': termsId
        }
      };

      const result = await docClient.send(new QueryCommand(params));
      return result.Items?.[0] as TermsAndConditions || null;
    } catch (error) {
      console.error('Error getting terms by ID:', error);
      throw new Error('Failed to retrieve terms');
    }
  }

  /**
   * Compare terms variations for homeowner review
   */
  async compareTermsVariations(projectId: string): Promise<{
    standardTerms: TermsAndConditions;
    proposedAmendments: TermsAmendment[];
    finalTerms?: TermsAndConditions;
  }> {
    try {
      const amendments = await this.getProjectAmendments(projectId);
      const projectTerms = await this.getProjectTerms(projectId);
      
      if (!amendments.length) {
        throw new Error('No amendments found for comparison');
      }

      const baseTerms = await this.getTermsById(amendments[0].originalTermsId);
      if (!baseTerms) {
        throw new Error('Base terms not found');
      }

      return {
        standardTerms: baseTerms,
        proposedAmendments: amendments,
        finalTerms: projectTerms?.finalTerms
      };
    } catch (error) {
      console.error('Error comparing terms variations:', error);
      throw new Error('Failed to compare terms variations');
    }
  }
}

export const termsConditionsService = new TermsConditionsService();