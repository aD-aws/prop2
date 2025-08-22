import { MaterialSpecification, ProjectType } from '../types';

export interface MaterialCategory {
  id: string;
  name: string;
  description: string;
  typicalProvider: 'builder' | 'homeowner';
  reasoning: string;
}

export interface MaterialClassificationRule {
  category: string;
  keywords: string[];
  projectTypes: ProjectType[];
  provider: 'builder' | 'homeowner';
  reasoning: string;
  costMultiplier?: number; // For regional/quality adjustments
}

export interface MaterialCostEstimate {
  materialId: string;
  basePrice: number;
  quantity: number;
  unit: string;
  totalCost: number;
  priceRange: {
    budget: number;
    mid: number;
    premium: number;
  };
  supplier: string;
  lastUpdated: Date;
}

export class MaterialClassificationService {
  private classificationRules: MaterialClassificationRule[] = [];
  private materialDatabase: Map<string, MaterialCostEstimate> = new Map();

  constructor() {
    this.initializeClassificationRules();
    this.initializeMaterialDatabase();
  }

  /**
   * Classify materials as builder-provided or homeowner-provided
   */
  async classifyMaterials(
    materials: MaterialSpecification[],
    projectType: ProjectType
  ): Promise<MaterialSpecification[]> {
    const classifiedMaterials: MaterialSpecification[] = [];

    for (const material of materials) {
      const classification = await this.classifyMaterial(material, projectType);
      const costEstimate = await this.estimateMaterialCost(material, projectType);

      classifiedMaterials.push({
        ...material,
        category: classification.provider === 'builder' ? 'builder_provided' : 'homeowner_provided',
        estimatedCost: costEstimate.totalCost,
        specifications: [
          ...material.specifications,
          `Provider: ${classification.provider === 'builder' ? 'Builder' : 'Homeowner'}`,
          `Reasoning: ${classification.reasoning}`,
          `Price range: £${costEstimate.priceRange.budget} - £${costEstimate.priceRange.premium}`
        ]
      });
    }

    return classifiedMaterials;
  }

  /**
   * Classify a single material
   */
  private async classifyMaterial(
    material: MaterialSpecification,
    projectType: ProjectType
  ): Promise<{ provider: 'builder' | 'homeowner'; reasoning: string }> {
    // Check against classification rules
    for (const rule of this.classificationRules) {
      if (this.materialMatchesRule(material, rule, projectType)) {
        return {
          provider: rule.provider,
          reasoning: rule.reasoning
        };
      }
    }

    // Default classification logic
    return this.getDefaultClassification(material, projectType);
  }

  /**
   * Check if material matches a classification rule
   */
  private materialMatchesRule(
    material: MaterialSpecification,
    rule: MaterialClassificationRule,
    projectType: ProjectType
  ): boolean {
    // Check if project type matches
    if (rule.projectTypes.length > 0 && !rule.projectTypes.includes(projectType)) {
      return false;
    }

    // Check if material name/category contains keywords
    const materialText = `${material.name} ${material.category}`.toLowerCase();
    return rule.keywords.some(keyword => materialText.includes(keyword.toLowerCase()));
  }

  /**
   * Get default classification for materials not matching specific rules
   */
  private getDefaultClassification(
    material: MaterialSpecification,
    projectType: ProjectType
  ): { provider: 'builder' | 'homeowner'; reasoning: string } {
    const materialName = material.name.toLowerCase();

    // First fix materials (structural, hidden) - typically builder provided
    const firstFixKeywords = [
      'timber', 'lumber', 'joists', 'studs', 'plasterboard', 'drywall',
      'insulation', 'membrane', 'screws', 'nails', 'brackets',
      'pipes', 'cables', 'wiring', 'ducting', 'flashing',
      'cement', 'concrete', 'mortar', 'sand', 'aggregate',
      'roofing felt', 'breathable membrane', 'vapor barrier'
    ];

    // Second fix materials (visible, aesthetic) - typically homeowner provided
    const secondFixKeywords = [
      'tiles', 'flooring', 'carpet', 'laminate', 'hardwood',
      'paint', 'wallpaper', 'fixtures', 'fittings', 'handles',
      'taps', 'shower', 'bath', 'toilet', 'basin',
      'kitchen units', 'worktop', 'appliances', 'lighting',
      'switches', 'sockets', 'radiators', 'boiler'
    ];

    if (firstFixKeywords.some(keyword => materialName.includes(keyword))) {
      return {
        provider: 'builder',
        reasoning: 'First fix material - structural/hidden work typically provided by builder'
      };
    }

    if (secondFixKeywords.some(keyword => materialName.includes(keyword))) {
      return {
        provider: 'homeowner',
        reasoning: 'Second fix material - visible/aesthetic items typically chosen by homeowner'
      };
    }

    // Default to builder for unclassified materials
    return {
      provider: 'builder',
      reasoning: 'Standard construction material typically provided by builder'
    };
  }

  /**
   * Estimate material cost
   */
  private async estimateMaterialCost(
    material: MaterialSpecification,
    projectType: ProjectType
  ): Promise<MaterialCostEstimate> {
    // Check if we have cost data for this material
    const existingEstimate = this.materialDatabase.get(material.name.toLowerCase());
    
    if (existingEstimate) {
      return {
        ...existingEstimate,
        quantity: material.quantity,
        totalCost: existingEstimate.basePrice * material.quantity
      };
    }

    // Generate estimate based on material type and project
    return this.generateCostEstimate(material, projectType);
  }

  /**
   * Generate cost estimate for unknown materials
   */
  private generateCostEstimate(
    material: MaterialSpecification,
    projectType: ProjectType
  ): MaterialCostEstimate {
    // Base cost estimation logic
    let basePrice = 10; // Default £10 per unit
    const materialName = material.name.toLowerCase();

    // Adjust base price based on material type
    if (materialName.includes('tile')) {
      basePrice = 25; // £25 per m²
    } else if (materialName.includes('paint')) {
      basePrice = 35; // £35 per litre
    } else if (materialName.includes('flooring') || materialName.includes('carpet')) {
      basePrice = 40; // £40 per m²
    } else if (materialName.includes('timber') || materialName.includes('wood')) {
      basePrice = 15; // £15 per linear meter
    } else if (materialName.includes('plasterboard')) {
      basePrice = 8; // £8 per sheet
    } else if (materialName.includes('insulation')) {
      basePrice = 12; // £12 per m²
    }

    // Regional adjustments (simplified)
    const regionalMultiplier = 1.0; // Would be based on postcode

    const adjustedPrice = basePrice * regionalMultiplier;

    return {
      materialId: material.id,
      basePrice: adjustedPrice,
      quantity: material.quantity,
      unit: material.unit,
      totalCost: adjustedPrice * material.quantity,
      priceRange: {
        budget: adjustedPrice * 0.7,
        mid: adjustedPrice,
        premium: adjustedPrice * 1.5
      },
      supplier: 'Estimated',
      lastUpdated: new Date()
    };
  }

  /**
   * Initialize classification rules
   */
  private initializeClassificationRules(): void {
    this.classificationRules = [
      // Kitchen-specific rules
      {
        category: 'kitchen_units',
        keywords: ['kitchen units', 'cabinets', 'cupboards', 'worktop', 'countertop'],
        projectTypes: ['kitchen_full_refit', 'kitchen_partial_upgrade', 'kitchen_island_installation'],
        provider: 'homeowner',
        reasoning: 'Kitchen units and worktops are aesthetic choices typically selected by homeowner'
      },
      {
        category: 'kitchen_appliances',
        keywords: ['oven', 'hob', 'dishwasher', 'fridge', 'freezer', 'microwave'],
        projectTypes: ['kitchen_full_refit', 'kitchen_partial_upgrade'],
        provider: 'homeowner',
        reasoning: 'Kitchen appliances are personal preference items chosen by homeowner'
      },

      // Bathroom-specific rules
      {
        category: 'bathroom_suite',
        keywords: ['bath', 'shower', 'toilet', 'basin', 'wc', 'bidet'],
        projectTypes: ['bathroom_full_refit', 'bathroom_ensuite', 'bathroom_wet_room'],
        provider: 'homeowner',
        reasoning: 'Bathroom suite items are aesthetic choices typically selected by homeowner'
      },
      {
        category: 'bathroom_tiles',
        keywords: ['wall tiles', 'floor tiles', 'mosaic', 'ceramic tiles', 'porcelain tiles'],
        projectTypes: ['bathroom_full_refit', 'bathroom_ensuite', 'bathroom_wet_room'],
        provider: 'homeowner',
        reasoning: 'Tiles are aesthetic finishes typically chosen by homeowner'
      },

      // Structural materials - builder provided
      {
        category: 'structural_timber',
        keywords: ['joists', 'studs', 'rafters', 'beams', 'posts', 'structural timber'],
        projectTypes: [],
        provider: 'builder',
        reasoning: 'Structural timber is first fix material provided by builder'
      },
      {
        category: 'building_materials',
        keywords: ['cement', 'concrete', 'mortar', 'sand', 'aggregate', 'blocks', 'bricks'],
        projectTypes: [],
        provider: 'builder',
        reasoning: 'Basic building materials are typically provided by builder'
      },
      {
        category: 'insulation_materials',
        keywords: ['insulation', 'rockwool', 'glasswool', 'foam board', 'membrane'],
        projectTypes: [],
        provider: 'builder',
        reasoning: 'Insulation materials are first fix items provided by builder'
      },

      // Electrical materials
      {
        category: 'electrical_first_fix',
        keywords: ['cables', 'wiring', 'conduit', 'back boxes', 'consumer unit'],
        projectTypes: [],
        provider: 'builder',
        reasoning: 'First fix electrical materials are provided by builder'
      },
      {
        category: 'electrical_second_fix',
        keywords: ['light fittings', 'switches', 'sockets', 'dimmer switches', 'ceiling fans'],
        projectTypes: [],
        provider: 'homeowner',
        reasoning: 'Visible electrical fittings are aesthetic choices made by homeowner'
      },

      // Plumbing materials
      {
        category: 'plumbing_first_fix',
        keywords: ['copper pipes', 'plastic pipes', 'fittings', 'valves', 'waste pipes'],
        projectTypes: [],
        provider: 'builder',
        reasoning: 'First fix plumbing materials are provided by builder'
      },

      // Flooring
      {
        category: 'flooring_materials',
        keywords: ['laminate', 'hardwood', 'engineered wood', 'vinyl', 'carpet', 'underlay'],
        projectTypes: [],
        provider: 'homeowner',
        reasoning: 'Flooring is an aesthetic choice typically made by homeowner'
      },

      // Decorative materials
      {
        category: 'decorative_materials',
        keywords: ['paint', 'wallpaper', 'coving', 'skirting', 'architrave', 'door handles'],
        projectTypes: [],
        provider: 'homeowner',
        reasoning: 'Decorative materials are aesthetic choices made by homeowner'
      }
    ];
  }

  /**
   * Initialize material cost database
   */
  private initializeMaterialDatabase(): void {
    // Sample material costs (would be populated from real data sources)
    const sampleMaterials = [
      {
        name: 'ceramic wall tiles',
        basePrice: 25,
        unit: 'm²',
        priceRange: { budget: 15, mid: 25, premium: 45 }
      },
      {
        name: 'laminate flooring',
        basePrice: 18,
        unit: 'm²',
        priceRange: { budget: 12, mid: 18, premium: 35 }
      },
      {
        name: 'emulsion paint',
        basePrice: 35,
        unit: 'litre',
        priceRange: { budget: 25, mid: 35, premium: 55 }
      },
      {
        name: 'plasterboard',
        basePrice: 8,
        unit: 'sheet',
        priceRange: { budget: 6, mid: 8, premium: 12 }
      },
      {
        name: 'rockwool insulation',
        basePrice: 12,
        unit: 'm²',
        priceRange: { budget: 8, mid: 12, premium: 18 }
      }
    ];

    sampleMaterials.forEach(material => {
      this.materialDatabase.set(material.name, {
        materialId: material.name.replace(/\s+/g, '_'),
        basePrice: material.basePrice,
        quantity: 1,
        unit: material.unit,
        totalCost: material.basePrice,
        priceRange: material.priceRange,
        supplier: 'Trade Supplier',
        lastUpdated: new Date()
      });
    });
  }

  /**
   * Update material cost in database
   */
  updateMaterialCost(materialName: string, costEstimate: MaterialCostEstimate): void {
    this.materialDatabase.set(materialName.toLowerCase(), costEstimate);
  }

  /**
   * Get material cost estimate
   */
  getMaterialCost(materialName: string): MaterialCostEstimate | null {
    return this.materialDatabase.get(materialName.toLowerCase()) || null;
  }

  /**
   * Add new classification rule
   */
  addClassificationRule(rule: MaterialClassificationRule): void {
    this.classificationRules.push(rule);
  }

  /**
   * Get materials by provider type
   */
  getMaterialsByProvider(
    materials: MaterialSpecification[],
    provider: 'builder' | 'homeowner'
  ): MaterialSpecification[] {
    return materials.filter(material => material.category === `${provider}_provided`);
  }

  /**
   * Calculate total cost by provider
   */
  calculateCostByProvider(materials: MaterialSpecification[]): {
    builderCost: number;
    homeownerCost: number;
    totalCost: number;
  } {
    const builderMaterials = materials.filter(m => m.category === 'builder_provided');
    const homeownerMaterials = materials.filter(m => m.category === 'homeowner_provided');

    const builderCost = builderMaterials.reduce((sum, m) => sum + (m.estimatedCost || 0), 0);
    const homeownerCost = homeownerMaterials.reduce((sum, m) => sum + (m.estimatedCost || 0), 0);

    return {
      builderCost,
      homeownerCost,
      totalCost: builderCost + homeownerCost
    };
  }
}

export const materialClassificationService = new MaterialClassificationService();