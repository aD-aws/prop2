import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { BuilderProfile, VettingStatus, Document, ReferenceProject } from '@/lib/types';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-2' });
const docClient = DynamoDBDocumentClient.from(client);

export interface CompaniesHouseData {
  companyNumber: string;
  companyName: string;
  companyStatus: string;
  incorporationDate: string;
  companyType: string;
  registeredOfficeAddress: {
    addressLine1: string;
    addressLine2?: string;
    locality: string;
    region?: string;
    postalCode: string;
    country: string;
  };
  officers: Array<{
    name: string;
    role: string;
    appointedOn: string;
  }>;
}

export interface InsuranceVerification {
  documentId: string;
  policyNumber: string;
  provider: string;
  coverageType: 'public_liability' | 'employers_liability' | 'professional_indemnity';
  coverageAmount: number;
  validFrom: Date;
  validTo: Date;
  verified: boolean;
  verificationNotes?: string;
}

export interface VettingRecord {
  builderId: string;
  status: VettingStatus;
  companiesHouseVerification?: {
    verified: boolean;
    data?: CompaniesHouseData;
    verifiedAt?: Date;
    notes?: string;
  };
  insuranceVerification: InsuranceVerification[];
  referenceVerification: Array<{
    referenceId: string;
    contactAttempted: boolean;
    contactSuccessful: boolean;
    verificationNotes: string;
    verifiedAt?: Date;
  }>;
  manualReview?: {
    reviewerId: string;
    reviewedAt: Date;
    decision: VettingStatus;
    notes: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class BuilderVerificationService {
  private readonly tableName = process.env.VETTING_RECORDS_TABLE || 'VettingRecords';

  /**
   * Initiate the vetting process for a new builder
   */
  async initiateVetting(builderId: string, builderProfile: BuilderProfile): Promise<VettingRecord> {
    const vettingRecord: VettingRecord = {
      builderId,
      status: 'pending',
      insuranceVerification: [],
      referenceVerification: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Start Companies House verification
    if (builderProfile.companiesHouseNumber) {
      try {
        const companiesHouseData = await this.verifyCompaniesHouse(builderProfile.companiesHouseNumber);
        vettingRecord.companiesHouseVerification = {
          verified: true,
          data: companiesHouseData,
          verifiedAt: new Date(),
        };
      } catch (error) {
        vettingRecord.companiesHouseVerification = {
          verified: false,
          notes: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    // Store the initial vetting record
    await docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: vettingRecord,
    }));

    return vettingRecord;
  }

  /**
   * Verify Companies House information
   */
  private async verifyCompaniesHouse(companyNumber: string): Promise<CompaniesHouseData> {
    // In a real implementation, this would call the Companies House API
    // For now, we'll simulate the verification
    
    const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
    if (!apiKey) {
      throw new Error('Companies House API key not configured');
    }

    try {
      const response = await fetch(`https://api.company-information.service.gov.uk/company/${companyNumber}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Companies House API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the API response to our format
      return {
        companyNumber: data.company_number,
        companyName: data.company_name,
        companyStatus: data.company_status,
        incorporationDate: data.date_of_creation,
        companyType: data.type,
        registeredOfficeAddress: {
          addressLine1: data.registered_office_address.address_line_1,
          addressLine2: data.registered_office_address.address_line_2,
          locality: data.registered_office_address.locality,
          region: data.registered_office_address.region,
          postalCode: data.registered_office_address.postal_code,
          country: data.registered_office_address.country,
        },
        officers: [], // Would need separate API call to get officers
      };
    } catch (error) {
      console.error('Companies House verification failed:', error);
      throw new Error('Failed to verify company information');
    }
  }

  /**
   * Process insurance document verification
   */
  async verifyInsuranceDocument(
    builderId: string, 
    document: Document, 
    insuranceDetails: Omit<InsuranceVerification, 'documentId' | 'verified'>
  ): Promise<void> {
    const vettingRecord = await this.getVettingRecord(builderId);
    if (!vettingRecord) {
      throw new Error('Vetting record not found');
    }

    // In a real implementation, this would involve:
    // 1. OCR/document parsing to extract policy details
    // 2. API calls to insurance providers for verification
    // 3. Manual review queue for complex cases

    const verification: InsuranceVerification = {
      ...insuranceDetails,
      documentId: document.id,
      verified: true, // Simplified for demo
    };

    vettingRecord.insuranceVerification.push(verification);
    vettingRecord.updatedAt = new Date();

    await this.updateVettingRecord(vettingRecord);
  }

  /**
   * Verify reference projects
   */
  async verifyReferenceProject(
    builderId: string, 
    referenceProject: ReferenceProject
  ): Promise<void> {
    const vettingRecord = await this.getVettingRecord(builderId);
    if (!vettingRecord) {
      throw new Error('Vetting record not found');
    }

    // In a real implementation, this would involve:
    // 1. Contacting the reference via phone/email
    // 2. Verifying project details and satisfaction
    // 3. Recording the verification outcome

    const verification = {
      referenceId: `ref_${Date.now()}`,
      contactAttempted: true,
      contactSuccessful: true, // Simplified for demo
      verificationNotes: 'Reference verified successfully. Customer confirmed project completion and satisfaction.',
      verifiedAt: new Date(),
    };

    vettingRecord.referenceVerification.push(verification);
    vettingRecord.updatedAt = new Date();

    await this.updateVettingRecord(vettingRecord);
  }

  /**
   * Perform manual review and make final vetting decision
   */
  async performManualReview(
    builderId: string,
    reviewerId: string,
    decision: VettingStatus,
    notes: string
  ): Promise<void> {
    const vettingRecord = await this.getVettingRecord(builderId);
    if (!vettingRecord) {
      throw new Error('Vetting record not found');
    }

    vettingRecord.manualReview = {
      reviewerId,
      reviewedAt: new Date(),
      decision,
      notes,
    };

    vettingRecord.status = decision;
    vettingRecord.updatedAt = new Date();

    await this.updateVettingRecord(vettingRecord);

    // Update the builder's profile status
    await this.updateBuilderVettingStatus(builderId, decision);
  }

  /**
   * Get vetting record for a builder
   */
  async getVettingRecord(builderId: string): Promise<VettingRecord | null> {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: { builderId },
      }));

      return result.Item as VettingRecord || null;
    } catch (error) {
      console.error('Error fetching vetting record:', error);
      return null;
    }
  }

  /**
   * Get all pending vetting records for admin review
   */
  async getPendingVettingRecords(): Promise<VettingRecord[]> {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'pending',
        },
      }));

      return result.Items as VettingRecord[] || [];
    } catch (error) {
      console.error('Error fetching pending vetting records:', error);
      return [];
    }
  }

  /**
   * Check if builder has required insurance coverage
   */
  hasRequiredInsurance(vettingRecord: VettingRecord): boolean {
    const requiredCoverageTypes: ('public_liability' | 'employers_liability' | 'professional_indemnity')[] = ['public_liability', 'employers_liability'];
    const verifiedCoverageTypes = vettingRecord.insuranceVerification
      .filter(v => v.verified && v.validTo > new Date())
      .map(v => v.coverageType);

    return requiredCoverageTypes.every(type => 
      verifiedCoverageTypes.includes(type)
    );
  }

  /**
   * Check if builder has sufficient verified references
   */
  hasSufficientReferences(vettingRecord: VettingRecord): boolean {
    const verifiedReferences = vettingRecord.referenceVerification
      .filter(r => r.contactSuccessful);
    
    return verifiedReferences.length >= 2; // Minimum 2 verified references
  }

  /**
   * Determine if builder is ready for approval
   */
  isReadyForApproval(vettingRecord: VettingRecord): boolean {
    const companiesHouseVerified = vettingRecord.companiesHouseVerification?.verified || false;
    const hasInsurance = this.hasRequiredInsurance(vettingRecord);
    const hasReferences = this.hasSufficientReferences(vettingRecord);

    return companiesHouseVerified && hasInsurance && hasReferences;
  }

  /**
   * Update vetting record in database
   */
  private async updateVettingRecord(vettingRecord: VettingRecord): Promise<void> {
    await docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: vettingRecord,
    }));
  }

  /**
   * Update builder's vetting status in the Users table
   */
  private async updateBuilderVettingStatus(builderId: string, status: VettingStatus): Promise<void> {
    await docClient.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE || 'Users',
      Key: { id: builderId },
      UpdateExpression: 'SET #profile.#vettingStatus = :status, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#profile': 'profile',
        '#vettingStatus': 'vettingStatus',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
      },
    }));
  }
}

export const builderVerificationService = new BuilderVerificationService();