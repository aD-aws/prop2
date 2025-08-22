import { ProjectTypeService } from '../projectTypeService';
import { ProjectType } from '../../types';

describe('ProjectTypeService', () => {
  describe('getAllCategories', () => {
    it('should return all project type categories with their project types', () => {
      const categories = ProjectTypeService.getAllCategories();
      
      expect(categories).toBeDefined();
      expect(categories.length).toBeGreaterThan(0);
      
      // Check that each category has the required properties
      categories.forEach(category => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('icon');
        expect(category).toHaveProperty('projectTypes');
        expect(Array.isArray(category.projectTypes)).toBe(true);
      });
    });

    it('should include structural_extensions category with loft conversions', () => {
      const categories = ProjectTypeService.getAllCategories();
      const structuralCategory = categories.find(c => c.id === 'structural_extensions');
      
      expect(structuralCategory).toBeDefined();
      expect(structuralCategory?.projectTypes.length).toBeGreaterThan(0);
      
      const loftConversion = structuralCategory?.projectTypes.find(pt => pt.id === 'loft_conversion_dormer');
      expect(loftConversion).toBeDefined();
    });
  });

  describe('getAllProjectTypes', () => {
    it('should return all project types', () => {
      const projectTypes = ProjectTypeService.getAllProjectTypes();
      
      expect(projectTypes).toBeDefined();
      expect(projectTypes.length).toBeGreaterThan(0);
      
      // Check that each project type has required properties
      projectTypes.forEach(pt => {
        expect(pt).toHaveProperty('id');
        expect(pt).toHaveProperty('name');
        expect(pt).toHaveProperty('description');
        expect(pt).toHaveProperty('category');
        expect(pt).toHaveProperty('estimatedCostRange');
        expect(pt).toHaveProperty('estimatedDuration');
        expect(pt).toHaveProperty('complexity');
        expect(pt).toHaveProperty('requiresPlanning');
        expect(pt).toHaveProperty('requiresBuildingRegs');
        expect(pt).toHaveProperty('popularityRank');
        expect(pt).toHaveProperty('tags');
        expect(pt).toHaveProperty('relatedTypes');
      });
    });

    it('should include the "others" project type', () => {
      const projectTypes = ProjectTypeService.getAllProjectTypes();
      const othersType = projectTypes.find(pt => pt.id === 'others');
      
      expect(othersType).toBeDefined();
      expect(othersType?.name).toBe('Other Project Type');
    });
  });

  describe('getProjectTypeById', () => {
    it('should return the correct project type by id', () => {
      const projectType = ProjectTypeService.getProjectTypeById('loft_conversion_dormer');
      
      expect(projectType).toBeDefined();
      expect(projectType?.id).toBe('loft_conversion_dormer');
      expect(projectType?.name).toBe('Dormer Loft Conversion');
    });

    it('should return undefined for non-existent project type', () => {
      const projectType = ProjectTypeService.getProjectTypeById('non_existent_type' as ProjectType);
      
      expect(projectType).toBeUndefined();
    });
  });

  describe('searchProjectTypes', () => {
    it('should find project types by name', () => {
      const results = ProjectTypeService.searchProjectTypes('kitchen');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(pt => pt.name.toLowerCase().includes('kitchen'))).toBe(true);
    });

    it('should find project types by description', () => {
      const results = ProjectTypeService.searchProjectTypes('loft');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(pt => 
        pt.description.toLowerCase().includes('loft') || 
        pt.name.toLowerCase().includes('loft')
      )).toBe(true);
    });

    it('should find project types by tags', () => {
      const results = ProjectTypeService.searchProjectTypes('renovation');
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-matching search', () => {
      const results = ProjectTypeService.searchProjectTypes('xyznomatch');
      
      expect(results).toEqual([]);
    });
  });

  describe('getPopularProjectTypes', () => {
    it('should return popular project types sorted by rank', () => {
      const popular = ProjectTypeService.getPopularProjectTypes(5);
      
      expect(popular.length).toBeLessThanOrEqual(5);
      expect(popular.length).toBeGreaterThan(0);
      
      // Should not include "others"
      expect(popular.some(pt => pt.id === 'others')).toBe(false);
      
      // Should be sorted by popularity rank
      for (let i = 1; i < popular.length; i++) {
        expect(popular[i].popularityRank).toBeGreaterThanOrEqual(popular[i - 1].popularityRank);
      }
    });
  });

  describe('getRelatedProjectTypes', () => {
    it('should return related project types', () => {
      const related = ProjectTypeService.getRelatedProjectTypes('loft_conversion_dormer');
      
      expect(Array.isArray(related)).toBe(true);
      // Should return actual project type objects, not just IDs
      related.forEach(pt => {
        expect(pt).toHaveProperty('id');
        expect(pt).toHaveProperty('name');
      });
    });

    it('should return empty array for project type with no relations', () => {
      const related = ProjectTypeService.getRelatedProjectTypes('others');
      
      expect(related).toEqual([]);
    });
  });

  describe('categorizeCustomProject', () => {
    it('should categorize kitchen-related projects', async () => {
      const result = await ProjectTypeService.categorizeCustomProject('I want to renovate my kitchen with new cabinets');
      
      expect(result).toBeDefined();
      expect(result.selectedType).toBe('kitchen_full_refit');
      expect(result.customDescription).toBe('I want to renovate my kitchen with new cabinets');
      expect(result.aiCategorization).toBeDefined();
      expect(result.aiCategorization?.confidence).toBeGreaterThan(0);
    });

    it('should categorize bathroom-related projects', async () => {
      const result = await ProjectTypeService.categorizeCustomProject('Need to update my bathroom with new tiles');
      
      expect(result).toBeDefined();
      expect(result.selectedType).toBe('bathroom_full_refit');
      expect(result.aiCategorization?.confidence).toBeGreaterThan(0);
    });

    it('should handle unrecognized projects', async () => {
      const result = await ProjectTypeService.categorizeCustomProject('Some very unique project description');
      
      expect(result).toBeDefined();
      expect(result.selectedType).toBe('others');
      expect(result.aiCategorization?.confidence).toBeLessThan(0.5);
    });
  });

  describe('getProjectTypesByCategory', () => {
    it('should return project types for a specific category', () => {
      const roomRenovations = ProjectTypeService.getProjectTypesByCategory('room_renovations');
      
      expect(roomRenovations.length).toBeGreaterThan(0);
      roomRenovations.forEach(pt => {
        expect(pt.category).toBe('room_renovations');
      });
    });

    it('should return empty array for non-existent category', () => {
      const result = ProjectTypeService.getProjectTypesByCategory('non_existent_category');
      
      expect(result).toEqual([]);
    });
  });

  describe('filterProjectTypes', () => {
    it('should filter by maximum cost', () => {
      const filtered = ProjectTypeService.filterProjectTypes({ maxCost: 10000 });
      
      filtered.forEach(pt => {
        expect(pt.estimatedCostRange.min).toBeLessThanOrEqual(10000);
      });
    });

    it('should filter by complexity', () => {
      const filtered = ProjectTypeService.filterProjectTypes({ complexity: 'low' });
      
      filtered.forEach(pt => {
        expect(pt.complexity).toBe('low');
      });
    });

    it('should filter by planning requirements', () => {
      const filtered = ProjectTypeService.filterProjectTypes({ requiresPlanning: false });
      
      filtered.forEach(pt => {
        expect(pt.requiresPlanning).toBe(false);
      });
    });

    it('should apply multiple filters', () => {
      const filtered = ProjectTypeService.filterProjectTypes({ 
        maxCost: 15000, 
        complexity: 'low',
        requiresPlanning: false 
      });
      
      filtered.forEach(pt => {
        expect(pt.estimatedCostRange.min).toBeLessThanOrEqual(15000);
        expect(pt.complexity).toBe('low');
        expect(pt.requiresPlanning).toBe(false);
      });
    });
  });
});