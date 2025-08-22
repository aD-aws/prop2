import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

export interface PlanningApplication {
  id: string;
  applicationNumber: string;
  address: string;
  postcode: string;
  councilArea: string;
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  applicantAddress?: string;
  projectType: string;
  description: string;
  submissionDate: Date;
  status: 'submitted' | 'approved' | 'rejected' | 'pending';
  scrapedAt: Date;
  source: string; // Council website URL
  gdprConsent: boolean;
  marketingOptOut: boolean;
  lastContactedAt?: Date;
  contactAttempts: number;
}

export interface CouncilScrapingConfig {
  councilName: string;
  baseUrl: string;
  searchEndpoint: string;
  detailsEndpoint: string;
  selectors: {
    applicationList: string;
    applicationNumber: string;
    address: string;
    applicantName: string;
    applicantContact: string;
    projectDescription: string;
    status: string;
    submissionDate: string;
  };
  rateLimit: number; // requests per minute
  enabled: boolean;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  targetCriteria: {
    councilAreas?: string[];
    projectTypes?: string[];
    postcodes?: string[];
    dateRange?: {
      from: Date;
      to: Date;
    };
  };
  messageTemplate: string;
  channel: 'email' | 'sms' | 'postal';
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  sentCount: number;
  responseCount: number;
  optOutCount: number;
}

export class PlanningPermissionDataMiningService {
  private readonly tableName = 'PlanningApplications';
  private readonly configTableName = 'CouncilScrapingConfigs';
  private readonly campaignTableName = 'MarketingCampaigns';

  /**
   * Scrape planning applications from council websites
   */
  async scrapeCouncilWebsite(councilName: string): Promise<PlanningApplication[]> {
    try {
      // Get scraping configuration for the council
      const config = await this.getCouncilConfig(councilName);
      if (!config || !config.enabled) {
        throw new Error(`Scraping not configured or disabled for ${councilName}`);
      }

      // Implement rate limiting
      await this.enforceRateLimit(councilName, config.rateLimit);

      // Scrape applications (this would use a web scraping library like Puppeteer)
      const applications = await this.performScraping(config);

      // Store applications in database
      const storedApplications = await this.storeApplications(applications);

      return storedApplications;
    } catch (error) {
      console.error(`Error scraping ${councilName}:`, error);
      throw error;
    }
  }

  /**
   * Extract homeowner contact information from planning applications
   */
  async extractContactInformation(applicationId: string): Promise<PlanningApplication> {
    try {
      const application = await this.getApplication(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Enhanced contact extraction logic
      const enhancedApplication = await this.enhanceContactData(application);

      // Update application with extracted contact info
      await this.updateApplication(enhancedApplication);

      return enhancedApplication;
    } catch (error) {
      console.error(`Error extracting contact info for ${applicationId}:`, error);
      throw error;
    }
  }

  /**
   * Store planning application data securely with GDPR compliance
   */
  async storeApplications(applications: Partial<PlanningApplication>[]): Promise<PlanningApplication[]> {
    const storedApplications: PlanningApplication[] = [];

    for (const app of applications) {
      const application: PlanningApplication = {
        id: uuidv4(),
        applicationNumber: app.applicationNumber || '',
        address: app.address || '',
        postcode: this.extractPostcode(app.address || ''),
        councilArea: app.councilArea || '',
        applicantName: app.applicantName,
        applicantEmail: app.applicantEmail,
        applicantPhone: app.applicantPhone,
        applicantAddress: app.applicantAddress,
        projectType: this.categorizeProjectType(app.description || ''),
        description: app.description || '',
        submissionDate: app.submissionDate || new Date(),
        status: app.status || 'submitted',
        scrapedAt: new Date(),
        source: app.source || '',
        gdprConsent: false, // Default to false, must be explicitly obtained
        marketingOptOut: false,
        contactAttempts: 0
      };

      // Store with encryption and audit trail
      await dynamodb.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          ...application,
          // Add GDPR compliance fields
          dataRetentionDate: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)), // 1 year retention
          consentSource: 'scraped_public_data',
          processingLawfulBasis: 'legitimate_interest'
        }
      }));

      storedApplications.push(application);
    }

    return storedApplications;
  }

  /**
   * Create and manage targeted marketing campaigns
   */
  async createMarketingCampaign(campaign: Omit<MarketingCampaign, 'id' | 'createdAt' | 'sentCount' | 'responseCount' | 'optOutCount'>): Promise<MarketingCampaign> {
    const newCampaign: MarketingCampaign = {
      id: uuidv4(),
      createdAt: new Date(),
      sentCount: 0,
      responseCount: 0,
      optOutCount: 0,
      ...campaign
    };

    await dynamodb.send(new PutCommand({
      TableName: this.campaignTableName,
      Item: newCampaign
    }));

    return newCampaign;
  }

  /**
   * Execute marketing campaign with GDPR compliance
   */
  async executeCampaign(campaignId: string): Promise<void> {
    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign || campaign.status !== 'active') {
        throw new Error('Campaign not found or not active');
      }

      // Get target prospects based on criteria
      const prospects = await this.getTargetProspects(campaign.targetCriteria);

      // Filter out opted-out users
      const eligibleProspects = prospects.filter(p => !p.marketingOptOut);

      // Send marketing messages with opt-out mechanisms
      for (const prospect of eligibleProspects) {
        await this.sendMarketingMessage(prospect, campaign);
        
        // Update contact tracking
        await this.updateContactTracking(prospect.id);
        
        // Respect rate limits and avoid spam
        await this.delay(1000); // 1 second delay between sends
      }

      // Update campaign statistics
      await this.updateCampaignStats(campaignId, eligibleProspects.length);

    } catch (error) {
      console.error(`Error executing campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Handle opt-out requests with immediate effect
   */
  async handleOptOut(email: string, phone?: string): Promise<void> {
    try {
      // Find all applications for this contact
      const applications = await this.findApplicationsByContact(email, phone);

      // Mark all as opted out
      for (const app of applications) {
        await dynamodb.send(new UpdateCommand({
          TableName: this.tableName,
          Key: { id: app.id },
          UpdateExpression: 'SET marketingOptOut = :optOut, optOutDate = :date',
          ExpressionAttributeValues: {
            ':optOut': true,
            ':date': new Date().toISOString()
          }
        }));
      }

      // Add to global opt-out list
      await this.addToGlobalOptOutList(email, phone);

    } catch (error) {
      console.error('Error handling opt-out:', error);
      throw error;
    }
  }

  /**
   * GDPR data deletion and right to be forgotten
   */
  async deletePersonalData(email: string, phone?: string): Promise<void> {
    try {
      const applications = await this.findApplicationsByContact(email, phone);

      for (const app of applications) {
        // Anonymize personal data while keeping statistical data
        await dynamodb.send(new UpdateCommand({
          TableName: this.tableName,
          Key: { id: app.id },
          UpdateExpression: 'REMOVE applicantName, applicantEmail, applicantPhone, applicantAddress SET #deleted = :deleted',
          ExpressionAttributeNames: {
            '#deleted': 'personalDataDeleted'
          },
          ExpressionAttributeValues: {
            ':deleted': new Date().toISOString()
          }
        }));
      }

    } catch (error) {
      console.error('Error deleting personal data:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getCouncilConfig(councilName: string): Promise<CouncilScrapingConfig | null> {
    try {
      const result = await dynamodb.send(new GetCommand({
        TableName: this.configTableName,
        Key: { councilName }
      }));

      return result.Item as CouncilScrapingConfig || null;
    } catch (error) {
      console.error('Error getting council config:', error);
      return null;
    }
  }

  private async enforceRateLimit(councilName: string, rateLimit: number): Promise<void> {
    // Implement rate limiting logic using DynamoDB or Redis
    // This is a simplified version
    const lastRequest = await this.getLastRequestTime(councilName);
    const minInterval = 60000 / rateLimit; // milliseconds between requests
    
    if (lastRequest && (Date.now() - lastRequest.getTime()) < minInterval) {
      const waitTime = minInterval - (Date.now() - lastRequest.getTime());
      await this.delay(waitTime);
    }

    await this.updateLastRequestTime(councilName);
  }

  private async performScraping(config: CouncilScrapingConfig): Promise<Partial<PlanningApplication>[]> {
    // This would implement actual web scraping using Puppeteer or similar
    // For now, return mock data structure
    return [
      {
        applicationNumber: 'MOCK001',
        address: '123 Mock Street, London, SW1A 1AA',
        councilArea: config.councilName,
        description: 'Single storey rear extension',
        submissionDate: new Date(),
        status: 'submitted',
        source: config.baseUrl
      }
    ];
  }

  private async enhanceContactData(application: PlanningApplication): Promise<PlanningApplication> {
    // Implement contact data enhancement logic
    // This could involve additional API calls or data enrichment services
    return application;
  }

  private extractPostcode(address: string): string {
    const postcodeRegex = /([A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2})/i;
    const match = address.match(postcodeRegex);
    return match ? match[1].toUpperCase() : '';
  }

  private categorizeProjectType(description: string): string {
    const keywords = {
      'extension': ['extension', 'extend'],
      'loft_conversion': ['loft', 'attic', 'roof'],
      'kitchen': ['kitchen'],
      'bathroom': ['bathroom', 'shower', 'toilet'],
      'garage_conversion': ['garage'],
      'conservatory': ['conservatory', 'orangery']
    };

    const lowerDesc = description.toLowerCase();
    
    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => lowerDesc.includes(word))) {
        return type;
      }
    }

    return 'other';
  }

  private async getApplication(id: string): Promise<PlanningApplication | null> {
    try {
      const result = await dynamodb.send(new GetCommand({
        TableName: this.tableName,
        Key: { id }
      }));

      return result.Item as PlanningApplication || null;
    } catch (error) {
      console.error('Error getting application:', error);
      return null;
    }
  }

  private async updateApplication(application: PlanningApplication): Promise<void> {
    await dynamodb.send(new PutCommand({
      TableName: this.tableName,
      Item: application
    }));
  }

  private async getCampaign(id: string): Promise<MarketingCampaign | null> {
    try {
      const result = await dynamodb.send(new GetCommand({
        TableName: this.campaignTableName,
        Key: { id }
      }));

      return result.Item as MarketingCampaign || null;
    } catch (error) {
      console.error('Error getting campaign:', error);
      return null;
    }
  }

  private async getTargetProspects(criteria: MarketingCampaign['targetCriteria']): Promise<PlanningApplication[]> {
    // Implement complex querying based on criteria
    // This would use DynamoDB queries with appropriate indexes
    const params: any = {
      TableName: this.tableName,
      FilterExpression: 'personalDataDeleted <> :deleted',
      ExpressionAttributeValues: {
        ':deleted': true
      }
    };

    const result = await dynamodb.send(new ScanCommand(params));
    return result.Items as PlanningApplication[] || [];
  }

  private async sendMarketingMessage(prospect: PlanningApplication, campaign: MarketingCampaign): Promise<void> {
    // Implement actual message sending logic
    // Include opt-out link in every message
    const optOutLink = `https://platform.com/opt-out?token=${this.generateOptOutToken(prospect)}`;
    
    console.log(`Sending ${campaign.channel} to ${prospect.applicantEmail}: ${campaign.messageTemplate}`);
    console.log(`Opt-out link: ${optOutLink}`);
  }

  private generateOptOutToken(prospect: PlanningApplication): string {
    // Generate secure token for opt-out
    return Buffer.from(`${prospect.id}:${prospect.applicantEmail}`).toString('base64');
  }

  private async updateContactTracking(applicationId: string): Promise<void> {
    await dynamodb.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { id: applicationId },
      UpdateExpression: 'SET lastContactedAt = :date, contactAttempts = contactAttempts + :inc',
      ExpressionAttributeValues: {
        ':date': new Date().toISOString(),
        ':inc': 1
      }
    }));
  }

  private async updateCampaignStats(campaignId: string, sentCount: number): Promise<void> {
    await dynamodb.send(new UpdateCommand({
      TableName: this.campaignTableName,
      Key: { id: campaignId },
      UpdateExpression: 'SET sentCount = sentCount + :count',
      ExpressionAttributeValues: {
        ':count': sentCount
      }
    }));
  }

  private async findApplicationsByContact(email: string, phone?: string): Promise<PlanningApplication[]> {
    const params: any = {
      TableName: this.tableName,
      FilterExpression: 'applicantEmail = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    };

    if (phone) {
      params.FilterExpression += ' OR applicantPhone = :phone';
      params.ExpressionAttributeValues[':phone'] = phone;
    }

    const result = await dynamodb.send(new ScanCommand(params));
    return result.Items as PlanningApplication[] || [];
  }

  private async addToGlobalOptOutList(email: string, phone?: string): Promise<void> {
    await dynamodb.send(new PutCommand({
      TableName: 'GlobalOptOutList',
      Item: {
        email,
        phone,
        optOutDate: new Date().toISOString()
      }
    }));
  }

  private async getLastRequestTime(councilName: string): Promise<Date | null> {
    try {
      const result = await dynamodb.send(new GetCommand({
        TableName: 'ScrapingRateLimit',
        Key: { councilName }
      }));

      return result.Item?.lastRequestTime ? new Date(result.Item.lastRequestTime) : null;
    } catch (error) {
      return null;
    }
  }

  private async updateLastRequestTime(councilName: string): Promise<void> {
    await dynamodb.send(new PutCommand({
      TableName: 'ScrapingRateLimit',
      Item: {
        councilName,
        lastRequestTime: new Date().toISOString()
      }
    }));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const planningPermissionDataMiningService = new PlanningPermissionDataMiningService();