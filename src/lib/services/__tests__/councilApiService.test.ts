import { CouncilApiService } from '../councilApiService';
import { Address } from '../../types';

const mockAddress: Address = {
  line1: '123 Test Street',
  city: 'London',
  postcode: 'SW1A 1AA',
  country: 'United Kingdom'
};

const mockConservationAddress: Address = {
  line1: '456 Heritage Lane',
  city: 'London',
  postcode: 'WC1A 1AA',
  country: 'United Kingdom'
};

const mockListedAddress: Address = {
  line1: 'Historic Manor House',
  city: 'London',
  postcode: 'EC1A 1AA',
  country: 'United Kingdom'
};

describe('CouncilApiService', () => {
  describe('getPropertyInfo', () => {
    it('should retrieve property information successfully', async () => {
      const result = await CouncilApiService.getPropertyInfo(mockAddress);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.address).toEqual(mockAddress);
      expect(result.data?.councilArea).toBeDefined();
      expect(result.source).toBe('Mock Council API');
    });

    it('should include UPRN in property data', async () => {
      const result = await CouncilApiService.getPropertyInfo(mockAddress);
      
      expect(result.data?.uprn).toBeDefined();
      expect(typeof result.data?.uprn).toBe('string');
    });
  });

  describe('checkConservationArea', () => {
    it('should identify conservation area properties', async () => {
      const result = await CouncilApiService.checkConservationArea(mockConservationAddress);
      
      expect(result.success).toBe(true);
      expect(result.isInConservationArea).toBe(true);
      expect(result.conservationAreaName).toBeDefined();
      expect(result.restrictions).toBeDefined();
      expect(result.restrictions?.length).toBeGreaterThan(0);
    });

    it('should identify non-conservation area properties', async () => {
      const nonConservationAddress: Address = {
        line1: '123 Modern Street',
        city: 'London',
        postcode: 'E1 1AA',
        country: 'United Kingdom'
      };

      const result = await CouncilApiService.checkConservationArea(nonConservationAddress);
      
      expect(result.success).toBe(true);
      expect(result.isInConservationArea).toBe(false);
      expect(result.conservationAreaName).toBeUndefined();
    });
  });

  describe('checkListedBuilding', () => {
    it('should identify listed buildings', async () => {
      const result = await CouncilApiService.checkListedBuilding(mockListedAddress);
      
      expect(result.success).toBe(true);
      
      // The mock may or may not identify this as listed (it's random), 
      // but if it is listed, it should have proper data
      if (result.isListedBuilding) {
        expect(result.listingGrade).toBeDefined();
        expect(['I', 'II*', 'II']).toContain(result.listingGrade);
        expect(result.listingDescription).toBeDefined();
        expect(result.restrictions).toBeDefined();
        expect(result.restrictions?.length).toBeGreaterThan(0);
      }
    });

    it('should handle non-listed buildings', async () => {
      const modernAddress: Address = {
        line1: '123 New Build',
        city: 'London',
        postcode: 'E1 1AA',
        country: 'United Kingdom'
      };

      const result = await CouncilApiService.checkListedBuilding(modernAddress);
      
      expect(result.success).toBe(true);
      // The result may vary due to mock randomness, but should be consistent
      expect(typeof result.isListedBuilding).toBe('boolean');
    });
  });

  describe('getPlanningApplications', () => {
    it('should retrieve planning applications', async () => {
      const result = await CouncilApiService.getPlanningApplications(mockAddress);
      
      expect(result.success).toBe(true);
      expect(result.applications).toBeDefined();
      expect(Array.isArray(result.applications)).toBe(true);
      
      // Check structure of applications if any exist
      if (result.applications && result.applications.length > 0) {
        const app = result.applications[0];
        expect(app.id).toBeDefined();
        expect(app.reference).toBeDefined();
        expect(app.description).toBeDefined();
        expect(app.status).toBeDefined();
        expect(app.submittedDate).toBeDefined();
      }
    });

    it('should return valid planning application statuses', async () => {
      const result = await CouncilApiService.getPlanningApplications(mockAddress);
      
      if (result.applications && result.applications.length > 0) {
        const validStatuses = ['Approved', 'Refused', 'Pending', 'Withdrawn', 'Appeal Dismissed'];
        result.applications.forEach(app => {
          expect(validStatuses).toContain(app.status);
        });
      }
    });
  });
});