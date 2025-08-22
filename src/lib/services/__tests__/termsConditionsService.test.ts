import { TermsAndConditions, TermsAmendment } from '../termsConditionsService';

// Mock DynamoDB
const mockSend = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({}))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: mockSend
    }))
  },
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
  QueryCommand: jest.fn(),
  UpdateCommand: jest.fn()
}));

// Import the service after mocking
const { termsConditionsService } = require('../termsConditionsService');

describe('TermsConditionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStandardTerms', () => {
    it('should retrieve standard terms for a project type', async () => {
      const mockTerms: TermsAndConditions = {
        id: 'terms-1',
        projectType: 'kitchen-renovation',
        version: 1,
        title: 'Standard Terms - Kitchen Renovation',
        content: 'Standard terms content',
        sections: [
          {
            id: 'payment-terms',
            title: 'Payment Terms',
            content: 'Payment schedule details',
            order: 1,
            isRequired: true,
            canBeAmended: true
          }
        ],
        isStandard: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      mockSend.mockResolvedValueOnce({ Item: mockTerms });

      const result = await termsConditionsService.getStandardTerms('kitchen-renovation');

      expect(result).toEqual(mockTerms);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return null if no standard terms found', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const result = await termsConditionsService.getStandardTerms('unknown-type');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(termsConditionsService.getStandardTerms('kitchen-renovation'))
        .rejects.toThrow('Failed to retrieve standard terms and conditions');
    });
  });

  describe('createStandardTerms', () => {
    it('should create standard terms for a project type', async () => {
      const termsData = {
        projectType: 'bathroom-renovation',
        version: 1,
        title: 'Standard Terms - Bathroom Renovation',
        content: 'Standard terms content',
        sections: [
          {
            id: 'payment-terms',
            title: 'Payment Terms',
            content: 'Payment schedule details',
            order: 1,
            isRequired: true,
            canBeAmended: true
          }
        ],
        isStandard: true,
        createdBy: 'system',
        isActive: true
      };

      mockSend.mockResolvedValueOnce({});

      const result = await termsConditionsService.createStandardTerms('bathroom-renovation', termsData);

      expect(result).toMatchObject(termsData);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle creation errors', async () => {
      const termsData = {
        projectType: 'bathroom-renovation',
        version: 1,
        title: 'Standard Terms - Bathroom Renovation',
        content: 'Standard terms content',
        sections: [],
        isStandard: true,
        createdBy: 'system',
        isActive: true
      };

      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(termsConditionsService.createStandardTerms('bathroom-renovation', termsData))
        .rejects.toThrow('Failed to create standard terms and conditions');
    });
  });

  describe('proposeAmendment', () => {
    it('should create an amendment proposal', async () => {
      const mockOriginalTerms: TermsAndConditions = {
        id: 'terms-1',
        projectType: 'kitchen-renovation',
        version: 1,
        title: 'Standard Terms - Kitchen Renovation',
        content: 'Standard terms content',
        sections: [
          {
            id: 'payment-terms',
            title: 'Payment Terms',
            content: 'Original payment terms',
            order: 1,
            isRequired: true,
            canBeAmended: true
          }
        ],
        isStandard: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      // Mock getting original terms
      mockSend.mockResolvedValueOnce({ Items: [mockOriginalTerms] });
      // Mock creating amendment
      mockSend.mockResolvedValueOnce({});

      const result = await termsConditionsService.proposeAmendment(
        'project-1',
        'builder-1',
        'terms-1',
        'payment-terms',
        'Modified payment terms',
        'Need different payment schedule'
      );

      expect(result).toMatchObject({
        originalTermsId: 'terms-1',
        builderId: 'builder-1',
        projectId: 'project-1',
        sectionId: 'payment-terms',
        originalContent: 'Original payment terms',
        proposedContent: 'Modified payment terms',
        reason: 'Need different payment schedule',
        status: 'proposed'
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should reject amendment for non-amendable sections', async () => {
      const mockOriginalTerms: TermsAndConditions = {
        id: 'terms-1',
        projectType: 'kitchen-renovation',
        version: 1,
        title: 'Standard Terms - Kitchen Renovation',
        content: 'Standard terms content',
        sections: [
          {
            id: 'insurance-liability',
            title: 'Insurance and Liability',
            content: 'Insurance requirements',
            order: 1,
            isRequired: true,
            canBeAmended: false
          }
        ],
        isStandard: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      mockSend.mockResolvedValueOnce({ Items: [mockOriginalTerms] });

      await expect(termsConditionsService.proposeAmendment(
        'project-1',
        'builder-1',
        'terms-1',
        'insurance-liability',
        'Modified insurance terms',
        'Need different insurance'
      )).rejects.toThrow('This section cannot be amended');
    });
  });

  describe('reviewAmendment', () => {
    it('should accept an amendment', async () => {
      const mockUpdatedAmendment: TermsAmendment = {
        id: 'amendment-1',
        originalTermsId: 'terms-1',
        builderId: 'builder-1',
        projectId: 'project-1',
        sectionId: 'payment-terms',
        originalContent: 'Original content',
        proposedContent: 'Proposed content',
        reason: 'Need changes',
        status: 'accepted',
        createdAt: new Date(),
        reviewedAt: new Date(),
        reviewedBy: 'homeowner-1'
      };

      mockSend.mockResolvedValueOnce({ Attributes: mockUpdatedAmendment });

      const result = await termsConditionsService.reviewAmendment(
        'amendment-1',
        'project-1',
        'homeowner-1',
        'accepted'
      );

      expect(result).toEqual(mockUpdatedAmendment);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should reject an amendment', async () => {
      const mockUpdatedAmendment: TermsAmendment = {
        id: 'amendment-1',
        originalTermsId: 'terms-1',
        builderId: 'builder-1',
        projectId: 'project-1',
        sectionId: 'payment-terms',
        originalContent: 'Original content',
        proposedContent: 'Proposed content',
        reason: 'Need changes',
        status: 'rejected',
        createdAt: new Date(),
        reviewedAt: new Date(),
        reviewedBy: 'homeowner-1'
      };

      mockSend.mockResolvedValueOnce({ Attributes: mockUpdatedAmendment });

      const result = await termsConditionsService.reviewAmendment(
        'amendment-1',
        'project-1',
        'homeowner-1',
        'rejected'
      );

      expect(result.status).toBe('rejected');
    });
  });

  describe('generateFinalTerms', () => {
    it('should generate final terms with accepted amendments', async () => {
      const mockBaseTerms: TermsAndConditions = {
        id: 'terms-1',
        projectType: 'kitchen-renovation',
        version: 1,
        title: 'Standard Terms - Kitchen Renovation',
        content: 'Standard terms content',
        sections: [
          {
            id: 'payment-terms',
            title: 'Payment Terms',
            content: 'Original payment terms',
            order: 1,
            isRequired: true,
            canBeAmended: true
          }
        ],
        isStandard: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      const mockAmendments: TermsAmendment[] = [
        {
          id: 'amendment-1',
          originalTermsId: 'terms-1',
          builderId: 'builder-1',
          projectId: 'project-1',
          sectionId: 'payment-terms',
          originalContent: 'Original payment terms',
          proposedContent: 'Modified payment terms',
          reason: 'Need changes',
          status: 'accepted',
          createdAt: new Date()
        }
      ];

      // Mock getting base terms
      mockSend.mockResolvedValueOnce({ Items: [mockBaseTerms] });
      // Mock getting amendments
      mockSend.mockResolvedValueOnce({ Items: mockAmendments });
      // Mock storing final terms
      mockSend.mockResolvedValueOnce({});

      const result = await termsConditionsService.generateFinalTerms('project-1', 'terms-1');

      expect(result.finalTerms.sections[0].content).toBe('Modified payment terms');
      expect(result.amendments).toHaveLength(1);
      expect(result.homeownerAccepted).toBe(false);
      expect(result.builderAccepted).toBe(false);
    });
  });

  describe('acceptTerms', () => {
    it('should allow homeowner to accept terms', async () => {
      const mockProjectTerms = {
        id: 'project-terms-1',
        projectId: 'project-1',
        homeownerAccepted: true,
        builderAccepted: false
      };

      mockSend.mockResolvedValueOnce({ Attributes: mockProjectTerms });

      const result = await termsConditionsService.acceptTerms('project-1', 'homeowner-1', 'homeowner');

      expect(result.homeownerAccepted).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should mark as fully agreed when both parties accept', async () => {
      const mockProjectTerms = {
        id: 'project-terms-1',
        projectId: 'project-1',
        homeownerAccepted: true,
        builderAccepted: true
      };

      // First call returns updated terms
      mockSend.mockResolvedValueOnce({ Attributes: mockProjectTerms });
      // Second call sets agreedAt
      mockSend.mockResolvedValueOnce({ 
        Attributes: { ...mockProjectTerms, agreedAt: new Date() }
      });

      const result = await termsConditionsService.acceptTerms('project-1', 'builder-1', 'builder');

      expect(result.agreedAt).toBeDefined();
      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('compareTermsVariations', () => {
    it('should return comparison data for terms variations', async () => {
      const mockAmendments: TermsAmendment[] = [
        {
          id: 'amendment-1',
          originalTermsId: 'terms-1',
          builderId: 'builder-1',
          projectId: 'project-1',
          sectionId: 'payment-terms',
          originalContent: 'Original content',
          proposedContent: 'Proposed content',
          reason: 'Need changes',
          status: 'proposed',
          createdAt: new Date()
        }
      ];

      const mockBaseTerms: TermsAndConditions = {
        id: 'terms-1',
        projectType: 'kitchen-renovation',
        version: 1,
        title: 'Standard Terms - Kitchen Renovation',
        content: 'Standard terms content',
        sections: [],
        isStandard: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      // Mock getting amendments
      mockSend.mockResolvedValueOnce({ Items: mockAmendments });
      // Mock getting project terms
      mockSend.mockResolvedValueOnce({ Item: null });
      // Mock getting base terms
      mockSend.mockResolvedValueOnce({ Items: [mockBaseTerms] });

      const result = await termsConditionsService.compareTermsVariations('project-1');

      expect(result.standardTerms).toEqual(mockBaseTerms);
      expect(result.proposedAmendments).toEqual(mockAmendments);
      expect(result.finalTerms).toBeUndefined();
    });
  });
});