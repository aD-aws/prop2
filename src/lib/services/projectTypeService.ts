import { ProjectType, ProjectTypeCategory, ProjectTypeInfo, ProjectTypeSelection } from '../types';

/**
 * Comprehensive project type database with all categories from requirements
 */
export class ProjectTypeService {
  private static projectTypeDatabase: ProjectTypeInfo[] = [
    // Structural Extensions & Conversions - Loft Conversions
    {
      id: 'loft_conversion_dormer',
      name: 'Dormer Loft Conversion',
      description: 'Add dormer windows to create additional headroom and natural light in your loft space',
      category: 'structural_extensions',
      estimatedCostRange: { min: 15000, max: 35000 },
      estimatedDuration: { min: 4, max: 8 },
      complexity: 'medium',
      requiresPlanning: true,
      requiresBuildingRegs: true,
      popularityRank: 1,
      tags: ['loft', 'conversion', 'dormer', 'bedroom', 'space'],
      relatedTypes: ['loft_conversion_hip_to_gable', 'loft_conversion_velux']
    },
    {
      id: 'loft_conversion_hip_to_gable',
      name: 'Hip to Gable Loft Conversion',
      description: 'Convert hip roof to gable end to maximize loft space and headroom',
      category: 'structural_extensions',
      estimatedCostRange: { min: 20000, max: 45000 },
      estimatedDuration: { min: 6, max: 10 },
      complexity: 'high',
      requiresPlanning: true,
      requiresBuildingRegs: true,
      popularityRank: 2,
      tags: ['loft', 'conversion', 'hip-to-gable', 'structural', 'space'],
      relatedTypes: ['loft_conversion_dormer', 'loft_conversion_mansard']
    },
    {
      id: 'loft_conversion_mansard',
      name: 'Mansard Loft Conversion',
      description: 'Create maximum loft space with mansard roof extension',
      category: 'structural_extensions',
      estimatedCostRange: { min: 25000, max: 55000 },
      estimatedDuration: { min: 8, max: 12 },
      complexity: 'high',
      requiresPlanning: true,
      requiresBuildingRegs: true,
      popularityRank: 3,
      tags: ['loft', 'conversion', 'mansard', 'maximum-space', 'complex'],
      relatedTypes: ['loft_conversion_hip_to_gable', 'loft_conversion_dormer']
    },
    {
      id: 'loft_conversion_velux',
      name: 'Velux Loft Conversion',
      description: 'Simple loft conversion using roof windows for natural light',
      category: 'structural_extensions',
      estimatedCostRange: { min: 10000, max: 25000 },
      estimatedDuration: { min: 3, max: 6 },
      complexity: 'low',
      requiresPlanning: false,
      requiresBuildingRegs: true,
      popularityRank: 4,
      tags: ['loft', 'conversion', 'velux', 'simple', 'cost-effective'],
      relatedTypes: ['loft_conversion_roof_light', 'loft_conversion_dormer']
    },

    // Extensions
    {
      id: 'rear_extension_single_storey',
      name: 'Single Storey Rear Extension',
      description: 'Extend your home at ground level to create additional living space',
      category: 'structural_extensions',
      estimatedCostRange: { min: 15000, max: 40000 },
      estimatedDuration: { min: 6, max: 12 },
      complexity: 'medium',
      requiresPlanning: false,
      requiresBuildingRegs: true,
      popularityRank: 5,
      tags: ['extension', 'rear', 'single-storey', 'kitchen', 'living'],
      relatedTypes: ['rear_extension_double_storey', 'rear_extension_wrap_around']
    },
    {
      id: 'rear_extension_double_storey',
      name: 'Double Storey Rear Extension',
      description: 'Two-storey rear extension for maximum additional space',
      category: 'structural_extensions',
      estimatedCostRange: { min: 25000, max: 65000 },
      estimatedDuration: { min: 8, max: 16 },
      complexity: 'high',
      requiresPlanning: true,
      requiresBuildingRegs: true,
      popularityRank: 8,
      tags: ['extension', 'rear', 'double-storey', 'bedroom', 'living'],
      relatedTypes: ['rear_extension_single_storey', 'side_extension_double_storey']
    },

    // Room Renovations
    {
      id: 'kitchen_full_refit',
      name: 'Full Kitchen Refit',
      description: 'Complete kitchen renovation with new units, appliances, and finishes',
      category: 'room_renovations',
      estimatedCostRange: { min: 8000, max: 30000 },
      estimatedDuration: { min: 2, max: 6 },
      complexity: 'medium',
      requiresPlanning: false,
      requiresBuildingRegs: false,
      popularityRank: 6,
      tags: ['kitchen', 'renovation', 'full-refit', 'appliances', 'units'],
      relatedTypes: ['kitchen_partial_upgrade', 'kitchen_island_installation']
    },
    {
      id: 'bathroom_full_refit',
      name: 'Full Bathroom Refit',
      description: 'Complete bathroom renovation with new suite, tiling, and fixtures',
      category: 'room_renovations',
      estimatedCostRange: { min: 5000, max: 20000 },
      estimatedDuration: { min: 1, max: 4 },
      complexity: 'medium',
      requiresPlanning: false,
      requiresBuildingRegs: false,
      popularityRank: 7,
      tags: ['bathroom', 'renovation', 'full-refit', 'suite', 'tiling'],
      relatedTypes: ['bathroom_ensuite', 'bathroom_wet_room']
    },
    {
      id: 'bathroom_ensuite',
      name: 'En-suite Bathroom',
      description: 'Create a private en-suite bathroom in your bedroom',
      category: 'room_renovations',
      estimatedCostRange: { min: 4000, max: 15000 },
      estimatedDuration: { min: 1, max: 3 },
      complexity: 'medium',
      requiresPlanning: false,
      requiresBuildingRegs: false,
      popularityRank: 12,
      tags: ['bathroom', 'ensuite', 'bedroom', 'private', 'compact'],
      relatedTypes: ['bathroom_full_refit', 'bathroom_wet_room']
    },

    // External & Structural Work
    {
      id: 'windows_upvc',
      name: 'UPVC Windows',
      description: 'Replace windows with energy-efficient UPVC double or triple glazing',
      category: 'external_structural',
      estimatedCostRange: { min: 3000, max: 12000 },
      estimatedDuration: { min: 1, max: 3 },
      complexity: 'low',
      requiresPlanning: false,
      requiresBuildingRegs: false,
      popularityRank: 9,
      tags: ['windows', 'upvc', 'double-glazing', 'energy-efficient', 'replacement'],
      relatedTypes: ['windows_timber', 'doors_bifold']
    },
    {
      id: 'roofing_re_roofing',
      name: 'Complete Re-roofing',
      description: 'Full roof replacement with new tiles, felt, and battens',
      category: 'external_structural',
      estimatedCostRange: { min: 8000, max: 25000 },
      estimatedDuration: { min: 1, max: 4 },
      complexity: 'high',
      requiresPlanning: false,
      requiresBuildingRegs: true,
      popularityRank: 15,
      tags: ['roofing', 're-roofing', 'tiles', 'weatherproof', 'structural'],
      relatedTypes: ['roofing_repairs', 'roofing_flat_replacement']
    },

    // Systems & Infrastructure
    {
      id: 'heating_boiler_replacement',
      name: 'Boiler Replacement',
      description: 'Replace old boiler with new energy-efficient condensing boiler',
      category: 'systems_infrastructure',
      estimatedCostRange: { min: 2000, max: 6000 },
      estimatedDuration: { min: 1, max: 2 },
      complexity: 'medium',
      requiresPlanning: false,
      requiresBuildingRegs: true,
      popularityRank: 10,
      tags: ['heating', 'boiler', 'replacement', 'energy-efficient', 'gas'],
      relatedTypes: ['heating_radiator_upgrade', 'heating_heat_pump']
    },
    {
      id: 'electrical_rewiring',
      name: 'Full House Rewiring',
      description: 'Complete electrical rewiring with new consumer unit and circuits',
      category: 'systems_infrastructure',
      estimatedCostRange: { min: 3000, max: 8000 },
      estimatedDuration: { min: 1, max: 3 },
      complexity: 'high',
      requiresPlanning: false,
      requiresBuildingRegs: true,
      popularityRank: 14,
      tags: ['electrical', 'rewiring', 'consumer-unit', 'safety', 'circuits'],
      relatedTypes: ['electrical_consumer_unit', 'electrical_smart_home']
    },

    // Flooring & Interior Finishes
    {
      id: 'flooring_hardwood_solid',
      name: 'Solid Hardwood Flooring',
      description: 'Install premium solid hardwood flooring throughout your home',
      category: 'flooring_finishes',
      estimatedCostRange: { min: 2000, max: 8000 },
      estimatedDuration: { min: 1, max: 2 },
      complexity: 'medium',
      requiresPlanning: false,
      requiresBuildingRegs: false,
      popularityRank: 18,
      tags: ['flooring', 'hardwood', 'solid', 'premium', 'natural'],
      relatedTypes: ['flooring_hardwood_engineered', 'flooring_laminate']
    },

    // Specialist Projects
    {
      id: 'home_cinema',
      name: 'Home Cinema Room',
      description: 'Create a dedicated home cinema with soundproofing and AV equipment',
      category: 'specialist_projects',
      estimatedCostRange: { min: 10000, max: 50000 },
      estimatedDuration: { min: 3, max: 8 },
      complexity: 'high',
      requiresPlanning: false,
      requiresBuildingRegs: false,
      popularityRank: 25,
      tags: ['cinema', 'entertainment', 'soundproofing', 'av-equipment', 'luxury'],
      relatedTypes: ['media_room', 'soundproofing']
    },

    // Maintenance & Repairs
    {
      id: 'damp_proofing',
      name: 'Damp Proofing Treatment',
      description: 'Treat and prevent damp issues with professional damp proofing',
      category: 'maintenance_repairs',
      estimatedCostRange: { min: 1500, max: 8000 },
      estimatedDuration: { min: 1, max: 3 },
      complexity: 'medium',
      requiresPlanning: false,
      requiresBuildingRegs: false,
      popularityRank: 20,
      tags: ['damp', 'proofing', 'moisture', 'treatment', 'prevention'],
      relatedTypes: ['waterproofing', 'structural_repairs_subsidence']
    },

    // Others category for AI categorization
    {
      id: 'others',
      name: 'Other Project Type',
      description: 'Describe your unique project and our AI will help categorize and plan it',
      category: 'others',
      estimatedCostRange: { min: 1000, max: 100000 },
      estimatedDuration: { min: 1, max: 52 },
      complexity: 'medium',
      requiresPlanning: false,
      requiresBuildingRegs: false,
      popularityRank: 999,
      tags: ['custom', 'ai-categorization', 'unique', 'other'],
      relatedTypes: []
    }
  ];

  private static categories: ProjectTypeCategory[] = [
    {
      id: 'structural_extensions',
      name: 'Structural Extensions & Conversions',
      description: 'Major structural work including loft conversions, extensions, and conversions',
      icon: '🏗️',
      projectTypes: []
    },
    {
      id: 'room_renovations',
      name: 'Room-Specific Renovations',
      description: 'Complete room makeovers including kitchens, bathrooms, and living spaces',
      icon: '🏠',
      projectTypes: []
    },
    {
      id: 'external_structural',
      name: 'External & Structural Work',
      description: 'Roofing, windows, doors, driveways, and external improvements',
      icon: '🔨',
      projectTypes: []
    },
    {
      id: 'systems_infrastructure',
      name: 'Systems & Infrastructure',
      description: 'Heating, electrical, plumbing, and home infrastructure upgrades',
      icon: '⚡',
      projectTypes: []
    },
    {
      id: 'flooring_finishes',
      name: 'Flooring & Interior Finishes',
      description: 'Flooring, tiling, and interior finishing work',
      icon: '🎨',
      projectTypes: []
    },
    {
      id: 'fitted_furniture',
      name: 'Kitchens & Fitted Furniture',
      description: 'Bespoke kitchens, wardrobes, and built-in storage solutions',
      icon: '🪑',
      projectTypes: []
    },
    {
      id: 'wet_areas',
      name: 'Bathrooms & Wet Areas',
      description: 'Luxury bathrooms, wet rooms, and spa installations',
      icon: '🛁',
      projectTypes: []
    },
    {
      id: 'specialist_projects',
      name: 'Specialist Projects',
      description: 'Swimming pools, home cinemas, wine cellars, and unique installations',
      icon: '🏊',
      projectTypes: []
    },
    {
      id: 'commercial_mixed',
      name: 'Commercial & Mixed-Use',
      description: 'Commercial to residential conversions and mixed-use developments',
      icon: '🏢',
      projectTypes: []
    },
    {
      id: 'maintenance_repairs',
      name: 'Maintenance & Repairs',
      description: 'Property maintenance, repairs, and restoration work',
      icon: '🔧',
      projectTypes: []
    },
    {
      id: 'others',
      name: 'Other Projects',
      description: 'Unique projects not covered by standard categories',
      icon: '❓',
      projectTypes: []
    }
  ];

  /**
   * Get all project type categories with their associated project types
   */
  static getAllCategories(): ProjectTypeCategory[] {
    // Populate categories with their project types
    const categoriesWithTypes = this.categories.map(category => ({
      ...category,
      projectTypes: this.projectTypeDatabase.filter(pt => pt.category === category.id)
    }));

    // Sort categories by number of project types (most popular first)
    return categoriesWithTypes.sort((a, b) => b.projectTypes.length - a.projectTypes.length);
  }

  /**
   * Get all project types
   */
  static getAllProjectTypes(): ProjectTypeInfo[] {
    return [...this.projectTypeDatabase];
  }

  /**
   * Get project type by ID
   */
  static getProjectTypeById(id: ProjectType): ProjectTypeInfo | undefined {
    return this.projectTypeDatabase.find(pt => pt.id === id);
  }

  /**
   * Search project types by name or tags
   */
  static searchProjectTypes(query: string): ProjectTypeInfo[] {
    const lowercaseQuery = query.toLowerCase();
    return this.projectTypeDatabase.filter(pt => 
      pt.name.toLowerCase().includes(lowercaseQuery) ||
      pt.description.toLowerCase().includes(lowercaseQuery) ||
      pt.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Get popular project types (sorted by popularity rank)
   */
  static getPopularProjectTypes(limit: number = 10): ProjectTypeInfo[] {
    return this.projectTypeDatabase
      .filter(pt => pt.id !== 'others')
      .sort((a, b) => a.popularityRank - b.popularityRank)
      .slice(0, limit);
  }

  /**
   * Get related project types for a given project type
   */
  static getRelatedProjectTypes(projectTypeId: ProjectType): ProjectTypeInfo[] {
    const projectType = this.getProjectTypeById(projectTypeId);
    if (!projectType) return [];

    return projectType.relatedTypes
      .map(id => this.getProjectTypeById(id))
      .filter(Boolean) as ProjectTypeInfo[];
  }

  /**
   * AI categorization for "Others" project type
   * This would integrate with Claude Sonnet 4 in production
   */
  static async categorizeCustomProject(description: string): Promise<ProjectTypeSelection> {
    // Mock AI categorization - in production this would call Claude Sonnet 4
    const mockAIResponse = this.mockAICategorization(description);
    
    return {
      selectedType: mockAIResponse.suggestedType,
      customDescription: description,
      aiCategorization: mockAIResponse
    };
  }

  /**
   * Mock AI categorization logic (replace with actual AI service)
   */
  private static mockAICategorization(description: string): {
    suggestedType: ProjectType;
    confidence: number;
    reasoning: string;
  } {
    const lowercaseDesc = description.toLowerCase();
    
    // Simple keyword matching for demo purposes
    if (lowercaseDesc.includes('kitchen')) {
      return {
        suggestedType: 'kitchen_full_refit',
        confidence: 0.85,
        reasoning: 'Description mentions kitchen-related work'
      };
    }
    
    if (lowercaseDesc.includes('bathroom')) {
      return {
        suggestedType: 'bathroom_full_refit',
        confidence: 0.80,
        reasoning: 'Description mentions bathroom-related work'
      };
    }
    
    if (lowercaseDesc.includes('loft') || lowercaseDesc.includes('attic')) {
      return {
        suggestedType: 'loft_conversion_velux',
        confidence: 0.75,
        reasoning: 'Description mentions loft or attic space'
      };
    }
    
    if (lowercaseDesc.includes('extension')) {
      return {
        suggestedType: 'rear_extension_single_storey',
        confidence: 0.70,
        reasoning: 'Description mentions extension work'
      };
    }
    
    // Default fallback
    return {
      suggestedType: 'others',
      confidence: 0.30,
      reasoning: 'Unable to categorize with high confidence, requires manual review'
    };
  }

  /**
   * Get project types by category
   */
  static getProjectTypesByCategory(categoryId: string): ProjectTypeInfo[] {
    return this.projectTypeDatabase.filter(pt => pt.category === categoryId);
  }

  /**
   * Filter project types by criteria
   */
  static filterProjectTypes(criteria: {
    maxCost?: number;
    maxDuration?: number;
    complexity?: 'low' | 'medium' | 'high';
    requiresPlanning?: boolean;
  }): ProjectTypeInfo[] {
    return this.projectTypeDatabase.filter(pt => {
      if (criteria.maxCost && pt.estimatedCostRange.min > criteria.maxCost) return false;
      if (criteria.maxDuration && pt.estimatedDuration.min > criteria.maxDuration) return false;
      if (criteria.complexity && pt.complexity !== criteria.complexity) return false;
      if (criteria.requiresPlanning !== undefined && pt.requiresPlanning !== criteria.requiresPlanning) return false;
      return true;
    });
  }
}

// Export instance for use in other services
export const projectTypeService = ProjectTypeService;