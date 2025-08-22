import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

export interface GDPRConsent {
  id: string;
  email: string;
  phone?: string;
  consentType: 'marketing' | 'data_processing' | 'cookies' | 'analytics';
  consentGiven: boolean;
  consentDate: Date;
  consentSource: string; // 'website_form', 'email_link', 'phone_call', etc.
  ipAddress?: string;
  userAgent?: string;
  withdrawalDate?: Date;
  withdrawalReason?: string;
}

export interface DataProcessingRecord {
  id: string;
  dataSubjectId: string;
  dataType: 'personal' | 'sensitive' | 'contact' | 'behavioral';
  processingPurpose: string;
  lawfulBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  dataSource: string;
  processingDate: Date;
  retentionPeriod: number; // days
  deletionDate: Date;
  processingStatus: 'active' | 'archived' | 'deleted';
}

export interface DataSubjectRequest {
  id: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  dataSubjectEmail: string;
  dataSubjectPhone?: string;
  requestDate: Date;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  fulfillmentStatus: 'pending' | 'in_progress' | 'completed' | 'rejected';
  fulfillmentDate?: Date;
  requestDetails: string;
  responseData?: any;
  rejectionReason?: string;
}

export interface OptOutRecord {
  id: string;
  email: string;
  phone?: string;
  optOutDate: Date;
  optOutSource: string;
  optOutType: 'marketing' | 'all_communications' | 'data_processing';
  verificationToken?: string;
  isGlobal: boolean;
}

export class GDPRComplianceService {
  private readonly consentTableName = 'GDPRConsents';
  private readonly processingTableName = 'DataProcessingRecords';
  private readonly requestsTableName = 'DataSubjectRequests';
  private readonly optOutTableName = 'OptOutRecords';

  /**
   * Record consent given by data subject
   */
  async recordConsent(consent: Omit<GDPRConsent, 'id'>): Promise<GDPRConsent> {
    const consentRecord: GDPRConsent = {
      id: uuidv4(),
      ...consent
    };

    await dynamodb.send(new PutCommand({
      TableName: this.consentTableName,
      Item: consentRecord
    }));

    return consentRecord;
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(email: string, consentType: GDPRConsent['consentType'], reason?: string): Promise<void> {
    // Find existing consent records
    const existingConsents = await this.getConsentRecords(email, consentType);

    // Update all matching consent records
    for (const consent of existingConsents) {
      await dynamodb.send(new UpdateCommand({
        TableName: this.consentTableName,
        Key: { id: consent.id },
        UpdateExpression: 'SET consentGiven = :false, withdrawalDate = :date, withdrawalReason = :reason',
        ExpressionAttributeValues: {
          ':false': false,
          ':date': new Date().toISOString(),
          ':reason': reason || 'User requested withdrawal'
        }
      }));
    }

    // Record opt-out
    await this.recordOptOut({
      email,
      optOutType: consentType === 'marketing' ? 'marketing' : 'all_communications',
      optOutSource: 'user_request',
      isGlobal: consentType === 'data_processing'
    });
  }

  /**
   * Check if consent exists and is valid
   */
  async hasValidConsent(email: string, consentType: GDPRConsent['consentType']): Promise<boolean> {
    try {
      const consents = await this.getConsentRecords(email, consentType);
      
      // Check if there's a valid, non-withdrawn consent
      const validConsent = consents.find(c => 
        c.consentGiven && 
        !c.withdrawalDate &&
        this.isConsentStillValid(c.consentDate)
      );

      return !!validConsent;
    } catch (error) {
      console.error('Error checking consent:', error);
      return false;
    }
  }

  /**
   * Record data processing activity
   */
  async recordDataProcessing(processing: Omit<DataProcessingRecord, 'id' | 'deletionDate'>): Promise<DataProcessingRecord> {
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + processing.retentionPeriod);

    const processingRecord: DataProcessingRecord = {
      id: uuidv4(),
      deletionDate,
      ...processing
    };

    await dynamodb.send(new PutCommand({
      TableName: this.processingTableName,
      Item: processingRecord
    }));

    return processingRecord;
  }

  /**
   * Handle data subject access request (Right to Access)
   */
  async handleAccessRequest(email: string, phone?: string): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: uuidv4(),
      requestType: 'access',
      dataSubjectEmail: email,
      dataSubjectPhone: phone,
      requestDate: new Date(),
      verificationStatus: 'pending',
      fulfillmentStatus: 'pending',
      requestDetails: 'Data subject access request - provide all personal data'
    };

    await dynamodb.send(new PutCommand({
      TableName: this.requestsTableName,
      Item: request
    }));

    // Start verification process
    await this.initiateVerification(request.id, email);

    return request;
  }

  /**
   * Handle data erasure request (Right to be Forgotten)
   */
  async handleErasureRequest(email: string, reason: string, phone?: string): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: uuidv4(),
      requestType: 'erasure',
      dataSubjectEmail: email,
      dataSubjectPhone: phone,
      requestDate: new Date(),
      verificationStatus: 'pending',
      fulfillmentStatus: 'pending',
      requestDetails: reason
    };

    await dynamodb.send(new PutCommand({
      TableName: this.requestsTableName,
      Item: request
    }));

    // Start verification process
    await this.initiateVerification(request.id, email);

    return request;
  }

  /**
   * Handle data portability request
   */
  async handlePortabilityRequest(email: string, phone?: string): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: uuidv4(),
      requestType: 'portability',
      dataSubjectEmail: email,
      dataSubjectPhone: phone,
      requestDate: new Date(),
      verificationStatus: 'pending',
      fulfillmentStatus: 'pending',
      requestDetails: 'Data portability request - export personal data in machine-readable format'
    };

    await dynamodb.send(new PutCommand({
      TableName: this.requestsTableName,
      Item: request
    }));

    await this.initiateVerification(request.id, email);

    return request;
  }

  /**
   * Verify data subject identity
   */
  async verifyDataSubject(requestId: string, verificationToken: string): Promise<boolean> {
    try {
      const request = await this.getDataSubjectRequest(requestId);
      if (!request) return false;

      // Verify token (implement proper token verification)
      const isValid = await this.validateVerificationToken(verificationToken, request.dataSubjectEmail);
      
      if (isValid) {
        await dynamodb.send(new UpdateCommand({
          TableName: this.requestsTableName,
          Key: { id: requestId },
          UpdateExpression: 'SET verificationStatus = :verified, fulfillmentStatus = :inProgress',
          ExpressionAttributeValues: {
            ':verified': 'verified',
            ':inProgress': 'in_progress'
          }
        }));

        // Process the request
        await this.processVerifiedRequest(request);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error verifying data subject:', error);
      return false;
    }
  }

  /**
   * Record opt-out request
   */
  async recordOptOut(optOut: Omit<OptOutRecord, 'id' | 'optOutDate'>): Promise<OptOutRecord> {
    const optOutRecord: OptOutRecord = {
      id: uuidv4(),
      optOutDate: new Date(),
      ...optOut
    };

    await dynamodb.send(new PutCommand({
      TableName: this.optOutTableName,
      Item: optOutRecord
    }));

    return optOutRecord;
  }

  /**
   * Check if email/phone is opted out
   */
  async isOptedOut(email: string, phone?: string, optOutType: OptOutRecord['optOutType'] = 'marketing'): Promise<boolean> {
    try {
      const params: any = {
        TableName: this.optOutTableName,
        FilterExpression: 'email = :email AND (optOutType = :type OR optOutType = :all)',
        ExpressionAttributeValues: {
          ':email': email,
          ':type': optOutType,
          ':all': 'all_communications'
        }
      };

      if (phone) {
        params.FilterExpression += ' OR phone = :phone';
        params.ExpressionAttributeValues[':phone'] = phone;
      }

      const result = await dynamodb.send(new ScanCommand(params));
      return (result.Items?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking opt-out status:', error);
      return true; // Err on the side of caution
    }
  }

  /**
   * Generate privacy notice for data collection
   */
  generatePrivacyNotice(dataTypes: string[], purposes: string[], lawfulBasis: string): string {
    return `
PRIVACY NOTICE

We are collecting the following types of personal data: ${dataTypes.join(', ')}.

PURPOSE: This data will be used for: ${purposes.join(', ')}.

LAWFUL BASIS: We process this data based on: ${lawfulBasis}.

YOUR RIGHTS: You have the right to:
- Access your personal data
- Rectify inaccurate data
- Erase your data (right to be forgotten)
- Restrict processing
- Data portability
- Object to processing
- Withdraw consent (where applicable)

RETENTION: Your data will be retained for the minimum period necessary to fulfill the stated purposes.

CONTACT: To exercise your rights or for privacy questions, contact: privacy@platform.com

OPT-OUT: You can opt out of marketing communications at any time by clicking the unsubscribe link in our emails or contacting us directly.
    `.trim();
  }

  /**
   * Automated data retention and deletion
   */
  async processDataRetention(): Promise<void> {
    try {
      // Find records that have passed their retention period
      const expiredRecords = await this.getExpiredDataRecords();

      for (const record of expiredRecords) {
        if (record.processingStatus === 'active') {
          // Archive first, then delete after grace period
          await this.archiveDataRecord(record.id);
        } else if (record.processingStatus === 'archived') {
          // Delete archived records after additional grace period
          await this.deleteDataRecord(record.id);
        }
      }

      console.log(`Processed ${expiredRecords.length} expired data records`);
    } catch (error) {
      console.error('Error processing data retention:', error);
    }
  }

  // Private helper methods

  private async getConsentRecords(email: string, consentType: GDPRConsent['consentType']): Promise<GDPRConsent[]> {
    const params = {
      TableName: this.consentTableName,
      FilterExpression: 'email = :email AND consentType = :type',
      ExpressionAttributeValues: {
        ':email': email,
        ':type': consentType
      }
    };

    const result = await dynamodb.send(new ScanCommand(params));
    return result.Items as GDPRConsent[] || [];
  }

  private isConsentStillValid(consentDate: Date): boolean {
    // Consent is valid for 2 years under GDPR
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    return new Date(consentDate) > twoYearsAgo;
  }

  private async initiateVerification(requestId: string, email: string): Promise<void> {
    // Generate verification token
    const token = this.generateVerificationToken();
    
    // Store token (implement proper token storage)
    await this.storeVerificationToken(token, email);
    
    // Send verification email (implement email service)
    await this.sendVerificationEmail(email, requestId, token);
  }

  private generateVerificationToken(): string {
    return uuidv4();
  }

  private async storeVerificationToken(token: string, email: string): Promise<void> {
    await dynamodb.send(new PutCommand({
      TableName: 'VerificationTokens',
      Item: {
        token,
        email,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
    }));
  }

  private async validateVerificationToken(token: string, email: string): Promise<boolean> {
    try {
      const result = await dynamodb.send(new GetCommand({
        TableName: 'VerificationTokens',
        Key: { token }
      }));

      const tokenRecord = result.Item;
      if (!tokenRecord) return false;

      // Check if token matches email and hasn't expired
      return tokenRecord.email === email && 
             new Date(tokenRecord.expiresAt) > new Date();
    } catch (error) {
      return false;
    }
  }

  private async sendVerificationEmail(email: string, requestId: string, token: string): Promise<void> {
    // Implement email sending logic
    console.log(`Sending verification email to ${email} for request ${requestId} with token ${token}`);
  }

  private async getDataSubjectRequest(requestId: string): Promise<DataSubjectRequest | null> {
    try {
      const result = await dynamodb.send(new GetCommand({
        TableName: this.requestsTableName,
        Key: { id: requestId }
      }));

      return result.Item as DataSubjectRequest || null;
    } catch (error) {
      return null;
    }
  }

  private async processVerifiedRequest(request: DataSubjectRequest): Promise<void> {
    switch (request.requestType) {
      case 'access':
        await this.fulfillAccessRequest(request);
        break;
      case 'erasure':
        await this.fulfillErasureRequest(request);
        break;
      case 'portability':
        await this.fulfillPortabilityRequest(request);
        break;
      default:
        console.log(`Request type ${request.requestType} not implemented`);
    }
  }

  private async fulfillAccessRequest(request: DataSubjectRequest): Promise<void> {
    // Collect all personal data for the data subject
    const personalData = await this.collectPersonalData(request.dataSubjectEmail);
    
    // Update request with response data
    await dynamodb.send(new UpdateCommand({
      TableName: this.requestsTableName,
      Key: { id: request.id },
      UpdateExpression: 'SET fulfillmentStatus = :completed, fulfillmentDate = :date, responseData = :data',
      ExpressionAttributeValues: {
        ':completed': 'completed',
        ':date': new Date().toISOString(),
        ':data': personalData
      }
    }));

    // Send data to user (implement secure delivery)
    await this.deliverPersonalData(request.dataSubjectEmail, personalData);
  }

  private async fulfillErasureRequest(request: DataSubjectRequest): Promise<void> {
    // Delete/anonymize personal data
    await this.erasePersonalData(request.dataSubjectEmail, request.dataSubjectPhone);
    
    // Update request status
    await dynamodb.send(new UpdateCommand({
      TableName: this.requestsTableName,
      Key: { id: request.id },
      UpdateExpression: 'SET fulfillmentStatus = :completed, fulfillmentDate = :date',
      ExpressionAttributeValues: {
        ':completed': 'completed',
        ':date': new Date().toISOString()
      }
    }));
  }

  private async fulfillPortabilityRequest(request: DataSubjectRequest): Promise<void> {
    // Export data in machine-readable format
    const exportData = await this.exportPersonalData(request.dataSubjectEmail);
    
    // Update request with export data
    await dynamodb.send(new UpdateCommand({
      TableName: this.requestsTableName,
      Key: { id: request.id },
      UpdateExpression: 'SET fulfillmentStatus = :completed, fulfillmentDate = :date, responseData = :data',
      ExpressionAttributeValues: {
        ':completed': 'completed',
        ':date': new Date().toISOString(),
        ':data': exportData
      }
    }));

    // Deliver export file
    await this.deliverExportData(request.dataSubjectEmail, exportData);
  }

  private async collectPersonalData(email: string): Promise<any> {
    // Implement data collection from all relevant tables
    return {
      email,
      collectedAt: new Date().toISOString(),
      // Add actual data collection logic
    };
  }

  private async erasePersonalData(email: string, phone?: string): Promise<void> {
    // Implement data erasure across all tables
    console.log(`Erasing personal data for ${email}`);
  }

  private async exportPersonalData(email: string): Promise<any> {
    // Implement data export in JSON format
    return {
      format: 'JSON',
      exportedAt: new Date().toISOString(),
      data: await this.collectPersonalData(email)
    };
  }

  private async deliverPersonalData(email: string, data: any): Promise<void> {
    // Implement secure data delivery
    console.log(`Delivering personal data to ${email}`);
  }

  private async deliverExportData(email: string, data: any): Promise<void> {
    // Implement secure export delivery
    console.log(`Delivering export data to ${email}`);
  }

  private async getExpiredDataRecords(): Promise<DataProcessingRecord[]> {
    const params = {
      TableName: this.processingTableName,
      FilterExpression: 'deletionDate <= :now',
      ExpressionAttributeValues: {
        ':now': new Date().toISOString()
      }
    };

    const result = await dynamodb.send(new ScanCommand(params));
    return result.Items as DataProcessingRecord[] || [];
  }

  private async archiveDataRecord(recordId: string): Promise<void> {
    await dynamodb.send(new UpdateCommand({
      TableName: this.processingTableName,
      Key: { id: recordId },
      UpdateExpression: 'SET processingStatus = :archived',
      ExpressionAttributeValues: {
        ':archived': 'archived'
      }
    }));
  }

  private async deleteDataRecord(recordId: string): Promise<void> {
    await dynamodb.send(new UpdateCommand({
      TableName: this.processingTableName,
      Key: { id: recordId },
      UpdateExpression: 'SET processingStatus = :deleted',
      ExpressionAttributeValues: {
        ':deleted': 'deleted'
      }
    }));
  }
}

export const gdprComplianceService = new GDPRComplianceService();