import { ComplianceService } from '../complianceService';
import { Property, ProjectType } from '../../types';

const mockProperty: Property = {
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

const mockListedProperty: Property = {
  ...mockProperty,
  isListedBuilding: true
};

const mockConservationProperty: Property = {
  ...mockProperty,
  isInConservationArea: true
};

describe('ComplianceService', () => {
  describe('validateCompliance', () => {
    it('should validate compliance for loft conversion', async () => {
      const result = await ComplianceService.validateCompliance(
        'loft_conversion',
        mockProperty
      );

      expect(result.projectType).toBe('loft_conversion');
      expect(result.property).toBe(mockProperty);
      expect(result.applicableRegulations).toBeDefined();
      expect(result.mandatoryRequirements).toBeDefined();
      expect(result.buildingControlRequired).toBe(true);
      expect(result.structuralEngineerRequired).toBe(true);
    });

    it('should require planning permission for listed buildings', async () => {
      const result = await ComplianceService.validateCompliance(
        'rear_extension',
        mockListedProperty
      );

      expect(result.planningPermissionRequired).toBe(true);
      expect(result.specialConsiderations).toContain(
        'Listed building consent required from local planning authority'
      );
    });

    it('should require planning permission for conservation areas', async () => {
      const result = await ComplianceService.validateCompliance(
        'rear_extension',
        mockConservationProperty
      );

      expect(result.planningPermissionRequired).toBe(true);
      expect(result.specialConsiderations).toContain(
        'Conservation area consent may be required'
      );
    });

    it('should identify structural requirements for extensions', async () => {
      const result = await ComplianceService.validateCompliance(
        'rear_extension',
        mockProperty
      );

      expect(result.structuralEngineerRequired).toBe(true);
      expect(result.partyWallAgreementRequired).toBe(true);
      expect(result.buildingControlRequired).toBe(true);
    });

    it('should identify electrical requirements for electrical work', async () => {
      const result = await ComplianceService.validateCompliance(
        'electrical',
        mockProperty
      );

      expect(result.buildingControlRequired).toBe(true);
      
      const electricalRegulation = result.applicableRegulations.find(
        reg => reg.id === 'part_p_electrical'
      );
      expect(electricalRegulation).toBeDefined();
      expect(electricalRegulation?.mandatory).toBe(true);
    });

    it('should not require structural engineer for simple renovations', async () => {
      const result = await ComplianceService.validateCompliance(
        'kitchen_renovation',
        mockProperty
      );

      expect(result.structuralEngineerRequired).toBe(false);
      expect(result.partyWallAgreementRequired).toBe(false);
    });
  });

  describe('getRegulationById', () => {
    it('should retrieve regulation by ID', () => {
      const regulation = ComplianceService.getRegulationById('part_a_structure');
      expect(regulation).toBeDefined();
      expect(regulation?.regulation).toBe('Part A - Structure');
    });

    it('should return undefined for non-existent regulation', () => {
      const regulation = ComplianceService.getRegulationById('non_existent');
      expect(regulation).toBeUndefined();
    });
  });

  describe('getRegulationsByCategory', () => {
    it('should retrieve regulations by category', () => {
      const structuralRegs = ComplianceService.getRegulationsByCategory('structural');
      expect(structuralRegs.length).toBeGreaterThan(0);
      expect(structuralRegs.every(reg => reg.category === 'structural')).toBe(true);
    });

    it('should retrieve fire safety regulations', () => {
      const fireRegs = ComplianceService.getRegulationsByCategory('fire_safety');
      expect(fireRegs.length).toBeGreaterThan(0);
      expect(fireRegs.every(reg => reg.category === 'fire_safety')).toBe(true);
    });
  });
});