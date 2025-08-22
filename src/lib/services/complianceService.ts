// Compliance Service for UK Building Regulations validation

import { ProjectType, Property, RegulationRequirement } from '../types';

export interface ComplianceCheck {
  id: string;
  regulation: string;
  description: string;
  mandatory: boolean;
  category: 'structural' | 'fire_safety' | 'accessibility' | 'energy' | 'ventilation' | 'drainage' | 'electrical' | 'planning';
  applicableProjectTypes: ProjectType[];
  requirements: string[];
  exemptions?: string[];
}

export interface ComplianceResult {
  projectType: ProjectType;
  property: Property;
  applicableRegulations: ComplianceCheck[];
  mandatoryRequirements: RegulationRequirement[];
  recommendedRequirements: RegulationRequirement[];
  planningPermissionRequired: boolean;
  buildingControlRequired: boolean;
  partyWallAgreementRequired: boolean;
  structuralEngineerRequired: boolean;
  specialConsiderations: string[];
}

export class ComplianceService {
  
  /**
   * Validate project compliance with UK building regulations
   */
  static async validateCompliance(
    projectType: ProjectType,
    property: Property
  ): Promise<ComplianceResult> {
    
    const applicableRegulations = this.getApplicableRegulations(projectType);
    const mandatoryRequirements = this.getMandatoryRequirements(applicableRegulations);
    const recommendedRequirements = this.getRecommendedRequirements(applicableRegulations);
    
    const planningPermissionRequired = this.checkPlanningPermissionRequired(projectType, property);
    const buildingControlRequired = this.checkBuildingControlRequired(projectType);
    const partyWallAgreementRequired = this.checkPartyWallAgreementRequired(projectType);
    const structuralEngineerRequired = this.checkStructuralEngineerRequired(projectType);
    
    const specialConsiderations = this.getSpecialConsiderations(property, projectType);

    return {
      projectType,
      property,
      applicableRegulations,
      mandatoryRequirements,
      recommendedRequirements,
      planningPermissionRequired,
      buildingControlRequired,
      partyWallAgreementRequired,
      structuralEngineerRequired,
      specialConsiderations,
    };
  }

  /**
   * Get applicable building regulations for project type
   */
  private static getApplicableRegulations(projectType: ProjectType): ComplianceCheck[] {
    const allRegulations = this.getAllBuildingRegulations();
    
    return allRegulations.filter(regulation => {
      // Check for exact match first
      if (regulation.applicableProjectTypes.includes(projectType)) {
        return true;
      }
      
      // Check for pattern matches (e.g., any loft conversion type)
      return regulation.applicableProjectTypes.some(applicableType => {
        if (applicableType === 'others') return true;
        
        // Pattern matching for project type families
        const typeFamily = applicableType.split('_').slice(0, 2).join('_');
        const projectFamily = projectType.split('_').slice(0, 2).join('_');
        
        return typeFamily === projectFamily;
      });
    });
  }

  /**
   * Get all UK building regulations
   */
  private static getAllBuildingRegulations(): ComplianceCheck[] {
    return [
      // Part A - Structure
      {
        id: 'part_a_structure',
        regulation: 'Part A - Structure',
        description: 'Structural safety and stability requirements',
        mandatory: true,
        category: 'structural',
        applicableProjectTypes: ['loft_conversion_dormer', 'rear_extension_single_storey', 'side_extension_single_storey', 'basement_conversion_full'],
        requirements: [
          'Structural calculations required for load-bearing alterations',
          'Foundation design must comply with soil conditions',
          'Beam and column sizing must be certified by structural engineer',
          'Existing structure assessment required',
        ],
      },
      
      // Part B - Fire Safety
      {
        id: 'part_b_fire_safety',
        regulation: 'Part B - Fire Safety',
        description: 'Fire safety and means of escape requirements',
        mandatory: true,
        category: 'fire_safety',
        applicableProjectTypes: ['loft_conversion_dormer', 'rear_extension_single_storey', 'side_extension_single_storey', 'basement_conversion_full', 'garage_conversion_living_space'],
        requirements: [
          'Adequate means of escape from all habitable rooms',
          'Fire-resistant construction between floors',
          'Smoke detection system installation',
          'Fire doors where required',
          'Emergency lighting in escape routes',
        ],
      },

      // Part C - Site Preparation and Resistance to Contaminants and Moisture
      {
        id: 'part_c_moisture',
        regulation: 'Part C - Site Preparation and Resistance to Moisture',
        description: 'Damp proofing and site preparation requirements',
        mandatory: true,
        category: 'structural',
        applicableProjectTypes: ['basement_conversion_full', 'rear_extension_single_storey', 'side_extension_single_storey'],
        requirements: [
          'Damp proof course installation',
          'Waterproofing for below-ground structures',
          'Ventilation to prevent condensation',
          'Site drainage and land contamination assessment',
        ],
      },

      // Part E - Resistance to Sound
      {
        id: 'part_e_sound',
        regulation: 'Part E - Resistance to Sound',
        description: 'Sound insulation requirements',
        mandatory: true,
        category: 'structural',
        applicableProjectTypes: ['loft_conversion_dormer', 'garage_conversion_living_space', 'basement_conversion_full'],
        requirements: [
          'Sound insulation between dwellings',
          'Impact sound insulation for floors',
          'Airborne sound insulation for walls',
          'Acoustic testing may be required',
        ],
      },

      // Part F - Ventilation
      {
        id: 'part_f_ventilation',
        regulation: 'Part F - Ventilation',
        description: 'Ventilation requirements for health and comfort',
        mandatory: true,
        category: 'ventilation',
        applicableProjectTypes: ['kitchen_full_refit', 'bathroom_full_refit', 'loft_conversion_dormer', 'basement_conversion_full'],
        requirements: [
          'Adequate ventilation for habitable rooms',
          'Extract ventilation for kitchens and bathrooms',
          'Background ventilation provision',
          'Mechanical ventilation where required',
        ],
      },

      // Part G - Sanitation, Hot Water Safety and Water Efficiency
      {
        id: 'part_g_sanitation',
        regulation: 'Part G - Sanitation and Water Efficiency',
        description: 'Sanitation and water efficiency requirements',
        mandatory: true,
        category: 'drainage',
        applicableProjectTypes: ['bathroom_full_refit', 'kitchen_full_refit', 'plumbing_bathroom'],
        requirements: [
          'Adequate sanitary facilities',
          'Hot water safety (temperature limitation)',
          'Water efficiency measures',
          'Drainage and waste disposal',
        ],
      },

      // Part H - Drainage and Waste Disposal
      {
        id: 'part_h_drainage',
        regulation: 'Part H - Drainage and Waste Disposal',
        description: 'Drainage and sewerage requirements',
        mandatory: true,
        category: 'drainage',
        applicableProjectTypes: ['bathroom_full_refit', 'kitchen_full_refit', 'rear_extension_single_storey', 'side_extension_single_storey'],
        requirements: [
          'Adequate drainage for foul and surface water',
          'Connection to public sewer where available',
          'Soakaway design for surface water',
          'Inspection chambers and access points',
        ],
      },

      // Part J - Combustion Appliances and Fuel Storage Systems
      {
        id: 'part_j_combustion',
        regulation: 'Part J - Combustion Appliances and Fuel Storage',
        description: 'Requirements for heating appliances and flues',
        mandatory: true,
        category: 'fire_safety',
        applicableProjectTypes: ['heating_boiler_replacement', 'kitchen_full_refit'],
        requirements: [
          'Adequate air supply for combustion appliances',
          'Flue design and installation',
          'Carbon monoxide detection',
          'Fuel storage safety requirements',
        ],
      },

      // Part K - Protection from Falling, Collision and Impact
      {
        id: 'part_k_protection',
        regulation: 'Part K - Protection from Falling, Collision and Impact',
        description: 'Safety requirements for stairs, ramps, and guarding',
        mandatory: true,
        category: 'accessibility',
        applicableProjectTypes: ['loft_conversion_dormer', 'rear_extension_single_storey', 'side_extension_single_storey'],
        requirements: [
          'Staircase design and dimensions',
          'Handrail and balustrade requirements',
          'Headroom clearances',
          'Protection from collision with glazing',
        ],
      },

      // Part L - Conservation of Fuel and Power
      {
        id: 'part_l_energy',
        regulation: 'Part L - Conservation of Fuel and Power',
        description: 'Energy efficiency and insulation requirements',
        mandatory: true,
        category: 'energy',
        applicableProjectTypes: ['rear_extension_single_storey', 'side_extension_single_storey', 'loft_conversion_dormer', 'windows_upvc', 'roofing_re_roofing'],
        requirements: [
          'Thermal insulation standards',
          'Air permeability testing',
          'Energy efficient glazing',
          'Heating system efficiency',
          'SAP calculations may be required',
        ],
      },

      // Part M - Access to and Use of Buildings
      {
        id: 'part_m_access',
        regulation: 'Part M - Access to and Use of Buildings',
        description: 'Accessibility requirements',
        mandatory: true,
        category: 'accessibility',
        applicableProjectTypes: ['rear_extension_single_storey', 'side_extension_single_storey', 'bathroom_full_refit'],
        requirements: [
          'Accessible entrance provision',
          'Door width and threshold requirements',
          'Accessible WC provision where applicable',
          'Level access or ramp provision',
        ],
      },

      // Part P - Electrical Safety
      {
        id: 'part_p_electrical',
        regulation: 'Part P - Electrical Safety',
        description: 'Electrical installation safety requirements',
        mandatory: true,
        category: 'electrical',
        applicableProjectTypes: ['electrical_rewiring', 'kitchen_full_refit', 'bathroom_full_refit', 'loft_conversion_dormer'],
        requirements: [
          'Electrical work by competent person',
          'Electrical installation certificate required',
          'RCD protection for new circuits',
          'Safe zones for cable routing',
          'IP rating compliance for bathroom zones',
        ],
      },

      // Planning Permission Requirements
      {
        id: 'planning_permission',
        regulation: 'Planning Permission',
        description: 'Planning permission requirements',
        mandatory: false,
        category: 'planning',
        applicableProjectTypes: ['rear_extension_single_storey', 'side_extension_single_storey', 'loft_conversion_dormer'],
        requirements: [
          'Check permitted development rights',
          'Neighbour consultation may be required',
          'Design and access statement',
          'Heritage impact assessment (if applicable)',
        ],
      },
    ];
  }

  /**
   * Get mandatory requirements based on applicable regulations
   */
  private static getMandatoryRequirements(
    regulations: ComplianceCheck[]
  ): RegulationRequirement[] {
    return regulations
      .filter(reg => reg.mandatory)
      .map(reg => ({
        id: reg.id,
        type: reg.regulation,
        description: reg.description,
        mandatory: true,
      }));
  }

  /**
   * Get recommended requirements
   */
  private static getRecommendedRequirements(
    regulations: ComplianceCheck[]
  ): RegulationRequirement[] {
    return regulations
      .filter(reg => !reg.mandatory)
      .map(reg => ({
        id: reg.id,
        type: reg.regulation,
        description: reg.description,
        mandatory: false,
      }));
  }

  /**
   * Check if planning permission is required
   */
  private static checkPlanningPermissionRequired(
    projectType: ProjectType,
    property: Property
  ): boolean {
    // Listed buildings always require planning permission
    if (property.isListedBuilding) {
      return true;
    }

    // Conservation areas have stricter requirements
    if (property.isInConservationArea) {
      const conservationProjectTypes: ProjectType[] = [
        'rear_extension_single_storey', 'side_extension_single_storey', 'loft_conversion_dormer', 'windows_upvc', 'roofing_re_roofing'
      ];
      // Check if project type matches any conservation area project types (including variants)
      const matchesConservationType = conservationProjectTypes.some(conservationType => {
        const conservationFamily = conservationType.split('_').slice(0, 2).join('_');
        const projectFamily = projectType.split('_').slice(0, 2).join('_');
        return conservationFamily === projectFamily || conservationType === projectType;
      });
      
      if (matchesConservationType) {
        return true;
      }
    }

    // Project-specific planning requirements
    const planningRequiredProjects: ProjectType[] = [
      'rear_extension_single_storey', 'side_extension_single_storey', 'basement_conversion_full'
    ];

    // Check if project type matches any planning required project types (including variants)
    return planningRequiredProjects.some(planningType => {
      const planningFamily = planningType.split('_').slice(0, 2).join('_');
      const projectFamily = projectType.split('_').slice(0, 2).join('_');
      return planningFamily === projectFamily || planningType === projectType;
    });
  }

  /**
   * Check if building control approval is required
   */
  private static checkBuildingControlRequired(
    projectType: ProjectType
  ): boolean {
    const buildingControlProjects: ProjectType[] = [
      'loft_conversion_dormer', 'rear_extension_single_storey', 'side_extension_single_storey', 'basement_conversion_full',
      'garage_conversion_living_space', 'electrical_rewiring', 'plumbing_bathroom', 'heating_boiler_replacement'
    ];

    // Check if project type matches any building control required project types (including variants)
    return buildingControlProjects.some(controlType => {
      const controlFamily = controlType.split('_').slice(0, 2).join('_');
      const projectFamily = projectType.split('_').slice(0, 2).join('_');
      return controlFamily === projectFamily || controlType === projectType;
    });
  }

  /**
   * Check if party wall agreement is required
   */
  private static checkPartyWallAgreementRequired(
    projectType: ProjectType
  ): boolean {
    const partyWallProjects: ProjectType[] = [
      'rear_extension_single_storey', 'side_extension_single_storey', 'basement_conversion_full', 'loft_conversion_dormer'
    ];

    // Check if project type matches any party wall required project types (including variants)
    return partyWallProjects.some(partyWallType => {
      const partyWallFamily = partyWallType.split('_').slice(0, 2).join('_');
      const projectFamily = projectType.split('_').slice(0, 2).join('_');
      return partyWallFamily === projectFamily || partyWallType === projectType;
    });
  }

  /**
   * Check if structural engineer is required
   */
  private static checkStructuralEngineerRequired(
    projectType: ProjectType
  ): boolean {
    const structuralProjects: ProjectType[] = [
      'loft_conversion_dormer', 'rear_extension_single_storey', 'side_extension_single_storey', 'basement_conversion_full'
    ];

    // Check if project type matches any structural project types (including variants)
    return structuralProjects.some(structuralType => {
      const structuralFamily = structuralType.split('_').slice(0, 2).join('_');
      const projectFamily = projectType.split('_').slice(0, 2).join('_');
      return structuralFamily === projectFamily || structuralType === projectType;
    });
  }

  /**
   * Get special considerations based on property characteristics
   */
  private static getSpecialConsiderations(property: Property, projectType: ProjectType): string[] {
    const considerations: string[] = [];

    if (property.isListedBuilding) {
      considerations.push('Listed building consent required from local planning authority');
      considerations.push('Materials and methods must preserve historic character');
      considerations.push('Specialist heritage contractor recommended');
      considerations.push('Archaeological investigation may be required');
    }

    if (property.isInConservationArea) {
      considerations.push('Conservation area consent may be required');
      considerations.push('External alterations must preserve area character');
      considerations.push('Tree work requires conservation area consent');
    }

    // Project-specific considerations
    if (projectType.startsWith('basement_conversion')) {
      considerations.push('Structural survey of existing foundations required');
      considerations.push('Waterproofing and tanking essential');
      considerations.push('Underpinning may be required');
      considerations.push('Party wall agreements likely needed');
    }

    if (projectType.startsWith('loft_conversion')) {
      considerations.push('Roof structure assessment required');
      considerations.push('Fire escape route must be provided');
      considerations.push('Insulation to current standards required');
    }

    return considerations;
  }

  /**
   * Get regulation details by ID
   */
  static getRegulationById(regulationId: string): ComplianceCheck | undefined {
    const allRegulations = this.getAllBuildingRegulations();
    return allRegulations.find(reg => reg.id === regulationId);
  }

  /**
   * Get regulations by category
   */
  static getRegulationsByCategory(category: ComplianceCheck['category']): ComplianceCheck[] {
    const allRegulations = this.getAllBuildingRegulations();
    return allRegulations.filter(reg => reg.category === category);
  }
}