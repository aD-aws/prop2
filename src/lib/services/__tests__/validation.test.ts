// Simple validation tests for property assessment services

import { PropertyService } from '../propertyService';
import { ComplianceService } from '../complianceService';
import { CouncilApiService } from '../councilApiService';
import { Address, Property, ProjectType } from '../../types';

describe('Property Assessment Services Validation', () => {
  describe('PropertyService', () => {
    it('should validate UK postcodes correctly', () => {
      const validAddress: Address = {
        line1: '123 Test Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'United Kingdom'
      };

      const result = PropertyService.validateAddress(validAddress);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should extract council area from postcode', () => {
      const councilArea = PropertyService.extractCouncilArea('SW1A 1AA');
      expect(councilArea).toBe('Wandsworth Borough Council');
    });
  });

  describe('ComplianceService', () => {
    it('should have building regulations defined', () => {
      const structuralRegs = ComplianceService.getRegulationsByCategory('structural');
      expect(structuralRegs.length).toBeGreaterThan(0);
      
      const fireRegs = ComplianceService.getRegulationsByCategory('fire_safety');
      expect(fireRegs.length).toBeGreaterThan(0);
      
      const electricalRegs = ComplianceService.getRegulationsByCategory('electrical');
      expect(electricalRegs.length).toBeGreaterThan(0);
    });

    it('should retrieve specific regulations by ID', () => {
      const partA = ComplianceService.getRegulationById('part_a_structure');
      expect(partA).toBeDefined();
      expect(partA?.regulation).toBe('Part A - Structure');
      expect(partA?.mandatory).toBe(true);

      const partP = ComplianceService.getRegulationById('part_p_electrical');
      expect(partP).toBeDefined();
      expect(partP?.regulation).toBe('Part P - Electrical Safety');
      expect(partP?.category).toBe('electrical');
    });
  });

  describe('CouncilApiService', () => {
    it('should have mock data generation methods', async () => {
      const mockAddress: Address = {
        line1: '123 Test Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'United Kingdom'
      };

      // Test that the service methods exist and return expected structure
      const propertyInfo = await CouncilApiService.getPropertyInfo(mockAddress);
      expect(propertyInfo.success).toBe(true);
      expect(propertyInfo.data).toBeDefined();
      expect(propertyInfo.source).toBe('Mock Council API');

      const conservationCheck = await CouncilApiService.checkConservationArea(mockAddress);
      expect(conservationCheck.success).toBe(true);
      expect(typeof conservationCheck.isInConservationArea).toBe('boolean');

      const listedCheck = await CouncilApiService.checkListedBuilding(mockAddress);
      expect(listedCheck.success).toBe(true);
      expect(typeof listedCheck.isListedBuilding).toBe('boolean');

      const planningApps = await CouncilApiService.getPlanningApplications(mockAddress);
      expect(planningApps.success).toBe(true);
      expect(Array.isArray(planningApps.applications)).toBe(true);
    });
  });
});