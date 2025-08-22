import { AIAgent, ProjectType } from '../types';
import { aiAgentService } from './aiAgentService';

export interface AgentSelectionResult {
  orchestrator?: AIAgent;
  specialists: AIAgent[];
}

export class AgentSelector {
  private agentMappings: Map<ProjectType, string[]> = new Map();
  private orchestratorMappings: Map<ProjectType, string> = new Map();

  constructor() {
    this.initializeAgentMappings();
  }

  /**
   * Initialize agent mappings for different project types
   */
  private initializeAgentMappings(): void {
    // Loft Conversion Projects - Orchestrator + Specialists
    const loftConversionAgents = [
      'structural_agent',
      'insulation_agent', 
      'electrical_agent',
      'plumbing_agent',
      'windows_doors_agent',
      'flooring_agent',
      'heating_hvac_agent',
      'planning_permission_agent'
    ];
    
    this.agentMappings.set('loft_conversion_dormer', loftConversionAgents);
    this.agentMappings.set('loft_conversion_hip_to_gable', loftConversionAgents);
    this.agentMappings.set('loft_conversion_mansard', loftConversionAgents);
    this.agentMappings.set('loft_conversion_velux', loftConversionAgents);
    this.agentMappings.set('loft_conversion_roof_light', loftConversionAgents);
    
    this.orchestratorMappings.set('loft_conversion_dormer', 'loft_conversion_orchestrator');
    this.orchestratorMappings.set('loft_conversion_hip_to_gable', 'loft_conversion_orchestrator');
    this.orchestratorMappings.set('loft_conversion_mansard', 'loft_conversion_orchestrator');
    this.orchestratorMappings.set('loft_conversion_velux', 'loft_conversion_orchestrator');
    this.orchestratorMappings.set('loft_conversion_roof_light', 'loft_conversion_orchestrator');

    // Extension Projects - Orchestrator + Specialists
    const extensionAgents = [
      'structural_agent',
      'foundations_agent',
      'electrical_agent',
      'plumbing_agent',
      'windows_doors_agent',
      'roofing_agent',
      'insulation_agent',
      'heating_hvac_agent',
      'planning_permission_agent',
      'building_regulations_agent'
    ];

    this.agentMappings.set('rear_extension_single_storey', extensionAgents);
    this.agentMappings.set('rear_extension_double_storey', extensionAgents);
    this.agentMappings.set('rear_extension_wrap_around', extensionAgents);
    this.agentMappings.set('rear_extension_glass_box', extensionAgents);
    this.agentMappings.set('side_extension_single_storey', extensionAgents);
    this.agentMappings.set('side_extension_double_storey', extensionAgents);
    this.agentMappings.set('side_extension_infill', extensionAgents);

    this.orchestratorMappings.set('rear_extension_single_storey', 'extension_orchestrator');
    this.orchestratorMappings.set('rear_extension_double_storey', 'extension_orchestrator');
    this.orchestratorMappings.set('rear_extension_wrap_around', 'extension_orchestrator');
    this.orchestratorMappings.set('rear_extension_glass_box', 'extension_orchestrator');
    this.orchestratorMappings.set('side_extension_single_storey', 'extension_orchestrator');
    this.orchestratorMappings.set('side_extension_double_storey', 'extension_orchestrator');
    this.orchestratorMappings.set('side_extension_infill', 'extension_orchestrator');

    // Basement Conversion Projects
    const basementAgents = [
      'structural_agent',
      'excavation_agent',
      'waterproofing_agent',
      'electrical_agent',
      'plumbing_agent',
      'insulation_agent',
      'ventilation_agent',
      'drainage_agent',
      'building_regulations_agent'
    ];

    this.agentMappings.set('basement_conversion_full', basementAgents);
    this.agentMappings.set('basement_conversion_partial', basementAgents);
    this.orchestratorMappings.set('basement_conversion_full', 'basement_conversion_orchestrator');
    this.orchestratorMappings.set('basement_conversion_partial', 'basement_conversion_orchestrator');

    // Garage Conversion Projects
    const garageConversionAgents = [
      'structural_agent',
      'insulation_agent',
      'electrical_agent',
      'plumbing_agent',
      'windows_doors_agent',
      'flooring_agent',
      'heating_hvac_agent'
    ];

    this.agentMappings.set('garage_conversion_living_space', garageConversionAgents);
    this.agentMappings.set('garage_conversion_office', garageConversionAgents);
    this.agentMappings.set('garage_conversion_gym', garageConversionAgents);
    this.agentMappings.set('garage_conversion_studio', garageConversionAgents);
    
    this.orchestratorMappings.set('garage_conversion_living_space', 'garage_conversion_orchestrator');
    this.orchestratorMappings.set('garage_conversion_office', 'garage_conversion_orchestrator');
    this.orchestratorMappings.set('garage_conversion_gym', 'garage_conversion_orchestrator');
    this.orchestratorMappings.set('garage_conversion_studio', 'garage_conversion_orchestrator');

    // Kitchen Projects - Room-specific orchestrator
    const kitchenAgents = [
      'electrical_agent',
      'plumbing_agent',
      'tiling_agent',
      'flooring_agent',
      'fitted_furniture_agent',
      'appliances_agent',
      'ventilation_agent'
    ];

    this.agentMappings.set('kitchen_full_refit', kitchenAgents);
    this.agentMappings.set('kitchen_partial_upgrade', kitchenAgents);
    this.agentMappings.set('kitchen_island_installation', kitchenAgents);
    this.agentMappings.set('kitchen_galley', kitchenAgents);
    this.agentMappings.set('kitchen_l_shaped', kitchenAgents);
    this.agentMappings.set('kitchen_u_shaped', kitchenAgents);
    this.agentMappings.set('kitchen_bespoke_design', kitchenAgents);

    this.orchestratorMappings.set('kitchen_full_refit', 'kitchen_orchestrator');
    this.orchestratorMappings.set('kitchen_partial_upgrade', 'kitchen_orchestrator');
    this.orchestratorMappings.set('kitchen_island_installation', 'kitchen_orchestrator');
    this.orchestratorMappings.set('kitchen_galley', 'kitchen_orchestrator');
    this.orchestratorMappings.set('kitchen_l_shaped', 'kitchen_orchestrator');
    this.orchestratorMappings.set('kitchen_u_shaped', 'kitchen_orchestrator');
    this.orchestratorMappings.set('kitchen_bespoke_design', 'kitchen_orchestrator');

    // Bathroom Projects - Room-specific orchestrator
    const bathroomAgents = [
      'plumbing_agent',
      'electrical_agent',
      'tiling_agent',
      'waterproofing_agent',
      'ventilation_agent',
      'heating_hvac_agent',
      'fitted_furniture_agent'
    ];

    this.agentMappings.set('bathroom_full_refit', bathroomAgents);
    this.agentMappings.set('bathroom_shower_room', bathroomAgents);
    this.agentMappings.set('bathroom_ensuite', bathroomAgents);
    this.agentMappings.set('bathroom_downstairs_wc', bathroomAgents);
    this.agentMappings.set('bathroom_wet_room', bathroomAgents);
    this.agentMappings.set('bathroom_family', bathroomAgents);
    this.agentMappings.set('bathroom_luxury_suite', bathroomAgents);

    this.orchestratorMappings.set('bathroom_full_refit', 'bathroom_orchestrator');
    this.orchestratorMappings.set('bathroom_shower_room', 'bathroom_orchestrator');
    this.orchestratorMappings.set('bathroom_ensuite', 'bathroom_orchestrator');
    this.orchestratorMappings.set('bathroom_downstairs_wc', 'bathroom_orchestrator');
    this.orchestratorMappings.set('bathroom_wet_room', 'bathroom_orchestrator');
    this.orchestratorMappings.set('bathroom_family', 'bathroom_orchestrator');
    this.orchestratorMappings.set('bathroom_luxury_suite', 'bathroom_orchestrator');

    // Bedroom Projects
    const bedroomAgents = [
      'electrical_agent',
      'flooring_agent',
      'fitted_furniture_agent',
      'decorating_agent',
      'heating_hvac_agent',
      'windows_doors_agent'
    ];

    this.agentMappings.set('bedroom_master', bedroomAgents);
    this.agentMappings.set('bedroom_children', bedroomAgents);
    this.agentMappings.set('bedroom_guest', bedroomAgents);
    this.agentMappings.set('bedroom_nursery', bedroomAgents);

    this.orchestratorMappings.set('bedroom_master', 'bedroom_orchestrator');
    this.orchestratorMappings.set('bedroom_children', 'bedroom_orchestrator');
    this.orchestratorMappings.set('bedroom_guest', 'bedroom_orchestrator');
    this.orchestratorMappings.set('bedroom_nursery', 'bedroom_orchestrator');

    // Single Trade Projects - Direct specialist agents (no orchestrator)
    this.agentMappings.set('windows_upvc', ['windows_doors_agent']);
    this.agentMappings.set('windows_timber', ['windows_doors_agent']);
    this.agentMappings.set('windows_aluminium', ['windows_doors_agent']);
    this.agentMappings.set('windows_sash', ['windows_doors_agent']);
    this.agentMappings.set('doors_bifold', ['windows_doors_agent']);
    this.agentMappings.set('doors_sliding', ['windows_doors_agent']);
    this.agentMappings.set('doors_french', ['windows_doors_agent']);

    this.agentMappings.set('electrical_rewiring', ['electrical_agent']);
    this.agentMappings.set('electrical_consumer_unit', ['electrical_agent']);
    this.agentMappings.set('electrical_ev_charging', ['electrical_agent']);
    this.agentMappings.set('electrical_smart_home', ['electrical_agent']);

    this.agentMappings.set('plumbing_bathroom', ['plumbing_agent']);
    this.agentMappings.set('plumbing_kitchen', ['plumbing_agent']);
    this.agentMappings.set('plumbing_water_pressure', ['plumbing_agent']);
    this.agentMappings.set('plumbing_mains_upgrade', ['plumbing_agent']);

    this.agentMappings.set('heating_boiler_replacement', ['heating_hvac_agent']);
    this.agentMappings.set('heating_radiator_upgrade', ['heating_hvac_agent']);
    this.agentMappings.set('heating_underfloor', ['heating_hvac_agent']);
    this.agentMappings.set('heating_heat_pump', ['heating_hvac_agent']);

    // Roofing Projects
    const roofingAgents = ['roofing_agent', 'structural_agent', 'insulation_agent'];
    this.agentMappings.set('roofing_re_roofing', roofingAgents);
    this.agentMappings.set('roofing_repairs', ['roofing_agent']);
    this.agentMappings.set('roofing_flat_replacement', roofingAgents);
    this.agentMappings.set('roofing_green', roofingAgents);

    // External Work Projects
    this.agentMappings.set('driveway_block_paving', ['landscaping_agent', 'drainage_agent']);
    this.agentMappings.set('driveway_resin', ['landscaping_agent', 'drainage_agent']);
    this.agentMappings.set('driveway_tarmac', ['landscaping_agent', 'drainage_agent']);
    this.agentMappings.set('patio_block_paving', ['landscaping_agent']);
    this.agentMappings.set('patio_natural_stone', ['landscaping_agent']);
    this.agentMappings.set('garden_landscaping', ['landscaping_agent']);

    this.agentMappings.set('rendering_k_rend', ['rendering_cladding_agent']);
    this.agentMappings.set('rendering_pebbledash', ['rendering_cladding_agent']);
    this.agentMappings.set('cladding_timber', ['rendering_cladding_agent']);
    this.agentMappings.set('cladding_brick_slip', ['rendering_cladding_agent']);

    // Flooring Projects
    this.agentMappings.set('flooring_hardwood_solid', ['flooring_agent']);
    this.agentMappings.set('flooring_hardwood_engineered', ['flooring_agent']);
    this.agentMappings.set('flooring_laminate', ['flooring_agent']);
    this.agentMappings.set('flooring_lvt', ['flooring_agent']);
    this.agentMappings.set('tiling_ceramic', ['tiling_agent']);
    this.agentMappings.set('tiling_porcelain', ['tiling_agent']);
    this.agentMappings.set('tiling_natural_stone', ['tiling_agent']);

    // Others - Will be analyzed by AI to determine agents
    this.agentMappings.set('others', ['project_analysis_agent']);
  }

  /**
   * Get required agents for a specific project type
   */
  async getRequiredAgents(projectType: ProjectType): Promise<AgentSelectionResult> {
    const agentIds = this.agentMappings.get(projectType) || [];
    const orchestratorId = this.orchestratorMappings.get(projectType);

    // Fetch agents from the service
    const specialists: AIAgent[] = [];
    for (const agentId of agentIds) {
      const agent = await aiAgentService.getAgent(agentId);
      if (agent) {
        specialists.push(agent);
      }
    }

    let orchestrator: AIAgent | undefined;
    if (orchestratorId) {
      orchestrator = await aiAgentService.getAgent(orchestratorId) || undefined;
    }

    return {
      orchestrator,
      specialists
    };
  }

  /**
   * Analyze "Others" project type and determine required agents
   */
  async analyzeOthersProject(projectDescription: string): Promise<AgentSelectionResult> {
    // Use AI to analyze the project description and determine required agents
    const analysisAgent = await aiAgentService.getAgent('project_analysis_agent');
    if (!analysisAgent) {
      throw new Error('Project analysis agent not found');
    }

    const analysisResponse = await aiAgentService.invokeAgent({
      agentId: analysisAgent.id,
      context: {
        projectId: 'temp_analysis',
        projectType: 'others',
        property: {} as any,
        userResponses: { projectDescription },
        previousAgentResponses: []
      }
    });

    // Parse the analysis response to determine required agents
    const requiredAgentIds = analysisResponse.data.requiredAgents as string[] || [];
    const orchestratorId = analysisResponse.data.orchestrator as string;

    const specialists: AIAgent[] = [];
    for (const agentId of requiredAgentIds) {
      const agent = await aiAgentService.getAgent(agentId);
      if (agent) {
        specialists.push(agent);
      }
    }

    let orchestrator: AIAgent | undefined;
    if (orchestratorId) {
      orchestrator = await aiAgentService.getAgent(orchestratorId) || undefined;
    }

    return {
      orchestrator,
      specialists
    };
  }

  /**
   * Get all available agent types
   */
  getAvailableAgentTypes(): string[] {
    const allAgentIds = new Set<string>();
    
    // Collect all agent IDs from mappings
    this.agentMappings.forEach(agentIds => {
      agentIds.forEach(id => allAgentIds.add(id));
    });

    // Add orchestrator IDs
    this.orchestratorMappings.forEach(orchestratorId => {
      allAgentIds.add(orchestratorId);
    });

    return Array.from(allAgentIds);
  }

  /**
   * Check if a project type requires an orchestrator
   */
  requiresOrchestrator(projectType: ProjectType): boolean {
    return this.orchestratorMappings.has(projectType);
  }

  /**
   * Get project types that use a specific agent
   */
  getProjectTypesForAgent(agentId: string): ProjectType[] {
    const projectTypes: ProjectType[] = [];

    this.agentMappings.forEach((agentIds, projectType) => {
      if (agentIds.includes(agentId)) {
        projectTypes.push(projectType);
      }
    });

    // Check orchestrator mappings
    this.orchestratorMappings.forEach((orchestratorId, projectType) => {
      if (orchestratorId === agentId) {
        projectTypes.push(projectType);
      }
    });

    return projectTypes;
  }

  /**
   * Update agent mapping for a project type
   */
  updateAgentMapping(projectType: ProjectType, agentIds: string[], orchestratorId?: string): void {
    this.agentMappings.set(projectType, agentIds);
    
    if (orchestratorId) {
      this.orchestratorMappings.set(projectType, orchestratorId);
    } else {
      this.orchestratorMappings.delete(projectType);
    }
  }

  /**
   * Get complexity score for a project type based on number of agents required
   */
  getProjectComplexity(projectType: ProjectType): 'low' | 'medium' | 'high' {
    const agentIds = this.agentMappings.get(projectType) || [];
    const hasOrchestrator = this.orchestratorMappings.has(projectType);

    if (agentIds.length <= 2 && !hasOrchestrator) {
      return 'low';
    } else if (agentIds.length <= 5 || hasOrchestrator) {
      return 'medium';
    } else {
      return 'high';
    }
  }
}

export const agentSelector = new AgentSelector();