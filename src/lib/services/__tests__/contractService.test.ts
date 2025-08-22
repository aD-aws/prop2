import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ContractService } from '../contractService';
import { Quote, SoWDocument, Contract } from '../../types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

describe('ContractService', () => {
  let contractService: ContractService;
  let mockDynamoClient: any;

  const mockQuote: Quote = {
    id: 'quote_123',
    projectId: 'project_123',
    builderId: 'builder_123',
    pricing: {
      totalAmount: 25000,
      laborCosts: 15000,
      materialCosts: 10000,
      breakdown: [
        { category: 'Labor', description: 'Installation work', amount: 15000 },
        { category: 'Materials', description: 'Building materials', amount: 10000 }
      ]
    },
    timeline: 30,
    startDate: new Date('2024-03-01'),
    projectedCompletionDate: new Date('2024-04-15'),
    amendments: [],
    termsAndConditions: 'Standard terms apply',
    insuranceDocuments: [],
    referenceProjects: [
      {
        address: '123 Test Street',
        projectType: 'Kitchen renovation',
        completionDate: new Date('2023-12-01'),
        contactAllowed: true,
        visitAllowed: false,
        description: 'Full kitchen refit'
      }
    ],
    status: 'submitted',
    submittedAt: new Date()
  };

  const mockSoWDocument: SoWDocument = {
    id: 'sow_123',
    projectId: 'project_123',
    version: 1,
    sections: [
      {
        id: 'section_1',
        title: 'Kitchen Installation',
        description: 'Complete kitchen renovation including units, worktops, and appliances',
        specifications: ['Modern units', 'Quartz worktops', 'Integrated appliances'],
        dependencies: []
      }
    ],
    materials: [
      {
        id: 'material_1',
        name: 'Kitchen Units',
        category: 'builder_provided',
        quantity: 1,
        unit: 'set',
        estimatedCost: 5000,
        specifications: ['Modern style', 'Soft close doors']
      }
    ],
    laborRequirements: [
      {
        id: 'labor_1',
        trade: 'Kitchen Fitter',
        description: 'Install kitchen units and worktops',
        personDays: 10,
        estimatedCost: 8000,
        qualifications: ['Kitchen fitting certification']
      }
    ],
    timeline: [],
    estimatedCosts: {
      totalEstimate: 25000,
      laborCosts: 15000,
      materialCosts: 10000,
      builderMaterials: 8000,
      homeownerMaterials: 2000,
      breakdown: []
    },
    regulatoryRequirements: [
      {
        id: 'reg_1',
        type: 'Building Regulations',
        description: 'Electrical work must comply with Part P',
        mandatory: true
      }
    ],
    generatedAt: new Date(),
    projectType: 'kitchen_full_refit'
  };

  beforeEach(() => {
    mockDynamoClient = {
      send: jest.fn()
    };

    // Mock the DynamoDB client
    const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
    DynamoDBDocumentClient.from = jest.fn().mockReturnValue(mockDynamoClient);

    contractService = new ContractService();
  });

  describe('generateContract', () => {
    it('should generate a contract successfully', async () => {
      // Mock template retrieval
      mockDynamoClient.send
        .mockResolvedValueOnce({ Item: null }) // No specific template found
        .mockResolvedValueOnce({}); // Store contract

      const contract = await contractService.generateContract(
        'project_123',
        mockQuote,
        mockSoWDocument,
        'homeowner_123',
        'builder_123'
      );

      expect(contract).toBeDefined();
      expect(contract.projectId).toBe('project_123');
      expect(contract.homeownerId).toBe('homeowner_123');
      expect(contract.builderId).toBe('builder_123');
      expect(contract.totalAmount).toBe(25000);
      expect(contract.status).toBe('draft');
      expect(contract.complianceChecks.ukBuildingRegulations).toBe(true);
      expect(contract.complianceChecks.industryStandards).toBe(true);
      expect(contract.complianceChecks.unambiguousTerms).toBe(true);
    });

    it('should include project-specific content in contract', async () => {
      mockDynamoClient.send
        .mockResolvedValueOnce({ Item: null })
        .mockResolvedValueOnce({});

      const contract = await contractService.generateContract(
        'project_123',
        mockQuote,
        mockSoWDocument,
        'homeowner_123',
        'builder_123'
      );

      expect(contract.content).toContain('Kitchen Installation');
      expect(contract.content).toContain('£25,000');
      expect(contract.content).toContain('30 working days');
      expect(contract.content).toContain('Kitchen Units');
      expect(contract.content).toContain('Kitchen Fitter');
    });

    it('should handle errors gracefully', async () => {
      mockDynamoClient.send.mockRejectedValue(new Error('Database error'));

      await expect(
        contractService.generateContract(
          'project_123',
          mockQuote,
          mockSoWDocument,
          'homeowner_123',
          'builder_123'
        )
      ).rejects.toThrow('Failed to generate contract');
    });
  });

  describe('getContract', () => {
    it('should retrieve a contract by ID', async () => {
      const mockContract: Contract = {
        id: 'contract_123',
        projectId: 'project_123',
        homeownerId: 'homeowner_123',
        builderId: 'builder_123',
        quoteId: 'quote_123',
        sowId: 'sow_123',
        content: 'Contract content',
        status: 'draft',
        templateVersion: '1.0',
        totalAmount: 25000,
        projectTimeline: 30,
        startDate: new Date(),
        projectedCompletionDate: new Date(),
        termsAndConditions: 'Standard terms',
        createdAt: new Date(),
        updatedAt: new Date(),
        complianceChecks: {
          ukBuildingRegulations: true,
          industryStandards: true,
          unambiguousTerms: true,
          validatedAt: new Date()
        }
      };

      mockDynamoClient.send.mockResolvedValue({ Item: mockContract });

      const result = await contractService.getContract('contract_123');

      expect(result).toEqual(mockContract);
      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'Contracts',
            Key: { id: 'contract_123' }
          })
        })
      );
    });

    it('should return null if contract not found', async () => {
      mockDynamoClient.send.mockResolvedValue({ Item: undefined });

      const result = await contractService.getContract('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockDynamoClient.send.mockRejectedValue(new Error('Database error'));

      const result = await contractService.getContract('contract_123');

      expect(result).toBeNull();
    });
  });

  describe('getProjectContracts', () => {
    it('should retrieve all contracts for a project', async () => {
      const mockContracts = [
        { id: 'contract_1', projectId: 'project_123', status: 'draft' },
        { id: 'contract_2', projectId: 'project_123', status: 'signed' }
      ];

      mockDynamoClient.send.mockResolvedValue({ Items: mockContracts });

      const result = await contractService.getProjectContracts('project_123');

      expect(result).toEqual(mockContracts);
      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'Contracts',
            IndexName: 'ProjectIdIndex',
            KeyConditionExpression: 'projectId = :projectId'
          })
        })
      );
    });

    it('should return empty array if no contracts found', async () => {
      mockDynamoClient.send.mockResolvedValue({ Items: undefined });

      const result = await contractService.getProjectContracts('project_123');

      expect(result).toEqual([]);
    });
  });

  describe('updateContractStatus', () => {
    it('should update contract status successfully', async () => {
      mockDynamoClient.send.mockResolvedValue({});

      await contractService.updateContractStatus('contract_123', 'signed');

      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'Contracts',
            Key: { id: 'contract_123' },
            UpdateExpression: expect.stringContaining('SET #status = :status')
          })
        })
      );
    });

    it('should include signature data when provided', async () => {
      const signatureData = {
        homeownerSignature: {
          signedAt: new Date(),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        }
      };

      mockDynamoClient.send.mockResolvedValue({});

      await contractService.updateContractStatus('contract_123', 'signed', signatureData);

      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            UpdateExpression: expect.stringContaining('signatureData = :signatureData')
          })
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockDynamoClient.send.mockRejectedValue(new Error('Database error'));

      await expect(
        contractService.updateContractStatus('contract_123', 'signed')
      ).rejects.toThrow('Failed to update contract status');
    });
  });

  describe('contract content formatting', () => {
    it('should format SoW sections correctly', async () => {
      mockDynamoClient.send
        .mockResolvedValueOnce({ Item: null })
        .mockResolvedValueOnce({});

      const contract = await contractService.generateContract(
        'project_123',
        mockQuote,
        mockSoWDocument,
        'homeowner_123',
        'builder_123'
      );

      expect(contract.content).toContain('### 1. Kitchen Installation');
      expect(contract.content).toContain('Complete kitchen renovation');
    });

    it('should format materials list correctly', async () => {
      mockDynamoClient.send
        .mockResolvedValueOnce({ Item: null })
        .mockResolvedValueOnce({});

      const contract = await contractService.generateContract(
        'project_123',
        mockQuote,
        mockSoWDocument,
        'homeowner_123',
        'builder_123'
      );

      expect(contract.content).toContain('- Kitchen Units: Modern style (builder_provided)');
    });

    it('should format pricing breakdown correctly', async () => {
      mockDynamoClient.send
        .mockResolvedValueOnce({ Item: null })
        .mockResolvedValueOnce({});

      const contract = await contractService.generateContract(
        'project_123',
        mockQuote,
        mockSoWDocument,
        'homeowner_123',
        'builder_123'
      );

      expect(contract.content).toContain('- Labor: £15,000 - Installation work');
      expect(contract.content).toContain('- Materials: £10,000 - Building materials');
    });

    it('should format reference projects correctly', async () => {
      mockDynamoClient.send
        .mockResolvedValueOnce({ Item: null })
        .mockResolvedValueOnce({});

      const contract = await contractService.generateContract(
        'project_123',
        mockQuote,
        mockSoWDocument,
        'homeowner_123',
        'builder_123'
      );

      expect(contract.content).toContain('- Kitchen renovation at 123 Test Street');
      expect(contract.content).toContain('01/12/2023');
    });
  });

  describe('compliance checks', () => {
    it('should validate UK building regulations compliance', async () => {
      mockDynamoClient.send
        .mockResolvedValueOnce({ Item: null })
        .mockResolvedValueOnce({});

      const contract = await contractService.generateContract(
        'project_123',
        mockQuote,
        mockSoWDocument,
        'homeowner_123',
        'builder_123'
      );

      expect(contract.complianceChecks.ukBuildingRegulations).toBe(true);
      expect(contract.complianceChecks.validatedAt).toBeInstanceOf(Date);
    });

    it('should validate industry standards compliance', async () => {
      mockDynamoClient.send
        .mockResolvedValueOnce({ Item: null })
        .mockResolvedValueOnce({});

      const contract = await contractService.generateContract(
        'project_123',
        mockQuote,
        mockSoWDocument,
        'homeowner_123',
        'builder_123'
      );

      expect(contract.complianceChecks.industryStandards).toBe(true);
    });

    it('should validate unambiguous terms', async () => {
      mockDynamoClient.send
        .mockResolvedValueOnce({ Item: null })
        .mockResolvedValueOnce({});

      const contract = await contractService.generateContract(
        'project_123',
        mockQuote,
        mockSoWDocument,
        'homeowner_123',
        'builder_123'
      );

      expect(contract.complianceChecks.unambiguousTerms).toBe(true);
    });
  });
});