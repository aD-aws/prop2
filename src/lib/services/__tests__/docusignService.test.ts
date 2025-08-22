import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DocuSignService, SigningRequest } from '../docusignService';

// Mock fetch
global.fetch = jest.fn();

describe('DocuSignService', () => {
  let docuSignService: DocuSignService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    jest.clearAllMocks();
    docuSignService = new DocuSignService();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isDocuSignEnabled', () => {
    it('should return false when DocuSign is not enabled', () => {
      process.env.DOCUSIGN_ENABLED = 'false';
      docuSignService = new DocuSignService();

      expect(docuSignService.isDocuSignEnabled()).toBe(false);
    });

    it('should return false when configuration is incomplete', () => {
      process.env.DOCUSIGN_ENABLED = 'true';
      process.env.DOCUSIGN_INTEGRATION_KEY = '';
      docuSignService = new DocuSignService();

      expect(docuSignService.isDocuSignEnabled()).toBe(false);
    });

    it('should return true when properly configured', () => {
      process.env.DOCUSIGN_ENABLED = 'true';
      process.env.DOCUSIGN_INTEGRATION_KEY = 'test_key';
      process.env.DOCUSIGN_USER_ID = 'test_user';
      process.env.DOCUSIGN_ACCOUNT_ID = 'test_account';
      process.env.DOCUSIGN_BASE_URL = 'https://demo.docusign.net/restapi';
      docuSignService = new DocuSignService();

      expect(docuSignService.isDocuSignEnabled()).toBe(true);
    });
  });

  describe('createSigningEnvelope', () => {
    const mockSigningRequest: SigningRequest = {
      contractId: 'contract_123',
      homeownerEmail: 'homeowner@example.com',
      homeownerName: 'John Doe',
      builderEmail: 'builder@example.com',
      builderName: 'Builder Corp',
      contractContent: 'Contract content here',
      returnUrl: 'https://app.example.com/contracts/contract_123/signed'
    };

    beforeEach(() => {
      process.env.DOCUSIGN_ENABLED = 'true';
      process.env.DOCUSIGN_INTEGRATION_KEY = 'test_key';
      process.env.DOCUSIGN_USER_ID = 'test_user';
      process.env.DOCUSIGN_ACCOUNT_ID = 'test_account';
      process.env.DOCUSIGN_BASE_URL = 'https://demo.docusign.net/restapi';
      docuSignService = new DocuSignService();
    });

    it('should throw error when DocuSign is not enabled', async () => {
      process.env.DOCUSIGN_ENABLED = 'false';
      docuSignService = new DocuSignService();

      await expect(
        docuSignService.createSigningEnvelope(mockSigningRequest)
      ).rejects.toThrow('DocuSign integration is not enabled');
    });

    it('should create signing envelope successfully', async () => {
      // Mock access token response
      const mockAccessToken = 'mock_access_token';
      
      // Mock envelope creation response
      const mockEnvelopeResponse = {
        envelopeId: 'envelope_123',
        status: 'sent'
      };

      // Mock signing URLs responses
      const mockHomeownerUrlResponse = {
        url: 'https://demo.docusign.net/signing/homeowner_url'
      };

      const mockBuilderUrlResponse = {
        url: 'https://demo.docusign.net/signing/builder_url'
      };

      // Mock the fetch calls
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockEnvelopeResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockHomeownerUrlResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockBuilderUrlResponse)
        });

      // Mock getAccessToken method
      jest.spyOn(docuSignService as any, 'getAccessToken').mockResolvedValue(mockAccessToken);

      const result = await docuSignService.createSigningEnvelope(mockSigningRequest);

      expect(result).toEqual({
        envelopeId: 'envelope_123',
        homeownerSigningUrl: 'https://demo.docusign.net/signing/homeowner_url',
        builderSigningUrl: 'https://demo.docusign.net/signing/builder_url',
        status: 'created'
      });
    });

    it('should handle API errors gracefully', async () => {
      jest.spyOn(docuSignService as any, 'getAccessToken').mockResolvedValue('mock_token');

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      });

      await expect(
        docuSignService.createSigningEnvelope(mockSigningRequest)
      ).rejects.toThrow('Failed to create signing envelope');
    });
  });

  describe('getEnvelopeStatus', () => {
    beforeEach(() => {
      process.env.DOCUSIGN_ENABLED = 'true';
      process.env.DOCUSIGN_INTEGRATION_KEY = 'test_key';
      process.env.DOCUSIGN_USER_ID = 'test_user';
      process.env.DOCUSIGN_ACCOUNT_ID = 'test_account';
      docuSignService = new DocuSignService();
    });

    it('should get envelope status successfully', async () => {
      const mockStatus = {
        envelopeId: 'envelope_123',
        status: 'completed',
        completedDateTime: '2024-01-15T10:30:00Z'
      };

      jest.spyOn(docuSignService as any, 'getAccessToken').mockResolvedValue('mock_token');

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      });

      const result = await docuSignService.getEnvelopeStatus('envelope_123');

      expect(result).toEqual(mockStatus);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/envelopes/envelope_123'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock_token'
          })
        })
      );
    });

    it('should throw error when DocuSign is not enabled', async () => {
      process.env.DOCUSIGN_ENABLED = 'false';
      docuSignService = new DocuSignService();

      await expect(
        docuSignService.getEnvelopeStatus('envelope_123')
      ).rejects.toThrow('DocuSign integration is not enabled');
    });
  });

  describe('downloadCompletedContract', () => {
    beforeEach(() => {
      process.env.DOCUSIGN_ENABLED = 'true';
      process.env.DOCUSIGN_INTEGRATION_KEY = 'test_key';
      process.env.DOCUSIGN_USER_ID = 'test_user';
      process.env.DOCUSIGN_ACCOUNT_ID = 'test_account';
      docuSignService = new DocuSignService();
    });

    it('should download completed contract successfully', async () => {
      const mockPdfBuffer = new ArrayBuffer(1024);

      jest.spyOn(docuSignService as any, 'getAccessToken').mockResolvedValue('mock_token');

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockPdfBuffer)
      });

      const result = await docuSignService.downloadCompletedContract('envelope_123');

      expect(result).toBeInstanceOf(Buffer);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/envelopes/envelope_123/documents/combined'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock_token'
          })
        })
      );
    });

    it('should handle download errors', async () => {
      jest.spyOn(docuSignService as any, 'getAccessToken').mockResolvedValue('mock_token');

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(
        docuSignService.downloadCompletedContract('envelope_123')
      ).rejects.toThrow('Failed to download contract');
    });
  });

  describe('handleWebhookEvent', () => {
    beforeEach(() => {
      docuSignService = new DocuSignService();
    });

    it('should handle completed event', async () => {
      const mockEventData = {
        envelopeId: 'envelope_123',
        status: 'completed'
      };

      const handleCompletedSpy = jest.spyOn(docuSignService as any, 'handleContractCompleted')
        .mockResolvedValue(undefined);

      await docuSignService.handleWebhookEvent(mockEventData);

      expect(handleCompletedSpy).toHaveBeenCalledWith('envelope_123');
    });

    it('should handle declined event', async () => {
      const mockEventData = {
        envelopeId: 'envelope_123',
        status: 'declined'
      };

      const handleDeclinedSpy = jest.spyOn(docuSignService as any, 'handleContractDeclined')
        .mockResolvedValue(undefined);

      await docuSignService.handleWebhookEvent(mockEventData);

      expect(handleDeclinedSpy).toHaveBeenCalledWith('envelope_123');
    });

    it('should handle voided event', async () => {
      const mockEventData = {
        envelopeId: 'envelope_123',
        status: 'voided'
      };

      const handleVoidedSpy = jest.spyOn(docuSignService as any, 'handleContractVoided')
        .mockResolvedValue(undefined);

      await docuSignService.handleWebhookEvent(mockEventData);

      expect(handleVoidedSpy).toHaveBeenCalledWith('envelope_123');
    });

    it('should handle unknown events gracefully', async () => {
      const mockEventData = {
        envelopeId: 'envelope_123',
        status: 'unknown_status'
      };

      // Should not throw an error
      await expect(
        docuSignService.handleWebhookEvent(mockEventData)
      ).resolves.toBeUndefined();
    });

    it('should handle webhook errors gracefully', async () => {
      const mockEventData = {
        envelopeId: 'envelope_123',
        status: 'completed'
      };

      jest.spyOn(docuSignService as any, 'handleContractCompleted')
        .mockRejectedValue(new Error('Database error'));

      // Should not throw an error
      await expect(
        docuSignService.handleWebhookEvent(mockEventData)
      ).resolves.toBeUndefined();
    });
  });

  describe('development mode', () => {
    it('should return mock token in development', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DOCUSIGN_ENABLED = 'true';
      process.env.DOCUSIGN_INTEGRATION_KEY = 'test_key';
      process.env.DOCUSIGN_USER_ID = 'test_user';
      process.env.DOCUSIGN_ACCOUNT_ID = 'test_account';
      docuSignService = new DocuSignService();

      const token = await (docuSignService as any).getAccessToken();
      expect(token).toBe('mock_access_token');
    });

    it('should throw error for JWT authentication in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DOCUSIGN_ENABLED = 'true';
      process.env.DOCUSIGN_INTEGRATION_KEY = 'test_key';
      process.env.DOCUSIGN_USER_ID = 'test_user';
      process.env.DOCUSIGN_ACCOUNT_ID = 'test_account';
      docuSignService = new DocuSignService();

      await expect(
        (docuSignService as any).getAccessToken()
      ).rejects.toThrow('DocuSign JWT authentication not implemented');
    });
  });
});