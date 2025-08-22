import { Contract } from '../types';

export interface DocuSignConfig {
  integrationKey: string;
  userId: string;
  accountId: string;
  baseUrl: string;
  privateKey: string;
}

export interface SigningRequest {
  contractId: string;
  homeownerEmail: string;
  homeownerName: string;
  builderEmail: string;
  builderName: string;
  contractContent: string;
  returnUrl?: string;
}

export interface SigningResponse {
  envelopeId: string;
  homeownerSigningUrl: string;
  builderSigningUrl: string;
  status: 'created' | 'sent' | 'delivered' | 'signed' | 'completed';
}

export class DocuSignService {
  private config: DocuSignConfig;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.DOCUSIGN_ENABLED === 'true';
    
    if (this.isEnabled) {
      this.config = {
        integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY || '',
        userId: process.env.DOCUSIGN_USER_ID || '',
        accountId: process.env.DOCUSIGN_ACCOUNT_ID || '',
        baseUrl: process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi',
        privateKey: process.env.DOCUSIGN_PRIVATE_KEY || ''
      };
    }
  }

  /**
   * Check if DocuSign integration is enabled
   */
  isDocuSignEnabled(): boolean {
    return this.isEnabled && this.validateConfig();
  }

  /**
   * Create signing envelope for contract
   */
  async createSigningEnvelope(request: SigningRequest): Promise<SigningResponse> {
    if (!this.isEnabled) {
      throw new Error('DocuSign integration is not enabled');
    }

    try {
      // Get access token
      const accessToken = await this.getAccessToken();

      // Create envelope
      const envelope = await this.createEnvelope(request, accessToken);

      // Get signing URLs
      const signingUrls = await this.getSigningUrls(envelope.envelopeId, request, accessToken);

      return {
        envelopeId: envelope.envelopeId,
        homeownerSigningUrl: signingUrls.homeownerUrl,
        builderSigningUrl: signingUrls.builderUrl,
        status: 'created'
      };
    } catch (error) {
      console.error('Error creating DocuSign envelope:', error);
      throw new Error('Failed to create signing envelope');
    }
  }

  /**
   * Get envelope status
   */
  async getEnvelopeStatus(envelopeId: string): Promise<any> {
    if (!this.isEnabled) {
      throw new Error('DocuSign integration is not enabled');
    }

    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `${this.config.baseUrl}/v2.1/accounts/${this.config.accountId}/envelopes/${envelopeId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`DocuSign API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting envelope status:', error);
      throw new Error('Failed to get envelope status');
    }
  }

  /**
   * Download completed contract
   */
  async downloadCompletedContract(envelopeId: string): Promise<Buffer> {
    if (!this.isEnabled) {
      throw new Error('DocuSign integration is not enabled');
    }

    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `${this.config.baseUrl}/v2.1/accounts/${this.config.accountId}/envelopes/${envelopeId}/documents/combined`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`DocuSign API error: ${response.statusText}`);
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('Error downloading contract:', error);
      throw new Error('Failed to download contract');
    }
  }

  /**
   * Handle DocuSign webhook events
   */
  async handleWebhookEvent(eventData: any): Promise<void> {
    try {
      const { envelopeId, status } = eventData;
      
      // Process different event types
      switch (status) {
        case 'completed':
          await this.handleContractCompleted(envelopeId);
          break;
        case 'declined':
          await this.handleContractDeclined(envelopeId);
          break;
        case 'voided':
          await this.handleContractVoided(envelopeId);
          break;
        default:
          console.log(`Unhandled DocuSign event: ${status}`);
      }
    } catch (error) {
      console.error('Error handling DocuSign webhook:', error);
    }
  }

  /**
   * Get access token using JWT
   */
  private async getAccessToken(): Promise<string> {
    // In a real implementation, this would use JWT authentication
    // For now, return a mock token or implement OAuth flow
    
    if (process.env.NODE_ENV === 'development') {
      return 'mock_access_token';
    }

    // JWT implementation would go here
    throw new Error('DocuSign JWT authentication not implemented');
  }

  /**
   * Create envelope with contract document
   */
  private async createEnvelope(request: SigningRequest, accessToken: string): Promise<any> {
    const envelopeDefinition = {
      emailSubject: `Home Improvement Contract - ${request.contractId}`,
      documents: [{
        documentId: '1',
        name: `Contract_${request.contractId}.pdf`,
        documentBase64: Buffer.from(request.contractContent).toString('base64'),
        fileExtension: 'pdf'
      }],
      recipients: {
        signers: [
          {
            email: request.homeownerEmail,
            name: request.homeownerName,
            recipientId: '1',
            routingOrder: '1',
            tabs: {
              signHereTabs: [{
                documentId: '1',
                pageNumber: '1',
                xPosition: '100',
                yPosition: '700'
              }],
              dateSignedTabs: [{
                documentId: '1',
                pageNumber: '1',
                xPosition: '300',
                yPosition: '700'
              }]
            }
          },
          {
            email: request.builderEmail,
            name: request.builderName,
            recipientId: '2',
            routingOrder: '2',
            tabs: {
              signHereTabs: [{
                documentId: '1',
                pageNumber: '1',
                xPosition: '100',
                yPosition: '750'
              }],
              dateSignedTabs: [{
                documentId: '1',
                pageNumber: '1',
                xPosition: '300',
                yPosition: '750'
              }]
            }
          }
        ]
      },
      status: 'sent'
    };

    const response = await fetch(
      `${this.config.baseUrl}/v2.1/accounts/${this.config.accountId}/envelopes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envelopeDefinition)
      }
    );

    if (!response.ok) {
      throw new Error(`DocuSign API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get signing URLs for recipients
   */
  private async getSigningUrls(envelopeId: string, request: SigningRequest, accessToken: string): Promise<any> {
    const returnUrl = request.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/contracts/${request.contractId}/signed`;

    // Get homeowner signing URL
    const homeownerResponse = await fetch(
      `${this.config.baseUrl}/v2.1/accounts/${this.config.accountId}/envelopes/${envelopeId}/views/recipient`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: '1',
          returnUrl,
          authenticationMethod: 'email'
        })
      }
    );

    // Get builder signing URL
    const builderResponse = await fetch(
      `${this.config.baseUrl}/v2.1/accounts/${this.config.accountId}/envelopes/${envelopeId}/views/recipient`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: '2',
          returnUrl,
          authenticationMethod: 'email'
        })
      }
    );

    const homeownerData = await homeownerResponse.json();
    const builderData = await builderResponse.json();

    return {
      homeownerUrl: homeownerData.url,
      builderUrl: builderData.url
    };
  }

  /**
   * Validate DocuSign configuration
   */
  private validateConfig(): boolean {
    return !!(
      this.config.integrationKey &&
      this.config.userId &&
      this.config.accountId &&
      this.config.baseUrl
    );
  }

  /**
   * Handle contract completion
   */
  private async handleContractCompleted(envelopeId: string): Promise<void> {
    // Update contract status in database
    // Download signed document
    // Notify relevant parties
    console.log(`Contract completed: ${envelopeId}`);
  }

  /**
   * Handle contract declined
   */
  private async handleContractDeclined(envelopeId: string): Promise<void> {
    // Update contract status
    // Notify parties of decline
    console.log(`Contract declined: ${envelopeId}`);
  }

  /**
   * Handle contract voided
   */
  private async handleContractVoided(envelopeId: string): Promise<void> {
    // Update contract status
    // Handle voided contract cleanup
    console.log(`Contract voided: ${envelopeId}`);
  }
}

export const docuSignService = new DocuSignService();