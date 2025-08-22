import { BuilderProfile, VettingStatus, Document } from '@/lib/types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

// Mock fetch for Companies House API
global.fetch = jest.fn();

// Import after mocking
import { builderVerificationService, VettingRecord } from '../builderVerificationService';

describe('BuilderVerificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COMPANIES_HOUSE_API_KEY = 'test-api-key';
  });

  describe('hasRequiredInsurance', () => {
    it('should return true when all required insurance types are verified and valid', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1); // Set to next year

      const mockVettingRecord: VettingRecord = {
        builderId: 'builder123',
        status: 'pending',
        insuranceVerification: [
          {
            documentId: 'doc1',
            policyNumber: 'PL123',
            provider: 'Test Insurance',
            coverageType: 'public_liability',
            coverageAmount: 2000000,
            validFrom: new Date('2024-01-01'),
            validTo: futureDate,
            verified: true,
          },
          {
            documentId: 'doc2',
            policyNumber: 'EL456',
            provider: 'Test Insurance',
            coverageType: 'employers_liability',
            coverageAmount: 10000000,
            validFrom: new Date('2024-01-01'),
            validTo: futureDate,
            verified: true,
          },
        ],
        referenceVerification: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = builderVerificationService.hasRequiredInsurance(mockVettingRecord);
      expect(result).toBe(true);
    });

    it('should return false when required insurance types are missing', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const mockVettingRecord: VettingRecord = {
        builderId: 'builder123',
        status: 'pending',
        insuranceVerification: [
          {
            documentId: 'doc1',
            policyNumber: 'PL123',
            provider: 'Test Insurance',
            coverageType: 'public_liability',
            coverageAmount: 2000000,
            validFrom: new Date('2024-01-01'),
            validTo: futureDate,
            verified: true,
          },
        ],
        referenceVerification: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = builderVerificationService.hasRequiredInsurance(mockVettingRecord);
      expect(result).toBe(false);
    });

    it('should return false when insurance is expired', () => {
      const pastDate = new Date('2023-12-31'); // Expired

      const mockVettingRecord: VettingRecord = {
        builderId: 'builder123',
        status: 'pending',
        insuranceVerification: [
          {
            documentId: 'doc1',
            policyNumber: 'PL123',
            provider: 'Test Insurance',
            coverageType: 'public_liability',
            coverageAmount: 2000000,
            validFrom: new Date('2023-01-01'),
            validTo: pastDate,
            verified: true,
          },
          {
            documentId: 'doc2',
            policyNumber: 'EL456',
            provider: 'Test Insurance',
            coverageType: 'employers_liability',
            coverageAmount: 10000000,
            validFrom: new Date('2024-01-01'),
            validTo: new Date('2024-12-31'),
            verified: true,
          },
        ],
        referenceVerification: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = builderVerificationService.hasRequiredInsurance(mockVettingRecord);
      expect(result).toBe(false);
    });
  });

  describe('hasSufficientReferences', () => {
    it('should return true when there are at least 2 verified references', () => {
      const mockVettingRecord: VettingRecord = {
        builderId: 'builder123',
        status: 'pending',
        insuranceVerification: [],
        referenceVerification: [
          {
            referenceId: 'ref1',
            contactAttempted: true,
            contactSuccessful: true,
            verificationNotes: 'Positive feedback',
            verifiedAt: new Date(),
          },
          {
            referenceId: 'ref2',
            contactAttempted: true,
            contactSuccessful: true,
            verificationNotes: 'Excellent work quality',
            verifiedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = builderVerificationService.hasSufficientReferences(mockVettingRecord);
      expect(result).toBe(true);
    });

    it('should return false when there are insufficient verified references', () => {
      const mockVettingRecord: VettingRecord = {
        builderId: 'builder123',
        status: 'pending',
        insuranceVerification: [],
        referenceVerification: [
          {
            referenceId: 'ref1',
            contactAttempted: true,
            contactSuccessful: true,
            verificationNotes: 'Positive feedback',
            verifiedAt: new Date(),
          },
          {
            referenceId: 'ref2',
            contactAttempted: true,
            contactSuccessful: false, // Failed contact
            verificationNotes: 'Could not reach customer',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = builderVerificationService.hasSufficientReferences(mockVettingRecord);
      expect(result).toBe(false);
    });
  });

  describe('isReadyForApproval', () => {
    it('should return true when all verification checks pass', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1); // Set to next year

      const mockVettingRecord: VettingRecord = {
        builderId: 'builder123',
        status: 'pending',
        companiesHouseVerification: {
          verified: true,
          verifiedAt: new Date(),
        },
        insuranceVerification: [
          {
            documentId: 'doc1',
            policyNumber: 'PL123',
            provider: 'Test Insurance',
            coverageType: 'public_liability',
            coverageAmount: 2000000,
            validFrom: new Date('2024-01-01'),
            validTo: futureDate,
            verified: true,
          },
          {
            documentId: 'doc2',
            policyNumber: 'EL456',
            provider: 'Test Insurance',
            coverageType: 'employers_liability',
            coverageAmount: 10000000,
            validFrom: new Date('2024-01-01'),
            validTo: futureDate,
            verified: true,
          },
        ],
        referenceVerification: [
          {
            referenceId: 'ref1',
            contactAttempted: true,
            contactSuccessful: true,
            verificationNotes: 'Positive feedback',
            verifiedAt: new Date(),
          },
          {
            referenceId: 'ref2',
            contactAttempted: true,
            contactSuccessful: true,
            verificationNotes: 'Excellent work quality',
            verifiedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = builderVerificationService.isReadyForApproval(mockVettingRecord);
      expect(result).toBe(true);
    });

    it('should return false when any verification check fails', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const mockVettingRecord: VettingRecord = {
        builderId: 'builder123',
        status: 'pending',
        companiesHouseVerification: {
          verified: false, // Failed verification
          notes: 'Company not found',
        },
        insuranceVerification: [
          {
            documentId: 'doc1',
            policyNumber: 'PL123',
            provider: 'Test Insurance',
            coverageType: 'public_liability',
            coverageAmount: 2000000,
            validFrom: new Date('2024-01-01'),
            validTo: futureDate,
            verified: true,
          },
          {
            documentId: 'doc2',
            policyNumber: 'EL456',
            provider: 'Test Insurance',
            coverageType: 'employers_liability',
            coverageAmount: 10000000,
            validFrom: new Date('2024-01-01'),
            validTo: futureDate,
            verified: true,
          },
        ],
        referenceVerification: [
          {
            referenceId: 'ref1',
            contactAttempted: true,
            contactSuccessful: true,
            verificationNotes: 'Positive feedback',
            verifiedAt: new Date(),
          },
          {
            referenceId: 'ref2',
            contactAttempted: true,
            contactSuccessful: true,
            verificationNotes: 'Excellent work quality',
            verifiedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = builderVerificationService.isReadyForApproval(mockVettingRecord);
      expect(result).toBe(false);
    });
  });
});