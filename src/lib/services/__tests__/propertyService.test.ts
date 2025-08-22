import { PropertyService } from '../propertyService';
import { Address } from '../../types';

// Mock the DynamoDB service
jest.mock('../../aws/dynamodb', () => ({
  DynamoDBService: class {
    static async putItem() {
      return { success: true };
    }
    static async getItem() {
      return { success: true, Item: mockProperty };
    }
    static async updateItem() {
      return { success: true, item: mockProperty };
    }
    static async queryItems() {
      return { success: true, Items: [mockProperty] };
    }
  }
}));

const mockProperty = {
  id: 'prop_123',
  address: {
    line1: '123 Test Street',
    city: 'London',
    postcode: 'SW1A 1AA',
    country: 'United Kingdom'
  },
  councilArea: 'Westminster City Council',
  isListedBuilding: false,
  isInConservationArea: false,
  planningHistory: [],
  buildingRegulations: []
};

describe('PropertyService', () => {
  describe('validateAddress', () => {
    it('should validate a correct UK address', () => {
      const address: Address = {
        line1: '123 Test Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'United Kingdom'
      };

      const result = PropertyService.validateAddress(address);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject address with missing required fields', () => {
      const address: Address = {
        line1: '',
        city: '',
        postcode: '',
        country: ''
      };

      const result = PropertyService.validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Address line 1 is required');
      expect(result.errors).toContain('City is required');
      expect(result.errors).toContain('Postcode is required');
      expect(result.errors).toContain('Country is required');
    });

    it('should reject invalid UK postcode format', () => {
      const address: Address = {
        line1: '123 Test Street',
        city: 'London',
        postcode: 'INVALID',
        country: 'United Kingdom'
      };

      const result = PropertyService.validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid UK postcode format');
    });

    it('should accept valid UK postcode formats', () => {
      const validPostcodes = ['SW1A 1AA', 'M1 1AA', 'B33 8TH', 'W1A 0AX', 'EC1A 1BB'];
      
      validPostcodes.forEach(postcode => {
        const address: Address = {
          line1: '123 Test Street',
          city: 'London',
          postcode,
          country: 'United Kingdom'
        };

        const result = PropertyService.validateAddress(address);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('extractCouncilArea', () => {
    it('should extract council area from postcode', () => {
      expect(PropertyService.extractCouncilArea('SW1A 1AA')).toBe('Wandsworth Borough Council');
      expect(PropertyService.extractCouncilArea('M1 1AA')).toBe('Manchester City Council');
      expect(PropertyService.extractCouncilArea('B1 1AA')).toBe('Birmingham City Council');
    });

    it('should return unknown for unrecognized postcodes', () => {
      expect(PropertyService.extractCouncilArea('XX1 1AA')).toBe('Unknown Council Area');
    });
  });

  describe('createProperty', () => {
    it('should create a property successfully', async () => {
      const propertyData = {
        address: {
          line1: '123 Test Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'United Kingdom'
        },
        councilArea: 'Westminster City Council',
        isListedBuilding: false,
        isInConservationArea: false,
        planningHistory: [],
        buildingRegulations: []
      };

      const result = await PropertyService.createProperty(propertyData);
      expect(result.success).toBe(true);
      expect(result.propertyId).toBeDefined();
    });
  });

  describe('getPropertyById', () => {
    it('should retrieve a property by ID', async () => {
      const result = await PropertyService.getPropertyById('prop_123');
      expect(result.success).toBe(true);
      expect(result.property).toBeDefined();
    });
  });

  describe('getPropertiesByPostcode', () => {
    it('should retrieve properties by postcode', async () => {
      const result = await PropertyService.getPropertiesByPostcode('SW1A 1AA');
      expect(result.success).toBe(true);
      expect(result.properties).toBeDefined();
      expect(Array.isArray(result.properties)).toBe(true);
    });
  });
});