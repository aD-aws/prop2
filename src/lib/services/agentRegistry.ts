import { AIAgent, KnowledgeBase, ProjectType } from '../types';
import { aiAgentService } from './aiAgentService';
import { promptManager } from './promptManager';

export class AgentRegistry {
  private initialized = false;

  /**
   * Initialize all AI agents in the system
   */
  async initializeAgents(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('Initializing AI agents...');

    try {
      // Register orchestrator agents
      await this.registerOrchestratorAgents();

      // Register specialist agents
      await this.registerSpecialistAgents();

      // Register analysis agents
      await this.registerAnalysisAgents();

      // Create default prompts
      await this.createDefaultPrompts();

      this.initialized = true;
      console.log('AI agents initialized successfully');
    } catch (error) {
      console.error('Error initializing AI agents:', error);
      throw error;
    }
  }

  /**
   * Register orchestrator agents for complex projects
   */
  private async registerOrchestratorAgents(): Promise<void> {
    const orchestrators = [
      {
        id: 'loft_conversion_orchestrator',
        name: 'Loft Conversion AI Agent',
        specialization: 'Loft conversion orchestration that coordinates multiple specialists',
        projectTypes: [
          'loft_conversion_dormer',
          'loft_conversion_hip_to_gable',
          'loft_conversion_mansard',
          'loft_conversion_velux',
          'loft_conversion_roof_light'
        ] as ProjectType[],
        promptTemplate: 'You are a loft conversion specialist AI agent. Analyze the project requirements and coordinate with structural, electrical, plumbing, heating, and insulation specialists to create a comprehensive loft conversion plan.',
        dependencies: ['structural_agent', 'electrical_agent', 'plumbing_agent', 'heating_hvac_agent', 'insulation_agent'],
        isOrchestrator: true,
        knowledgeBase: {
          id: 'loft_kb',
          domain: 'Loft Conversion Orchestration',
          facts: [
            'Loft conversions typically require structural calculations for floor strengthening',
            'Building regulations approval is usually required for habitable loft spaces',
            'Head height must be minimum 2.2m for habitable space, 2.0m for storage',
            'Fire escape routes must be considered - often requires protected stairway',
            'Dormer windows require planning permission in most cases',
            'Hip-to-gable conversions maximize internal space but need structural support',
            'Mansard conversions provide maximum space but are complex structurally',
            'Velux windows are often permitted development but check local restrictions',
            'Roof light conversions are simplest but provide limited additional space',
            'Insulation is critical - minimum 270mm in roof space',
            'Electrical circuits need upgrading for additional rooms',
            'Plumbing extensions may be needed for en-suite facilities',
            'Heating systems require extending to new spaces',
            'Staircase design affects ground floor layout significantly',
            'Party wall agreements may be needed for shared roof structures'
          ],
          regulations: [
            'Building Regulations Part A (Structure) - floor and roof strengthening',
            'Building Regulations Part B (Fire Safety) - escape routes and fire doors',
            'Building Regulations Part L (Conservation of fuel and power) - insulation',
            'Building Regulations Part F (Ventilation) - adequate air changes',
            'Building Regulations Part K (Protection from falling) - staircase design',
            'Planning permission requirements for external alterations',
            'Party Wall Act 1996 for shared structures',
            'CDM Regulations for construction safety'
          ],
          bestPractices: [
            'Always engage structural engineer for floor and roof calculations',
            'Coordinate electrical, plumbing, and heating early in design',
            'Ensure adequate insulation exceeds minimum standards',
            'Plan electrical and plumbing routes before structural work',
            'Consider natural light and ventilation requirements',
            'Design staircase to minimize impact on ground floor',
            'Plan for future maintenance access to services',
            'Coordinate with roofing specialist for weatherproofing',
            'Ensure fire safety compliance throughout',
            'Consider acoustic insulation between floors'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'extension_orchestrator',
        name: 'Extension AI Agent',
        specialization: 'Extension orchestration for rear, side, and wrap-around extensions',
        projectTypes: [
          'rear_extension_single_storey',
          'rear_extension_double_storey',
          'rear_extension_wrap_around',
          'rear_extension_glass_box',
          'side_extension_single_storey',
          'side_extension_double_storey',
          'side_extension_infill'
        ] as ProjectType[],
        promptTemplate: 'You are an extension specialist AI agent. Analyze the project requirements and coordinate with structural, electrical, plumbing, heating, and roofing specialists to create a comprehensive extension plan.',
        dependencies: ['structural_agent', 'electrical_agent', 'plumbing_agent', 'heating_hvac_agent', 'roofing_agent'],
        isOrchestrator: true,
        knowledgeBase: {
          id: 'extension_kb',
          domain: 'Home Extension Orchestration',
          facts: [
            'Extensions require planning permission unless under permitted development',
            'Foundation depth depends on soil conditions and structural loads',
            'Party wall agreements may be required for boundary extensions',
            'Building control approval is mandatory for all extensions',
            'Single-storey rear extensions can be up to 6m (detached) or 4m (other houses)',
            'Double-storey extensions require careful structural integration',
            'Wrap-around extensions combine rear and side extension benefits',
            'Glass box extensions maximize natural light but need thermal control',
            'Side extensions often require party wall agreements',
            'Infill extensions utilize existing recesses or courtyards',
            'Structural integration with existing building is critical',
            'Services (electrical, plumbing, heating) need extending and upgrading',
            'Roof design must integrate with existing structure',
            'Thermal bridging must be avoided at junction points',
            'Drainage and surface water management is essential'
          ],
          regulations: [
            'Planning Permission requirements and permitted development rights',
            'Building Regulations full approval (all parts applicable)',
            'Party Wall Act 1996 for boundary work',
            'CDM Regulations for construction safety',
            'Building Regulations Part A (Structure) - foundations and integration',
            'Building Regulations Part C (Site preparation and moisture)',
            'Building Regulations Part L (Energy efficiency)',
            'Building Regulations Part F (Ventilation)'
          ],
          bestPractices: [
            'Conduct comprehensive soil survey before foundation design',
            'Ensure proper damp proofing and waterproofing',
            'Plan services integration carefully with existing systems',
            'Consider future maintenance access for all services',
            'Design structural connections to minimize thermal bridging',
            'Coordinate roofing to ensure weatherproof integration',
            'Plan electrical and heating zones for new spaces',
            'Ensure adequate drainage for increased roof area',
            'Consider impact on existing building stability',
            'Plan construction sequence to minimize disruption'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'basement_conversion_orchestrator',
        name: 'Basement Conversion AI Agent',
        specialization: 'Basement conversion orchestration with excavation and waterproofing expertise',
        projectTypes: [
          'basement_conversion_full',
          'basement_conversion_partial'
        ] as ProjectType[],
        promptTemplate: 'You are a basement conversion specialist AI agent. Analyze the project requirements and coordinate with structural, electrical, plumbing, heating, and insulation specialists to create a comprehensive basement conversion plan.',
        dependencies: ['structural_agent', 'electrical_agent', 'plumbing_agent', 'heating_hvac_agent', 'insulation_agent'],
        isOrchestrator: true,
        knowledgeBase: {
          id: 'basement_kb',
          domain: 'Basement Conversion Orchestration',
          facts: [
            'Basement conversions require extensive structural calculations and underpinning',
            'Waterproofing is critical - both structural and applied systems needed',
            'Excavation depth affects foundation requirements and neighboring properties',
            'Ventilation and natural light are challenging - mechanical systems essential',
            'Full basement conversions involve complete excavation under existing building',
            'Partial conversions work with existing basement or cellar spaces',
            'Underpinning existing foundations is usually required',
            'Structural waterproofing (Type A) and applied systems (Type C) both needed',
            'Sump pumps and drainage systems are essential for water management',
            'Ceiling height minimum 2.2m for habitable rooms',
            'Emergency egress routes must be planned from basement level',
            'Electrical systems need upgrading for additional circuits',
            'Heating systems require extending with appropriate controls',
            'Insulation critical to prevent condensation and thermal bridging',
            'Party wall agreements essential for excavation work'
          ],
          regulations: [
            'Building Regulations Part A (Structure) - underpinning and excavation',
            'Building Regulations Part C (Site preparation and moisture resistance)',
            'Building Regulations Part F (Ventilation) - mechanical ventilation required',
            'Building Regulations Part B (Fire Safety) - emergency egress',
            'Planning permission for excavation and external changes',
            'Party Wall Act 1996 for excavation near boundaries',
            'CDM Regulations for excavation safety',
            'Environmental health requirements for habitable basements'
          ],
          bestPractices: [
            'Always engage specialist structural engineer for underpinning design',
            'Implement comprehensive waterproofing strategy (Type A + Type C)',
            'Plan drainage systems carefully with sump pumps and backup',
            'Consider emergency egress routes and fire safety',
            'Coordinate mechanical ventilation with heating systems',
            'Plan electrical systems for basement environment',
            'Ensure adequate insulation to prevent condensation',
            'Consider impact on neighboring properties',
            'Plan construction sequence to maintain building stability',
            'Install monitoring systems for water ingress'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'garage_conversion_orchestrator',
        name: 'Garage Conversion AI Agent',
        specialization: 'Garage conversion orchestration with structural and utility expertise',
        projectTypes: [
          'garage_conversion_living_space',
          'garage_conversion_office',
          'garage_conversion_gym',
          'garage_conversion_studio'
        ] as ProjectType[],
        promptTemplate: 'You are a garage conversion specialist AI agent. Analyze the project requirements and coordinate with structural, electrical, plumbing, heating, and insulation specialists to create a comprehensive garage conversion plan.',
        dependencies: ['structural_agent', 'electrical_agent', 'plumbing_agent', 'heating_hvac_agent', 'insulation_agent'],
        isOrchestrator: true,
        knowledgeBase: {
          id: 'garage_kb',
          domain: 'Garage Conversion Orchestration',
          facts: [
            'Garage conversions often fall under permitted development rights',
            'Insulation is crucial for comfort - garages typically have minimal insulation',
            'Damp proofing may need upgrading - concrete floors can have moisture issues',
            'Electrical supply usually needs significant upgrading for habitable use',
            'Living space conversions require full building regulations compliance',
            'Office conversions need adequate lighting and electrical circuits',
            'Gym conversions require ventilation and appropriate flooring',
            'Studio conversions may need acoustic insulation and specialized lighting',
            'Existing foundations may need assessment for habitable use',
            'Garage doors typically replaced with windows and insulated walls',
            'Heating systems need extending from main house',
            'Plumbing may be needed for office or living space conversions',
            'Ceiling height usually adequate but insulation reduces this',
            'Fire safety and emergency egress must be considered',
            'Parking provision may need to be maintained elsewhere'
          ],
          regulations: [
            'Building Regulations approval required for habitable conversions',
            'Planning permission check needed - permitted development limits',
            'Building Regulations Part L (Energy efficiency) - insulation standards',
            'Building Regulations Part P (Electrical safety)',
            'Building Regulations Part F (Ventilation) for habitable rooms',
            'Building Regulations Part C (Moisture resistance)',
            'Fire safety regulations for escape routes',
            'Accessibility standards where applicable'
          ],
          bestPractices: [
            'Check existing foundations adequacy for habitable use',
            'Upgrade insulation to current standards throughout',
            'Install proper heating system connected to main house',
            'Ensure adequate natural light with new windows',
            'Upgrade electrical supply and circuits for modern use',
            'Address damp proofing and moisture control',
            'Plan ventilation for intended use',
            'Consider acoustic insulation from main house',
            'Ensure fire safety and emergency egress',
            'Coordinate utility connections efficiently'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'kitchen_orchestrator',
        name: 'Kitchen AI Agent',
        specialization: 'Kitchen design and installation expertise',
        projectTypes: [
          'kitchen_full_refit',
          'kitchen_partial_upgrade',
          'kitchen_island_installation',
          'kitchen_galley',
          'kitchen_l_shaped',
          'kitchen_u_shaped',
          'kitchen_bespoke_design'
        ] as ProjectType[],
        promptTemplate: 'You are a kitchen design specialist AI agent. Analyze the project requirements and create a comprehensive kitchen design and installation plan.',
        dependencies: [],
        isOrchestrator: true,
        knowledgeBase: {
          id: 'kitchen_kb',
          domain: 'Kitchen Design and Installation',
          facts: [
            'Kitchen triangle principle optimizes workflow between sink, hob, and fridge',
            'Electrical circuits need careful planning - minimum 6 double sockets required',
            'Plumbing routes affect layout options and must avoid structural elements',
            'Ventilation is required by building regulations - minimum 60 l/s extract rate',
            'Work surface height standard is 900mm but can be adjusted 850-950mm',
            'Kitchen islands need minimum 1200mm circulation space around them',
            'Galley kitchens work best with 1200mm minimum width between units',
            'L-shaped kitchens maximize corner space with appropriate corner solutions',
            'U-shaped kitchens provide maximum storage but need 2400mm minimum width',
            'Bespoke designs allow optimization for unusual spaces and specific needs',
            'Appliance ventilation clearances are critical for safety and performance',
            'Lighting should include ambient, task, and accent lighting zones',
            'Worktop materials affect durability, maintenance, and hygiene',
            'Splashback height minimum 600mm behind hobs, 450mm elsewhere',
            'Dishwasher placement should be within 600mm of sink for plumbing efficiency'
          ],
          regulations: [
            'Building Regulations Part P (Electrical safety in kitchens)',
            'Gas Safety (Installation and Use) Regulations 1998',
            'Water Supply (Water Fittings) Regulations 1999',
            'Building Regulations Part F (Ventilation) - mechanical extract required',
            'Building Regulations Part J (Combustion appliances and fuel storage)',
            'Food Safety Act requirements for commercial kitchens',
            'Disability Discrimination Act for accessible kitchen design',
            'Planning permission for kitchen extensions'
          ],
          bestPractices: [
            'Plan electrical points before tiling - include appliance circuits',
            'Allow proper appliance ventilation clearances per manufacturer specs',
            'Consider workflow and ergonomics in layout design',
            'Use appropriate lighting zones for different kitchen tasks',
            'Install adequate extraction to prevent condensation and odors',
            'Plan plumbing to minimize pipe runs and maximize efficiency',
            'Consider future appliance upgrades in electrical planning',
            'Design storage solutions for efficient organization',
            'Ensure adequate worktop space either side of hob and sink',
            'Plan for waste management and recycling storage'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'bathroom_orchestrator',
        name: 'Bathroom AI Agent',
        specialization: 'Bathroom design with wet room and fixture expertise',
        projectTypes: [
          'bathroom_full_refit',
          'bathroom_shower_room',
          'bathroom_ensuite',
          'bathroom_downstairs_wc',
          'bathroom_wet_room',
          'bathroom_family',
          'bathroom_luxury_suite'
        ] as ProjectType[],
        promptTemplate: 'You are a bathroom design specialist AI agent. Analyze the project requirements and create a comprehensive bathroom design and installation plan.',
        dependencies: [],
        isOrchestrator: true,
        knowledgeBase: {
          id: 'bathroom_kb',
          domain: 'Bathroom Design and Wet Areas',
          facts: [
            'Waterproofing is critical in wet areas - tanking required behind baths and showers',
            'Ventilation prevents mold and condensation - minimum 15 l/s extract rate',
            'Electrical zones have specific IP ratings - Zone 0: IPX7, Zone 1: IPX4, Zone 2: IPX4',
            'Floor loading may need consideration for heavy baths and stone materials',
            'Wet rooms require proper floor falls (1:80 minimum) to drainage points',
            'En-suite bathrooms need minimum 1200mm x 2100mm for basic layout',
            'Downstairs WC minimum size 800mm x 1500mm with 200mm door swing clearance',
            'Family bathrooms benefit from separate bath and shower facilities',
            'Luxury suites may include steam rooms, underfloor heating, and premium fixtures',
            'Shower room minimum size 900mm x 900mm for comfortable use',
            'Accessibility requires 1500mm turning circle and grab rail provision',
            'Heated towel rails provide comfort and help prevent condensation',
            'Mirror placement should avoid direct shower spray but provide good lighting',
            'Storage solutions should be moisture-resistant and well-ventilated'
          ],
          regulations: [
            'Building Regulations Part P (Electrical zones in bathrooms)',
            'Water Supply (Water Fittings) Regulations 1999',
            'Building Regulations Part F (Ventilation) - mechanical extract required',
            'Building Regulations Part G (Sanitation, hot water safety)',
            'Building Regulations Part M (Accessibility) where applicable',
            'British Standard BS 5385 for wall tiling in wet areas',
            'British Standard BS 8000-11 for waterproofing',
            'Disability Discrimination Act for accessible bathroom design'
          ],
          bestPractices: [
            'Install proper waterproof membrane behind all wet areas',
            'Use appropriate electrical zones and IP-rated fittings',
            'Plan drainage falls correctly - 1:80 minimum for wet rooms',
            'Consider future maintenance access for concealed pipework',
            'Install adequate ventilation to prevent mold and condensation',
            'Use moisture-resistant materials throughout',
            'Plan lighting for grooming tasks and ambiance',
            'Consider underfloor heating for comfort and drying',
            'Install thermostatic mixing valves for safety',
            'Plan storage solutions that work in humid environments'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'bedroom_orchestrator',
        name: 'Bedroom AI Agent',
        specialization: 'Bedroom renovation and conversion expertise',
        projectTypes: [
          'bedroom_master',
          'bedroom_children',
          'bedroom_guest',
          'bedroom_nursery'
        ] as ProjectType[],
        promptTemplate: 'You are a bedroom design specialist AI agent. Analyze the project requirements and create a comprehensive bedroom design and renovation plan.',
        dependencies: [],
        isOrchestrator: true,
        knowledgeBase: {
          id: 'bedroom_kb',
          domain: 'Bedroom Design and Renovation',
          facts: [
            'Natural light and ventilation are essential for healthy sleep environments',
            'Storage solutions maximize space efficiency in bedrooms',
            'Electrical points should accommodate bedside lighting, charging, and entertainment',
            'Acoustic insulation improves sleep quality and privacy',
            'Bedroom minimum ceiling height is 2.3m for habitable rooms',
            'Window area should be minimum 10% of floor area for natural light',
            'Built-in wardrobes can increase usable floor space by 15-20%',
            'Master bedrooms benefit from en-suite access and walk-in storage',
            'Children\'s bedrooms need adaptable layouts for changing needs',
            'Guest bedrooms should provide hotel-like comfort and privacy',
            'Nurseries require easy access, safety features, and temperature control',
            'Flooring choice affects acoustics - carpet reduces noise transmission',
            'Blackout options are important for quality sleep',
            'Heating zones allow individual temperature control'
          ],
          regulations: [
            'Building Regulations Part F (Ventilation) - minimum 8.4 l/s per person',
            'Building Regulations Part L (Energy efficiency and insulation)',
            'Building Regulations Part E (Acoustic performance)',
            'Electrical safety standards BS 7671 for bedroom circuits',
            'Fire safety requirements for escape routes',
            'Planning permission for loft bedroom conversions',
            'Building control approval for structural changes',
            'Accessibility standards for adaptable bedrooms'
          ],
          bestPractices: [
            'Plan lighting zones: ambient, task, accent, and night lighting',
            'Consider built-in storage to maximize floor space',
            'Ensure adequate ventilation to prevent condensation',
            'Use appropriate flooring materials for comfort and acoustics',
            'Install sufficient electrical outlets for modern needs',
            'Plan heating controls for individual room comfort',
            'Consider blackout and privacy window treatments',
            'Design flexible layouts that can adapt over time',
            'Ensure easy access to en-suite facilities where applicable',
            'Plan cable management for entertainment and charging needs'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'living_room_agent',
        name: 'Living Room AI Agent',
        specialization: 'Living room renovation with open plan and feature expertise',
        projectTypes: [
          'living_room_open_plan',
          'living_room_fireplace',
          'living_room_storage',
          'living_room_snug'
        ] as ProjectType[],
        promptTemplate: 'You are a living room design specialist AI agent. Analyze the project requirements and create a comprehensive living room design and renovation plan.',
        dependencies: [],
        isOrchestrator: true,
        knowledgeBase: {
          id: 'living_room_kb',
          domain: 'Living Room Design and Renovation',
          facts: [
            'Open plan living requires careful zoning for different activities',
            'Fireplace installations need proper flue design and safety clearances',
            'Built-in storage solutions can define spaces while providing function',
            'Snug areas create intimate spaces within larger rooms',
            'Ceiling height affects the feeling of space - minimum 2.4m preferred',
            'Natural light should be maximized with appropriate window treatments',
            'Acoustic design prevents sound transfer between zones',
            'Electrical planning must accommodate entertainment systems and lighting',
            'Structural changes may be needed for open plan conversions',
            'Heating zones ensure comfort in different areas',
            'Flooring transitions help define different functional areas',
            'Feature walls can create focal points and define spaces',
            'Bi-fold doors can connect indoor and outdoor living spaces',
            'Smart home integration enhances lighting and entertainment control'
          ],
          regulations: [
            'Building Regulations Part A (Structure) for wall removals',
            'Building Regulations Part B (Fire safety) for escape routes',
            'Building Regulations Part E (Acoustics) for sound insulation',
            'Building Regulations Part F (Ventilation) for air quality',
            'Building Regulations Part J (Combustion appliances) for fireplaces',
            'Planning permission for structural alterations',
            'Party Wall Act for shared wall modifications',
            'Gas Safety Regulations for gas fireplaces'
          ],
          bestPractices: [
            'Create distinct zones for different activities (seating, dining, entertainment)',
            'Plan electrical circuits for multiple lighting scenes',
            'Consider acoustic treatment to manage sound in open spaces',
            'Use flooring transitions to define different areas',
            'Install adequate heating controls for different zones',
            'Plan cable management for entertainment systems',
            'Consider natural light throughout the day',
            'Design storage solutions that don\'t obstruct sight lines',
            'Ensure structural adequacy before removing walls',
            'Plan for future technology and entertainment needs'
          ],
          lastUpdated: new Date()
        }
      }
    ];

    for (const orchestrator of orchestrators) {
      await aiAgentService.registerAgent(orchestrator);
    }
  }

  /**
   * Register specialist agents for specific trades
   */
  private async registerSpecialistAgents(): Promise<void> {
    const specialists = [
      // Trade-specific AI agents as per task 6.1
      {
        id: 'windows_doors_agent',
        name: 'Windows & Doors AI Agent',
        specialization: 'Glazing, frames, and installation expertise for windows and doors',
        projectTypes: [
          'windows_upvc',
          'windows_timber',
          'windows_aluminium',
          'windows_sash',
          'doors_bifold',
          'doors_sliding',
          'doors_french',
          'bay_window_installation'
        ] as ProjectType[],
        promptTemplate: 'You are a windows and doors specialist AI agent. Analyze the project requirements and provide expert recommendations for glazing, frames, and installation.',
        dependencies: [],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'windows_doors_kb',
          domain: 'Windows and Doors',
          facts: [
            'U-values determine energy efficiency ratings (lower is better)',
            'Double glazing typically achieves 1.4-2.8 W/m²K, triple glazing 0.8-1.2 W/m²K',
            'Security standards vary by location - PAS 24 for enhanced security',
            'Structural openings need proper lintels and support calculations',
            'Weatherproofing prevents water ingress and air leakage',
            'Thermal bridging occurs where materials conduct heat through the frame',
            'Acoustic glazing reduces noise transmission (measured in dB reduction)',
            'Toughened glass required in certain locations for safety',
            'Laminated glass provides security and UV protection',
            'Window Energy Ratings (WER) range from G (poor) to A++ (excellent)',
            'Argon gas filling improves thermal performance in double/triple glazing',
            'Low-E coatings reflect heat back into rooms',
            'Sash windows require specialized restoration techniques for period properties',
            'Bi-fold doors need structural support for large openings',
            'French doors require proper threshold design for weatherproofing'
          ],
          regulations: [
            'Building Regulations Part L (Conservation of fuel and power)',
            'Building Regulations Part Q (Security - Dwellings)',
            'Building Regulations Part N (Glazing - safety in relation to impact, opening and cleaning)',
            'CE marking requirements for windows and doors',
            'Planning permission requirements for window alterations in conservation areas',
            'Listed building consent for window replacements',
            'British Standard BS 6375 for window performance',
            'PAS 24:2016 for enhanced security performance'
          ],
          bestPractices: [
            'Check structural adequacy of openings before installation',
            'Ensure proper weatherproofing with appropriate sealants',
            'Consider thermal bridging and specify thermal breaks',
            'Plan for maintenance access and cleaning',
            'Match architectural style for period properties',
            'Specify appropriate glass types for location and use',
            'Install proper drainage and ventilation',
            'Consider acoustic requirements for noisy locations',
            'Ensure compliance with security requirements',
            'Plan electrical connections for automated systems'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'electrical_agent',
        name: 'Electrical AI Agent',
        specialization: 'Wiring, safety compliance, and electrical system design',
        projectTypes: [
          'electrical_rewiring',
          'electrical_consumer_unit',
          'electrical_ev_charging',
          'electrical_smart_home'
        ] as ProjectType[],
        promptTemplate: 'You are an electrical specialist AI agent. Analyze the project requirements and provide expert recommendations for wiring, safety compliance, and electrical system design.',
        dependencies: [],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'electrical_kb',
          domain: 'Electrical Systems',
          facts: [
            'RCD protection (30mA) required for most circuits in domestic installations',
            'Cable sizing depends on load current, installation method, and cable length',
            'Bathroom zones have specific IP ratings: Zone 0 (IPX7), Zone 1 (IPX4), Zone 2 (IPX4)',
            'EV charging requires dedicated 32A circuit with Type A RCD protection',
            'Smart home systems need structured cabling and adequate power supplies',
            'LED lighting reduces energy consumption by 80% compared to incandescent',
            'Circuit breakers protect cables, RCDs protect people',
            'Earthing systems: TN-S (separate neutral and earth), TN-C-S (combined neutral-earth)',
            'Voltage drop should not exceed 3% for lighting, 5% for other circuits',
            'AFDD (Arc Fault Detection Devices) required for certain circuits from 2022',
            'Surge protection devices (SPDs) recommended for all installations',
            'Emergency lighting required in commercial conversions',
            'Fire alarm systems mandatory in HMOs and commercial properties',
            'Underfloor heating requires appropriate thermostats and controls'
          ],
          regulations: [
            'Building Regulations Part P (Electrical safety)',
            'BS 7671:2018+A2:2022 (IET Wiring Regulations)',
            'Electrical Safety Standards in the Private Rented Sector Regulations 2020',
            'NICEIC/NAPIT certification requirements for notifiable work',
            'CDM Regulations for electrical safety during construction',
            'Electricity at Work Regulations 1989',
            'Low Voltage Directive (LVD) for electrical equipment',
            'EMC Directive for electromagnetic compatibility'
          ],
          bestPractices: [
            'Plan circuit layout during first fix stage before plastering',
            'Use appropriate cable types for installation method and environment',
            'Install adequate earthing and bonding throughout',
            'Test all circuits thoroughly with appropriate test equipment',
            'Provide circuit schedules and as-built drawings',
            'Consider future electrical needs and spare capacity',
            'Use quality components from reputable manufacturers',
            'Ensure proper cable management and support',
            'Install appropriate isolation switches for maintenance',
            'Document all test results and certifications'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'plumbing_agent',
        name: 'Plumbing AI Agent',
        specialization: 'Pipes, fixtures, drainage, and water system expertise',
        projectTypes: [
          'plumbing_bathroom',
          'plumbing_kitchen',
          'plumbing_water_pressure',
          'plumbing_mains_upgrade'
        ] as ProjectType[],
        promptTemplate: 'You are a plumbing specialist AI agent. Analyze the project requirements and provide expert recommendations for water supply and drainage systems. Consider pipe sizing, water pressure, and building regulations.',
        dependencies: [],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'plumbing_kb',
          domain: 'Plumbing Systems',
          facts: [
            'Pipe sizing affects water pressure - 15mm for basins, 22mm for baths',
            'Drainage falls must be 1:40 minimum for 100mm pipes, 1:80 for 150mm pipes',
            'Isolation valves essential for maintenance - install at each fixture',
            'Pressure testing prevents leaks - test at 1.5x working pressure',
            'Water pressure should be minimum 1 bar for adequate flow',
            'Combi boilers require minimum 20mm supply pipe for adequate flow',
            'Soil pipes need proper ventilation to prevent trap seal loss',
            'Copper pipes expand 1.7mm per meter per 100°C temperature rise',
            'Plastic pipes have higher expansion rates than copper',
            'Water hammer arrestors prevent noise and damage from pressure surges',
            'Backflow prevention required where contamination risk exists',
            'Legionella risk in hot water systems - maintain 60°C at cylinder',
            'Unvented cylinders require G3 qualified installer',
            'Rainwater harvesting systems need separate pipework and controls'
          ],
          regulations: [
            'Water Supply (Water Fittings) Regulations 1999',
            'Building Regulations Part G (Sanitation, hot water safety and water efficiency)',
            'Building Regulations Part H (Drainage and waste disposal)',
            'British Standards BS EN 806 for water supply systems',
            'Water company bylaws and connection requirements',
            'Legionella control regulations (L8 guidance)',
            'Unvented hot water systems regulations (G3 qualification)',
            'Backflow prevention requirements'
          ],
          bestPractices: [
            'Plan pipe routes to avoid conflicts with other services',
            'Use appropriate pipe materials for application and environment',
            'Install adequate isolation valves for maintenance access',
            'Test all systems before covering pipework',
            'Provide proper pipe support and expansion allowances',
            'Insulate pipes to prevent freezing and heat loss',
            'Install water treatment where water quality is poor',
            'Consider noise transmission through pipe runs',
            'Plan for future maintenance and replacement',
            'Document system layout and valve locations'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'roofing_agent',
        name: 'Roofing AI Agent',
        specialization: 'Roofing materials, installation, and weatherproofing expertise',
        projectTypes: [
          'roofing_re_roofing',
          'roofing_repairs',
          'roofing_flat_replacement',
          'roofing_green',
          'roofing_slate',
          'roofing_tile',
          'roofing_metal'
        ] as ProjectType[],
        promptTemplate: 'You are a roofing specialist AI agent. Analyze the project requirements and provide expert recommendations for roof construction, repairs, and replacements. Consider structural requirements, weatherproofing, and building regulations.',
        dependencies: ['structural_agent'],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'roofing_kb',
          domain: 'Roofing Systems',
          facts: [
            'Roof pitch determines material suitability - slate minimum 20°, tiles 15°',
            'Ventilation prevents condensation - 25mm continuous gap at eaves and ridge',
            'Insulation placement affects performance - warm roof vs cold roof construction',
            'Drainage design prevents water damage - gutters sized for roof area',
            'Wind uplift forces increase with height and exposure',
            'Thermal movement in materials requires expansion joints',
            'Vapor barriers prevent interstitial condensation in roof structure',
            'Green roofs require structural loading calculations and waterproofing',
            'Metal roofing requires thermal movement joints and proper fixings',
            'Flat roofs need minimum 1:80 fall for drainage',
            'EPDM membranes provide 50+ year life with proper installation',
            'Slate quality varies - Welsh slate superior to imported alternatives',
            'Clay tiles more durable than concrete in coastal environments',
            'Lead work requires traditional skills for period properties'
          ],
          regulations: [
            'Building Regulations Part C (Site preparation and resistance to contaminants and moisture)',
            'Building Regulations Part L (Conservation of fuel and power)',
            'British Standards BS 5534 for slating and tiling',
            'British Standards BS 6229 for flat roofs',
            'Planning requirements for roof alterations and materials',
            'Listed building consent for heritage roofing materials',
            'CDM Regulations for working at height',
            'Health and Safety Executive guidance on roof work'
          ],
          bestPractices: [
            'Ensure adequate structural support for roof loads',
            'Install proper ventilation to prevent condensation',
            'Use appropriate underlays for roof type and exposure',
            'Plan for thermal movement in materials and structure',
            'Consider maintenance access and safety provisions',
            'Match existing materials for extensions and repairs',
            'Install proper edge details and weatherproofing',
            'Consider wind uplift in exposed locations',
            'Plan drainage to prevent water damage',
            'Use quality fixings appropriate for roof type'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'heating_hvac_agent',
        name: 'Heating & HVAC AI Agent',
        specialization: 'Heating system design, HVAC, and energy efficiency expertise',
        projectTypes: [
          'heating_boiler_replacement',
          'heating_radiator_upgrade',
          'heating_underfloor',
          'heating_heat_pump',
          'air_conditioning',
          'ventilation_mvhr',
          'ventilation_extract_fans'
        ] as ProjectType[],
        promptTemplate: 'You are a heating and HVAC specialist AI agent. Analyze the project requirements and provide expert recommendations for heating, ventilation, and air conditioning systems. Consider energy efficiency, building regulations, and system optimization.',
        dependencies: ['electrical_agent', 'plumbing_agent'],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'heating_hvac_kb',
          domain: 'Heating and HVAC',
          facts: [
            'Heat loss calculations determine system sizing using SAP methodology',
            'Ventilation rates: 8.4 l/s per person minimum for habitable rooms',
            'System efficiency impacts running costs - A-rated boilers 90%+ efficient',
            'Controls optimize performance - room thermostats, TRVs, and timers',
            'Heat pumps work efficiently down to -15°C with proper sizing',
            'Underfloor heating operates at lower temperatures (35-45°C vs 70°C radiators)',
            'MVHR systems recover 90%+ of heat from extract air',
            'Air conditioning requires refrigerant handling qualifications (F-Gas)',
            'Zoned heating systems improve comfort and efficiency',
            'Thermal mass affects heating response times',
            'Condensing boilers need proper condensate drainage',
            'Heat pump COP (Coefficient of Performance) varies with external temperature',
            'Biomass boilers require fuel storage and flue gas cleaning',
            'Solar thermal systems can provide 50-60% of hot water needs'
          ],
          regulations: [
            'Building Regulations Part F (Ventilation)',
            'Building Regulations Part L (Conservation of fuel and power)',
            'Gas Safety (Installation and Use) Regulations 1998',
            'Boiler efficiency requirements (ErP Directive)',
            'F-Gas Regulations for refrigerant systems',
            'Renewable Heat Incentive (RHI) requirements',
            'Microgeneration Certification Scheme (MCS) standards',
            'Pressure Systems Safety Regulations for unvented systems'
          ],
          bestPractices: [
            'Calculate heat loads accurately using recognized methods',
            'Size systems appropriately - oversizing reduces efficiency',
            'Install proper controls for zoning and optimization',
            'Consider maintenance access for all equipment',
            'Plan electrical supplies for pumps and controls',
            'Insulate pipework to minimize heat losses',
            'Install system filtration to protect equipment',
            'Provide adequate ventilation for combustion appliances',
            'Consider noise levels for heat pumps and fans',
            'Plan for future maintenance and component replacement'
          ],
          lastUpdated: new Date()
        }
      },
      // External work AI agents (Task 6.4)
      {
        id: 'rendering_cladding_agent',
        name: 'Rendering & Cladding AI Agent',
        specialization: 'External rendering and cladding materials expertise',
        projectTypes: [
          'rendering_k_rend',
          'rendering_pebbledash',
          'cladding_timber',
          'cladding_brick_slip'
        ] as ProjectType[],
        promptTemplate: 'You are a rendering and cladding specialist. Analyze the project requirements and provide detailed recommendations for external rendering and cladding systems. Consider weather protection, thermal performance, structural requirements, and building regulations.',
        dependencies: ['structural_agent'],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'rendering_cladding_kb',
          domain: 'External Rendering and Cladding',
          facts: [
            'K-rend systems provide weather protection and thermal performance',
            'Pebbledash rendering offers traditional appearance with durability',
            'Timber cladding requires proper ventilation and moisture management',
            'Brick slip cladding provides brick appearance without structural load',
            'Render systems need proper substrate preparation and priming',
            'Cladding systems require structural support and fixing calculations',
            'Thermal bridging must be avoided at fixing points',
            'Ventilation gaps essential behind cladding systems',
            'Weather protection during application is critical',
            'Expansion joints required for large areas',
            'Insulation integration affects system design',
            'Fire performance varies between cladding materials',
            'Maintenance access should be considered in design',
            'Color and texture affect thermal performance'
          ],
          regulations: [
            'Building Regulations Part B (Fire safety) - cladding fire performance',
            'Building Regulations Part C (Resistance to moisture)',
            'Building Regulations Part L (Conservation of fuel and power)',
            'Planning permission for external appearance changes',
            'British Standards BS 8000-10 for external rendering',
            'British Standards BS 8297 for cladding systems',
            'CDM Regulations for working at height',
            'NHBC standards for external wall systems'
          ],
          bestPractices: [
            'Ensure proper substrate preparation before application',
            'Install adequate ventilation behind cladding systems',
            'Use appropriate fixings for structural loads',
            'Plan expansion joints for thermal movement',
            'Consider maintenance access in system design',
            'Ensure fire safety compliance for cladding materials',
            'Protect work from weather during application',
            'Plan scaffolding and access requirements',
            'Consider thermal bridging at fixing points',
            'Specify appropriate primers and base coats'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'landscaping_garden_agent',
        name: 'Landscaping & Garden AI Agent',
        specialization: 'Garden design and installation expertise with landscape knowledge',
        projectTypes: [
          'garden_landscaping',
          'garden_decking_composite',
          'garden_decking_hardwood',
          'garden_decking_raised',
          'garden_pergola'
        ] as ProjectType[],
        promptTemplate: 'You are a landscaping and garden design specialist. Analyze the project requirements and provide detailed recommendations for garden design and installation. Consider soil conditions, drainage, plant selection, structural requirements, and planning regulations.',
        dependencies: [],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'landscaping_garden_kb',
          domain: 'Landscaping and Garden Design',
          facts: [
            'Garden design should consider soil conditions and drainage',
            'Composite decking requires minimal maintenance but higher initial cost',
            'Hardwood decking provides natural appearance but needs regular treatment',
            'Raised decking requires structural support and building regulations compliance',
            'Pergolas provide shade and structure for climbing plants',
            'Plant selection should consider local climate and soil conditions',
            'Drainage is critical for preventing waterlogging and plant disease',
            'Levels and gradients affect water flow and usability',
            'Access routes should be planned for maintenance and deliveries',
            'Seasonal considerations affect planting and construction timing',
            'Wildlife habitats can be integrated into garden design',
            'Lighting enhances usability and security',
            'Irrigation systems improve plant establishment and maintenance',
            'Boundary treatments affect privacy and security'
          ],
          regulations: [
            'Building Regulations Part A (Structure) for raised decking over 600mm',
            'Planning permission for large structures and boundary changes',
            'Party Wall Act for boundary work affecting neighbors',
            'Tree Preservation Orders (TPO) for protected trees',
            'Conservation area restrictions on garden changes',
            'Wildlife and Countryside Act for protected species',
            'Water supply regulations for irrigation systems',
            'Health and Safety regulations for construction work'
          ],
          bestPractices: [
            'Conduct soil survey and drainage assessment',
            'Plan for seasonal changes and plant growth',
            'Consider maintenance requirements in design',
            'Ensure adequate drainage for all areas',
            'Plan access routes for construction and maintenance',
            'Select appropriate materials for local climate',
            'Consider wildlife and biodiversity in design',
            'Plan lighting and electrical supplies early',
            'Ensure structural adequacy for raised features',
            'Consider long-term plant growth and maintenance'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'driveway_patio_agent',
        name: 'Driveway & Patio AI Agent',
        specialization: 'Driveway and patio materials and drainage expertise',
        projectTypes: [
          'driveway_block_paving',
          'driveway_resin',
          'driveway_tarmac',
          'driveway_natural_stone',
          'driveway_gravel',
          'driveway_concrete',
          'patio_block_paving',
          'patio_natural_stone',
          'patio_concrete'
        ] as ProjectType[],
        promptTemplate: 'You are a driveway and patio specialist. Analyze the project requirements and provide detailed recommendations for driveway and patio construction. Consider materials, drainage, sub-base preparation, and planning requirements.',
        dependencies: [],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'driveway_patio_kb',
          domain: 'Driveways and Patios',
          facts: [
            'Block paving provides flexibility and easy repair but requires edge restraints',
            'Resin bound surfaces are permeable and low maintenance',
            'Tarmac is cost-effective but requires proper sub-base preparation',
            'Natural stone provides premium appearance but varies in durability',
            'Gravel driveways are permeable but require regular maintenance',
            'Concrete is durable and cost-effective but can crack without proper joints',
            'Drainage is critical for preventing water damage and ice formation',
            'Sub-base preparation affects long-term performance',
            'Vehicle loading determines construction requirements',
            'Gradients affect drainage and usability',
            'Permeable surfaces help with sustainable drainage (SuDS)',
            'Edge restraints prevent lateral movement of materials',
            'Expansion joints prevent cracking in rigid surfaces',
            'Surface textures affect slip resistance and appearance'
          ],
          regulations: [
            'Planning permission for front garden paving over 5m²',
            'Building Regulations drainage requirements',
            'Sustainable Drainage Systems (SuDS) requirements',
            'Highways Act for dropped kerbs and access',
            'Party Wall Act for boundary work',
            'Environmental regulations for surface water disposal',
            'Disability Discrimination Act for accessible surfaces',
            'Health and Safety regulations for construction'
          ],
          bestPractices: [
            'Ensure adequate sub-base preparation for loading',
            'Install proper drainage to prevent water damage',
            'Use appropriate edge restraints for flexible surfaces',
            'Plan expansion joints for rigid surfaces',
            'Consider permeable surfaces for sustainability',
            'Ensure adequate gradients for drainage',
            'Plan access during construction',
            'Consider long-term maintenance requirements',
            'Ensure compliance with planning and drainage regulations',
            'Select materials appropriate for intended use and loading'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'structural_agent',
        name: 'Structural Engineering Agent',
        specialization: 'Structural calculations and building stability',
        projectTypes: [] as ProjectType[], // Used by multiple project types
        promptTemplate: 'You are a structural engineering specialist. Analyze the project requirements and provide detailed structural calculations and recommendations. Consider load-bearing requirements, building stability, and structural regulations.',
        dependencies: [],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'structural_kb',
          domain: 'Structural Engineering',
          facts: [
            'Load-bearing walls require structural calculations',
            'Foundation design depends on soil conditions',
            'Steel beams need proper sizing and support',
            'Building movement joints prevent cracking'
          ],
          regulations: [
            'Building Regulations Part A (Structure)',
            'Eurocodes for structural design',
            'British Standards for materials',
            'CDM Regulations for safety'
          ],
          bestPractices: [
            'Always engage qualified structural engineer',
            'Conduct thorough site survey',
            'Consider long-term building movement',
            'Plan for future modifications'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'electrical_agent',
        name: 'Electrical Systems Agent',
        specialization: 'Electrical installations and safety',
        projectTypes: [
          'electrical_rewiring',
          'electrical_consumer_unit',
          'electrical_ev_charging',
          'electrical_smart_home'
        ] as ProjectType[],
        promptTemplate: 'You are an electrical systems specialist. Analyze the project requirements and provide detailed recommendations for electrical installations. Consider safety regulations, circuit design, load calculations, and certification requirements.',
        dependencies: [],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'electrical_kb',
          domain: 'Electrical Systems',
          facts: [
            'RCD protection is required for most circuits',
            'Cable sizing depends on load and length',
            'Bathroom zones have specific requirements',
            'EV charging requires dedicated circuit'
          ],
          regulations: [
            'Building Regulations Part P',
            'BS 7671 Wiring Regulations',
            'Electrical Safety Standards',
            'NICEIC/NAPIT certification requirements'
          ],
          bestPractices: [
            'Plan circuit layout before first fix',
            'Use appropriate cable types',
            'Install adequate earthing',
            'Test all circuits thoroughly'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'plumbing_agent',
        name: 'Plumbing Systems Agent',
        specialization: 'Water supply and drainage systems',
        projectTypes: [
          'plumbing_bathroom',
          'plumbing_kitchen',
          'plumbing_water_pressure',
          'plumbing_mains_upgrade'
        ] as ProjectType[],
        promptTemplate: 'You are a plumbing systems specialist. Analyze the project requirements and provide detailed recommendations for water supply and drainage systems. Consider pipe sizing, water pressure, drainage requirements, and building regulations.',
        dependencies: [],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'plumbing_kb',
          domain: 'Plumbing Systems',
          facts: [
            'Pipe sizing affects water pressure',
            'Drainage falls must be correct',
            'Isolation valves are essential',
            'Pressure testing prevents leaks'
          ],
          regulations: [
            'Water Supply Regulations',
            'Building Regulations Part G',
            'British Standards for pipework',
            'Water company requirements'
          ],
          bestPractices: [
            'Plan pipe routes to avoid conflicts',
            'Use appropriate pipe materials',
            'Install adequate isolation',
            'Test systems before covering'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'windows_doors_agent',
        name: 'Windows & Doors Agent',
        specialization: 'Window and door installations',
        projectTypes: [
          'windows_upvc',
          'windows_timber',
          'windows_aluminium',
          'windows_sash',
          'doors_bifold',
          'doors_sliding',
          'doors_french'
        ] as ProjectType[],
        promptTemplate: 'You are a windows and doors specialist. Analyze the project requirements and provide detailed recommendations for window and door installations. Consider energy efficiency, security, structural requirements, and building regulations.',
        dependencies: [],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'windows_doors_kb',
          domain: 'Windows and Doors',
          facts: [
            'U-values determine energy efficiency',
            'Security standards vary by location',
            'Structural openings need proper support',
            'Weatherproofing prevents water ingress'
          ],
          regulations: [
            'Building Regulations Part L (Energy)',
            'Building Regulations Part Q (Security)',
            'CE marking requirements',
            'Planning permission for alterations'
          ],
          bestPractices: [
            'Check structural adequacy of openings',
            'Ensure proper weatherproofing',
            'Consider thermal bridging',
            'Plan for maintenance access'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'roofing_agent',
        name: 'Roofing Systems Agent',
        specialization: 'Roof construction and repairs',
        projectTypes: [
          'roofing_re_roofing',
          'roofing_repairs',
          'roofing_flat_replacement',
          'roofing_green',
          'roofing_slate',
          'roofing_tile',
          'roofing_metal'
        ] as ProjectType[],
        promptTemplate: 'You are a roofing systems specialist. Analyze the project requirements and provide detailed recommendations for roof construction, repairs, and replacements. Consider structural requirements, weatherproofing, insulation, and building regulations.',
        dependencies: ['structural_agent'],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'roofing_kb',
          domain: 'Roofing Systems',
          facts: [
            'Roof pitch determines material suitability',
            'Ventilation prevents condensation',
            'Insulation placement affects performance',
            'Drainage design prevents water damage'
          ],
          regulations: [
            'Building Regulations Part C (Resistance to moisture)',
            'Building Regulations Part L (Insulation)',
            'British Standards for roofing materials',
            'Planning requirements for roof alterations'
          ],
          bestPractices: [
            'Ensure adequate structural support',
            'Install proper ventilation',
            'Use appropriate underlays',
            'Plan for thermal movement'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'insulation_agent',
        name: 'Insulation Systems Agent',
        specialization: 'Thermal and acoustic insulation',
        projectTypes: [
          'insulation_loft',
          'insulation_cavity_wall',
          'insulation_external_wall',
          'insulation_floor',
          'insulation_acoustic'
        ] as ProjectType[],
        promptTemplate: 'You are an insulation systems specialist. Analyze the project requirements and provide detailed recommendations for thermal and acoustic insulation. Consider energy efficiency, building regulations, vapor barriers, and thermal bridging.',
        dependencies: [],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'insulation_kb',
          domain: 'Insulation Systems',
          facts: [
            'R-values determine thermal performance',
            'Vapor barriers prevent condensation',
            'Thermal bridging reduces efficiency',
            'Air gaps affect performance'
          ],
          regulations: [
            'Building Regulations Part L',
            'Energy efficiency standards',
            'Fire safety requirements',
            'Environmental standards'
          ],
          bestPractices: [
            'Eliminate thermal bridges',
            'Ensure continuous insulation',
            'Install vapor barriers correctly',
            'Consider acoustic requirements'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'heating_hvac_agent',
        name: 'Heating & HVAC Agent',
        specialization: 'Heating, ventilation, and air conditioning',
        projectTypes: [
          'heating_boiler_replacement',
          'heating_radiator_upgrade',
          'heating_underfloor',
          'heating_heat_pump',
          'air_conditioning',
          'ventilation_mvhr',
          'ventilation_extract_fans'
        ] as ProjectType[],
        promptTemplate: 'You are a heating and HVAC specialist. Analyze the project requirements and provide detailed recommendations for heating, ventilation, and air conditioning systems. Consider energy efficiency, building regulations, and optimal system sizing.',
        dependencies: ['electrical_agent', 'plumbing_agent'],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'heating_hvac_kb',
          domain: 'Heating and HVAC',
          facts: [
            'Heat loss calculations determine system sizing',
            'Ventilation rates affect air quality',
            'System efficiency impacts running costs',
            'Controls optimize performance'
          ],
          regulations: [
            'Building Regulations Part F (Ventilation)',
            'Building Regulations Part L (Energy)',
            'Gas Safety Regulations',
            'Boiler efficiency requirements'
          ],
          bestPractices: [
            'Calculate heat loads accurately',
            'Size systems appropriately',
            'Install proper controls',
            'Consider maintenance access'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'flooring_agent',
        name: 'Flooring Systems Agent',
        specialization: 'Floor coverings and subfloors',
        projectTypes: [
          'flooring_hardwood_solid',
          'flooring_hardwood_engineered',
          'flooring_parquet',
          'flooring_herringbone',
          'flooring_laminate',
          'flooring_lvt',
          'flooring_carpet_fitted',
          'flooring_vinyl',
          'flooring_linoleum',
          'flooring_concrete_polished',
          'flooring_resin_epoxy'
        ] as ProjectType[],
        promptTemplate: 'You are a flooring systems specialist. Analyze the project requirements and provide detailed recommendations for floor coverings and subfloor preparation. Consider durability, aesthetics, maintenance, and building regulations.',
        dependencies: [],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'flooring_kb',
          domain: 'Flooring Systems',
          facts: [
            'Subfloor condition affects finish quality',
            'Moisture content must be controlled',
            'Expansion gaps prevent buckling',
            'Underlay improves comfort and acoustics'
          ],
          regulations: [
            'Building Regulations Part E (Acoustics)',
            'British Standards for flooring',
            'Fire safety requirements',
            'Slip resistance standards'
          ],
          bestPractices: [
            'Check subfloor levels and condition',
            'Allow for material acclimatization',
            'Install appropriate underlays',
            'Plan expansion joints correctly'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'tiling_agent',
        name: 'Tiling Systems Agent',
        specialization: 'Ceramic, porcelain, and stone tiling',
        projectTypes: [
          'tiling_ceramic',
          'tiling_porcelain',
          'tiling_natural_stone',
          'tiling_mosaic'
        ] as ProjectType[],
        promptTemplate: 'You are a tiling systems specialist. Analyze the project requirements and provide detailed recommendations for ceramic, porcelain, and stone tiling installations. Consider substrate preparation, waterproofing, and aesthetic requirements.',
        dependencies: [],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'tiling_kb',
          domain: 'Tiling Systems',
          facts: [
            'Substrate preparation is critical',
            'Adhesive type depends on tile and substrate',
            'Movement joints prevent cracking',
            'Waterproofing is essential in wet areas'
          ],
          regulations: [
            'British Standards for tiling',
            'Waterproofing requirements',
            'Slip resistance standards',
            'Fire safety classifications'
          ],
          bestPractices: [
            'Prepare substrates properly',
            'Use appropriate adhesives',
            'Install movement joints',
            'Apply waterproofing where required'
          ],
          lastUpdated: new Date()
        }
      }
    ];

    for (const specialist of specialists) {
      await aiAgentService.registerAgent(specialist);
    }
  }

  /**
   * Register analysis and optimization agents
   */
  private async registerAnalysisAgents(): Promise<void> {
    const analysisAgents = [
      {
        id: 'project_analysis_agent',
        name: 'Project Analysis Agent',
        specialization: 'Analyzing "Others" project descriptions',
        projectTypes: ['others'] as ProjectType[],
        promptTemplate: 'You are a project analysis specialist. Analyze project descriptions and requirements to identify the appropriate trades, specialists, and regulatory requirements. Provide detailed project breakdown and recommendations.',
        dependencies: [],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'project_analysis_kb',
          domain: 'Project Analysis',
          facts: [
            'Project complexity affects agent selection',
            'Trade requirements determine specialist needs',
            'Regulatory requirements vary by project type',
            'Timeline dependencies affect sequencing'
          ],
          regulations: [
            'All relevant building regulations',
            'Planning permission requirements',
            'Health and safety regulations',
            'Environmental standards'
          ],
          bestPractices: [
            'Analyze project scope thoroughly',
            'Identify all required trades',
            'Consider regulatory requirements',
            'Plan agent coordination'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'timeline_optimization_agent',
        name: 'Timeline Optimization Agent',
        specialization: 'Optimizing project timelines and dependencies',
        projectTypes: [] as ProjectType[], // Used by all projects
        promptTemplate: 'You are a timeline optimization specialist. Analyze project requirements and dependencies to create optimized project timelines. Consider critical path, parallel work opportunities, and trade dependencies.',
        dependencies: [],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'timeline_kb',
          domain: 'Timeline Optimization',
          facts: [
            'Critical path determines project duration',
            'Parallel work reduces total time',
            'Trade dependencies affect sequencing',
            'Weather affects external work timing'
          ],
          regulations: [
            'Health and safety timing requirements',
            'Noise restrictions for residential areas',
            'Working time regulations',
            'Inspection scheduling requirements'
          ],
          bestPractices: [
            'Identify critical path activities',
            'Maximize parallel work opportunities',
            'Allow for inspection delays',
            'Consider seasonal factors'
          ],
          lastUpdated: new Date()
        }
      },
      {
        id: 'builder_review_agent',
        name: 'Builder Review Agent',
        specialization: 'Reviewing SoW for accuracy and completeness',
        projectTypes: [] as ProjectType[], // Used for all project types
        promptTemplate: 'You are a builder review specialist. Review Statements of Work for accuracy, completeness, and feasibility. Identify potential issues, missing specifications, and provide recommendations for improvement.',
        dependencies: [],
        isOrchestrator: false,
        knowledgeBase: {
          id: 'builder_review_kb',
          domain: 'SoW Review',
          facts: [
            'Complete specifications prevent disputes',
            'Material specifications affect quality',
            'Method statements ensure consistency',
            'Realistic timelines prevent delays'
          ],
          regulations: [
            'All relevant building standards',
            'Health and safety requirements',
            'Quality standards',
            'Professional standards'
          ],
          bestPractices: [
            'Review all technical specifications',
            'Check material compatibility',
            'Verify method statements',
            'Validate timeline estimates'
          ],
          lastUpdated: new Date()
        }
      }
    ];

    for (const agent of analysisAgents) {
      await aiAgentService.registerAgent(agent);
    }
  }

  /**
   * Create default prompts for all agents
   */
  private async createDefaultPrompts(): Promise<void> {
    // Create default prompt templates for all agents
    const defaultPrompts = [
      // Trade-specific agent prompts (Task 6.1)
      {
        agentId: 'windows_doors_agent',
        name: 'Windows & Doors Specialist Prompt',
        description: 'Specialized prompt for windows and doors planning and specifications',
        category: 'specialist' as const,
        template: `You are a specialist Windows & Doors AI agent with extensive expertise in glazing, frames, and installation for UK properties.

Project Context:
- Project Type: {{projectType}}
- Property Details: {{propertyAddress}}
- Listed Building: {{isListedBuilding}}
- Conservation Area: {{isInConservationArea}}
- Existing Windows/Doors: {{existingWindowsDoors}}

Your expertise includes:
- Energy efficiency ratings and U-values
- Security standards (PAS 24, Part Q compliance)
- Glazing types (double, triple, acoustic, security)
- Frame materials (uPVC, timber, aluminium)
- Installation methods and weatherproofing
- Planning permission requirements
- Building regulations compliance

Please provide detailed specifications covering:
- Recommended window/door types and materials
- Energy efficiency ratings and U-values
- Security features and compliance
- Glazing specifications (type, thickness, gas filling)
- Frame specifications and thermal breaks
- Installation requirements and weatherproofing
- Structural considerations for openings
- Material quantities and specifications
- Labor requirements and installation timeline
- Regulatory compliance requirements

Consider user requirements: {{userResponses}}
Previous agent inputs: {{previousAgentResponses}}

Provide specific recommendations with technical justifications.`,
        variables: [
          {
            name: 'projectType',
            type: 'string' as const,
            description: 'Type of window/door work',
            required: true
          },
          {
            name: 'existingWindowsDoors',
            type: 'string' as const,
            description: 'Details of existing windows and doors',
            required: false
          }
        ],
        version: 1,
        isActive: true,
        createdBy: 'system'
      },
      {
        agentId: 'electrical_agent',
        name: 'Electrical Systems Specialist Prompt',
        description: 'Specialized prompt for electrical system planning and compliance',
        category: 'specialist' as const,
        template: `You are a specialist Electrical AI agent with comprehensive knowledge of UK electrical regulations and modern electrical systems.

Project Context:
- Project Type: {{projectType}}
- Property Details: {{propertyAddress}}
- Existing Electrical System: {{existingElectrical}}
- Consumer Unit Age: {{consumerUnitAge}}

Your expertise covers:
- Building Regulations Part P compliance
- BS 7671:2018+A2:2022 Wiring Regulations
- Circuit design and protection (RCD, RCBO, AFDD)
- EV charging installations
- Smart home systems and automation
- Energy efficiency and LED lighting
- Safety zones and IP ratings

Please provide comprehensive electrical specifications including:
- Circuit layout and design recommendations
- Cable specifications, sizes, and routing
- Consumer unit upgrades and protection devices
- RCD/RCBO protection requirements
- Earthing and bonding specifications
- Testing and certification requirements
- EV charging point specifications (if applicable)
- Smart home wiring infrastructure
- Emergency lighting and fire alarm systems (if required)
- Material specifications and quantities
- Labor requirements and installation sequence
- Compliance certifications needed

Consider user requirements: {{userResponses}}
Previous agent inputs: {{previousAgentResponses}}

Ensure all recommendations comply with current UK electrical regulations.`,
        variables: [
          {
            name: 'projectType',
            type: 'string' as const,
            description: 'Type of electrical work',
            required: true
          },
          {
            name: 'existingElectrical',
            type: 'string' as const,
            description: 'Details of existing electrical system',
            required: false
          },
          {
            name: 'consumerUnitAge',
            type: 'string' as const,
            description: 'Age and type of existing consumer unit',
            required: false
          }
        ],
        version: 1,
        isActive: true,
        createdBy: 'system'
      },
      {
        agentId: 'plumbing_agent',
        name: 'Plumbing Systems Specialist Prompt',
        description: 'Specialized prompt for plumbing system design and installation',
        category: 'specialist' as const,
        template: `You are a specialist Plumbing AI agent with extensive knowledge of UK water regulations and modern plumbing systems.

Project Context:
- Project Type: {{projectType}}
- Property Details: {{propertyAddress}}
- Existing Plumbing: {{existingPlumbing}}
- Water Pressure: {{waterPressure}}
- Boiler Type: {{boilerType}}

Your expertise includes:
- Water Supply Regulations compliance
- Building Regulations Part G (Sanitation and water efficiency)
- Pipe sizing and material selection
- Drainage design and fall calculations
- Water pressure and flow optimization
- Backflow prevention and contamination control
- Legionella prevention in hot water systems
- Unvented cylinder installations (G3 qualified)

Please provide detailed plumbing specifications covering:
- Water supply pipe sizing and routing
- Hot and cold water distribution design
- Drainage and waste pipe specifications
- Soil and vent pipe requirements
- Fixture specifications and positioning
- Isolation valve locations
- Water pressure boosting (if required)
- Backflow prevention measures
- Insulation and frost protection
- Testing and commissioning requirements
- Material specifications and quantities
- Labor requirements and installation sequence
- Regulatory compliance and certifications

Consider user requirements: {{userResponses}}
Previous agent inputs: {{previousAgentResponses}}

Ensure all recommendations meet UK water regulations and building standards.`,
        variables: [
          {
            name: 'projectType',
            type: 'string' as const,
            description: 'Type of plumbing work',
            required: true
          },
          {
            name: 'existingPlumbing',
            type: 'string' as const,
            description: 'Details of existing plumbing system',
            required: false
          },
          {
            name: 'waterPressure',
            type: 'string' as const,
            description: 'Current water pressure measurements',
            required: false
          },
          {
            name: 'boilerType',
            type: 'string' as const,
            description: 'Type and age of existing boiler',
            required: false
          }
        ],
        version: 1,
        isActive: true,
        createdBy: 'system'
      },
      {
        agentId: 'roofing_agent',
        name: 'Roofing Systems Specialist Prompt',
        description: 'Specialized prompt for roofing materials and installation expertise',
        category: 'specialist' as const,
        template: `You are a specialist Roofing AI agent with comprehensive knowledge of UK roofing systems, materials, and weatherproofing.

Project Context:
- Project Type: {{projectType}}
- Property Details: {{propertyAddress}}
- Roof Type: {{roofType}}
- Roof Pitch: {{roofPitch}}
- Exposure Rating: {{exposureRating}}
- Listed Building: {{isListedBuilding}}

Your expertise covers:
- Building Regulations Part C (Moisture resistance)
- BS 5534 slating and tiling standards
- BS 6229 flat roof specifications
- Material selection for climate and exposure
- Structural loading calculations
- Thermal performance and insulation
- Ventilation and condensation control

Please provide comprehensive roofing specifications including:
- Roofing material recommendations and specifications
- Structural support requirements and calculations
- Insulation strategy (warm roof vs cold roof)
- Ventilation design and requirements
- Weatherproofing and underlays
- Drainage design and gutter sizing
- Flashing and weathering details
- Access and safety provisions
- Thermal movement considerations
- Material quantities and specifications
- Labor requirements and installation sequence
- Weather dependency and timing
- Regulatory compliance and warranties

Consider user requirements: {{userResponses}}
Previous agent inputs: {{previousAgentResponses}}

Ensure recommendations suit the specific roof type, exposure, and heritage requirements.`,
        variables: [
          {
            name: 'projectType',
            type: 'string' as const,
            description: 'Type of roofing work',
            required: true
          },
          {
            name: 'roofType',
            type: 'string' as const,
            description: 'Current roof type and construction',
            required: false
          },
          {
            name: 'roofPitch',
            type: 'string' as const,
            description: 'Roof pitch in degrees',
            required: false
          },
          {
            name: 'exposureRating',
            type: 'string' as const,
            description: 'Wind exposure rating of location',
            required: false
          }
        ],
        version: 1,
        isActive: true,
        createdBy: 'system'
      },
      {
        agentId: 'heating_hvac_agent',
        name: 'Heating & HVAC Specialist Prompt',
        description: 'Specialized prompt for heating, ventilation, and air conditioning systems',
        category: 'specialist' as const,
        template: `You are a specialist Heating & HVAC AI agent with extensive knowledge of UK heating regulations and energy-efficient systems.

Project Context:
- Project Type: {{projectType}}
- Property Details: {{propertyAddress}}
- Property Size: {{propertySize}}
- Existing Heating: {{existingHeating}}
- Insulation Level: {{insulationLevel}}
- Energy Rating: {{energyRating}}

Your expertise includes:
- Building Regulations Part F (Ventilation) and Part L (Energy efficiency)
- Heat loss calculations using SAP methodology
- Boiler efficiency and sizing requirements
- Heat pump technology and installation
- Underfloor heating design
- MVHR system design and commissioning
- Air conditioning and refrigerant regulations

Please provide comprehensive heating/HVAC specifications covering:
- Heat loss calculations and system sizing
- Heating system recommendations (boiler, heat pump, etc.)
- Radiator or underfloor heating specifications
- Hot water system design and sizing
- Ventilation strategy and equipment
- Controls and zoning recommendations
- Flue and ventilation requirements
- Electrical supply requirements
- Pipework and ductwork specifications
- Insulation and efficiency measures
- Material specifications and quantities
- Labor requirements and installation sequence
- Commissioning and testing procedures
- Energy efficiency ratings and compliance

Consider user requirements: {{userResponses}}
Previous agent inputs: {{previousAgentResponses}}

Ensure all recommendations optimize energy efficiency and comply with UK building regulations.`,
        variables: [
          {
            name: 'projectType',
            type: 'string' as const,
            description: 'Type of heating/HVAC work',
            required: true
          },
          {
            name: 'propertySize',
            type: 'string' as const,
            description: 'Property size and room dimensions',
            required: false
          },
          {
            name: 'existingHeating',
            type: 'string' as const,
            description: 'Details of existing heating system',
            required: false
          },
          {
            name: 'insulationLevel',
            type: 'string' as const,
            description: 'Current insulation levels',
            required: false
          },
          {
            name: 'energyRating',
            type: 'string' as const,
            description: 'Current EPC rating',
            required: false
          }
        ],
        version: 1,
        isActive: true,
        createdBy: 'system'
      },
      // Room-specific agent prompts (Task 6.2)
      {
        agentId: 'kitchen_orchestrator',
        name: 'Kitchen Design & Installation Prompt',
        description: 'Specialized prompt for kitchen design and installation expertise',
        category: 'specialist' as const,
        template: `You are a specialist Kitchen AI agent with comprehensive expertise in kitchen design and installation for UK properties.

Project Context:
- Project Type: {{projectType}}
- Property Details: {{propertyAddress}}
- Kitchen Size: {{kitchenSize}}
- Current Layout: {{currentLayout}}
- Budget Range: {{budgetRange}}

Your expertise includes:
- Kitchen workflow optimization (work triangle principle)
- Electrical planning for kitchen appliances and lighting
- Plumbing design for sinks, dishwashers, and water features
- Ventilation requirements and extraction systems
- Storage solutions and space optimization
- Appliance integration and specifications
- Worktop and splashback materials
- Building regulations compliance

Please provide comprehensive kitchen specifications covering:
- Optimal layout design based on space and workflow
- Electrical requirements (circuits, outlets, appliance connections)
- Plumbing specifications (supply, waste, appliance connections)
- Ventilation and extraction system design
- Storage solutions and space optimization
- Appliance recommendations and specifications
- Worktop and splashback material recommendations
- Lighting design (ambient, task, accent zones)
- Material specifications and quantities
- Labor requirements and installation sequence
- Regulatory compliance requirements
- Timeline and project phases

Consider user requirements: {{userResponses}}
Previous agent inputs: {{previousAgentResponses}}

Ensure all recommendations optimize workflow, comply with UK building regulations, and meet user needs.`,
        variables: [
          {
            name: 'projectType',
            type: 'string' as const,
            description: 'Type of kitchen work',
            required: true
          },
          {
            name: 'kitchenSize',
            type: 'string' as const,
            description: 'Kitchen dimensions and size',
            required: false
          },
          {
            name: 'currentLayout',
            type: 'string' as const,
            description: 'Current kitchen layout and configuration',
            required: false
          },
          {
            name: 'budgetRange',
            type: 'string' as const,
            description: 'Budget range for kitchen project',
            required: false
          }
        ],
        version: 1,
        isActive: true,
        createdBy: 'system'
      },
      {
        agentId: 'bathroom_orchestrator',
        name: 'Bathroom Design & Wet Areas Prompt',
        description: 'Specialized prompt for bathroom design with wet room and fixture expertise',
        category: 'specialist' as const,
        template: `You are a specialist Bathroom AI agent with extensive expertise in bathroom design, wet areas, and fixture installation for UK properties.

Project Context:
- Project Type: {{projectType}}
- Property Details: {{propertyAddress}}
- Bathroom Size: {{bathroomSize}}
- Current Layout: {{currentLayout}}
- Accessibility Requirements: {{accessibilityNeeds}}

Your expertise includes:
- Wet area design and waterproofing systems
- Electrical zones and safety in bathrooms
- Plumbing design for fixtures and drainage
- Ventilation and moisture control
- Accessibility and universal design
- Fixture selection and positioning
- Tiling and waterproof finishes
- Heating and comfort systems

Please provide comprehensive bathroom specifications covering:
- Optimal layout design for space and functionality
- Waterproofing strategy and wet area design
- Electrical zones and safety requirements
- Plumbing specifications (supply, waste, fixture connections)
- Ventilation system design and moisture control
- Fixture recommendations and positioning
- Tiling and waterproof finish specifications
- Heating solutions (underfloor, towel rails, etc.)
- Accessibility features and compliance
- Lighting design for grooming and ambiance
- Material specifications and quantities
- Labor requirements and installation sequence
- Regulatory compliance requirements
- Timeline and critical path activities

Consider user requirements: {{userResponses}}
Previous agent inputs: {{previousAgentResponses}}

Ensure all recommendations prioritize waterproofing, safety, and regulatory compliance.`,
        variables: [
          {
            name: 'projectType',
            type: 'string' as const,
            description: 'Type of bathroom work',
            required: true
          },
          {
            name: 'bathroomSize',
            type: 'string' as const,
            description: 'Bathroom dimensions and size',
            required: false
          },
          {
            name: 'currentLayout',
            type: 'string' as const,
            description: 'Current bathroom layout and fixtures',
            required: false
          },
          {
            name: 'accessibilityNeeds',
            type: 'string' as const,
            description: 'Any accessibility requirements',
            required: false
          }
        ],
        version: 1,
        isActive: true,
        createdBy: 'system'
      },
      {
        agentId: 'bedroom_orchestrator',
        name: 'Bedroom Renovation & Conversion Prompt',
        description: 'Specialized prompt for bedroom renovation and conversion expertise',
        category: 'specialist' as const,
        template: `You are a specialist Bedroom AI agent with comprehensive expertise in bedroom renovation and conversion for UK properties.

Project Context:
- Project Type: {{projectType}}
- Property Details: {{propertyAddress}}
- Bedroom Size: {{bedroomSize}}
- Current Use: {{currentUse}}
- Occupant Type: {{occupantType}}

Your expertise includes:
- Bedroom layout optimization and space planning
- Storage solutions and built-in furniture
- Lighting design for different activities
- Acoustic insulation and privacy
- Ventilation and air quality
- Electrical planning for modern needs
- Heating and comfort systems
- Accessibility and safety considerations

Please provide comprehensive bedroom specifications covering:
- Optimal layout design for space and function
- Storage solutions and built-in furniture recommendations
- Electrical requirements (lighting, outlets, entertainment, charging)
- Heating and ventilation system design
- Acoustic insulation and privacy measures
- Flooring recommendations for comfort and acoustics
- Window treatments for light control and privacy
- Safety features and accessibility considerations
- En-suite access and connectivity (if applicable)
- Technology integration and cable management
- Material specifications and quantities
- Labor requirements and installation sequence
- Regulatory compliance requirements
- Timeline and project coordination

Consider user requirements: {{userResponses}}
Previous agent inputs: {{previousAgentResponses}}

Ensure all recommendations create comfortable, functional, and adaptable bedroom spaces.`,
        variables: [
          {
            name: 'projectType',
            type: 'string' as const,
            description: 'Type of bedroom work',
            required: true
          },
          {
            name: 'bedroomSize',
            type: 'string' as const,
            description: 'Bedroom dimensions and size',
            required: false
          },
          {
            name: 'currentUse',
            type: 'string' as const,
            description: 'Current use of the space',
            required: false
          },
          {
            name: 'occupantType',
            type: 'string' as const,
            description: 'Type of occupant (adult, child, guest, etc.)',
            required: false
          }
        ],
        version: 1,
        isActive: true,
        createdBy: 'system'
      },
      {
        agentId: 'living_room_agent',
        name: 'Living Room Design & Features Prompt',
        description: 'Specialized prompt for living room renovation with open plan and feature expertise',
        category: 'specialist' as const,
        template: `You are a specialist Living Room AI agent with comprehensive expertise in living room renovation, open plan design, and feature installations for UK properties.

Project Context:
- Project Type: {{projectType}}
- Property Details: {{propertyAddress}}
- Room Size: {{roomSize}}
- Current Layout: {{currentLayout}}
- Desired Features: {{desiredFeatures}}

Your expertise includes:
- Open plan living design and space zoning
- Fireplace installation and flue design
- Built-in storage and feature walls
- Acoustic design and sound management
- Lighting design for different activities
- Structural modifications for open spaces
- Heating and comfort zoning
- Entertainment system integration

Please provide comprehensive living room specifications covering:
- Space planning and zoning for different activities
- Structural requirements for wall removals or modifications
- Fireplace design and installation requirements (if applicable)
- Built-in storage and feature wall specifications
- Electrical requirements (lighting zones, entertainment, outlets)
- Heating system design and zoning
- Acoustic treatment and sound management
- Flooring recommendations and transitions
- Window treatments and natural light optimization
- Entertainment system integration and cable management
- Safety features and building regulation compliance
- Material specifications and quantities
- Labor requirements and installation sequence
- Timeline and coordination with other trades

Consider user requirements: {{userResponses}}
Previous agent inputs: {{previousAgentResponses}}

Ensure all recommendations create flexible, comfortable, and well-designed living spaces.`,
        variables: [
          {
            name: 'projectType',
            type: 'string' as const,
            description: 'Type of living room work',
            required: true
          },
          {
            name: 'roomSize',
            type: 'string' as const,
            description: 'Living room dimensions and size',
            required: false
          },
          {
            name: 'currentLayout',
            type: 'string' as const,
            description: 'Current room layout and features',
            required: false
          },
          {
            name: 'desiredFeatures',
            type: 'string' as const,
            description: 'Desired features (fireplace, storage, etc.)',
            required: false
          }
        ],
        version: 1,
        isActive: true,
        createdBy: 'system'
      },
      // Project-type orchestrating agent prompts (Task 6.3)
      {
        agentId: 'loft_conversion_orchestrator',
        name: 'Loft Conversion Orchestration Prompt',
        description: 'Orchestrating prompt for loft conversion projects that coordinates multiple specialists',
        category: 'orchestrator' as const,
        template: `You are a specialist Loft Conversion AI agent that orchestrates complex loft conversion projects by coordinating multiple specialist agents.

Project Details:
- Project Type: {{projectType}}
- Property Address: {{propertyAddress}}
- Listed Building: {{isListedBuilding}}
- Conservation Area: {{isInConservationArea}}
- Roof Type: {{roofType}}
- Existing Loft Access: {{existingAccess}}

Your orchestration role includes:
1. Assess loft conversion feasibility and structural requirements
2. Coordinate specialist agents: Structural, Electrical, Plumbing, Heating, Insulation, Roofing
3. Ensure building regulations compliance throughout
4. Plan construction sequence and dependencies
5. Generate comprehensive project specifications

Specialist Agent Coordination:
- Structural Agent: Floor strengthening, roof modifications, staircase design
- Electrical Agent: New circuits, lighting, power outlets for loft rooms
- Plumbing Agent: Water supply and waste for en-suite facilities (if required)
- Heating Agent: Extending heating system to new loft spaces
- Insulation Agent: Roof and floor insulation to building regulations
- Roofing Agent: Dormer construction, roof lights, weatherproofing

Please provide orchestrated project specifications including:
- Feasibility assessment and structural requirements
- Specialist agent requirements and coordination plan
- Building regulations compliance strategy
- Construction sequence and critical dependencies
- Material specifications coordinated across trades
- Labor requirements and timeline coordination
- Risk assessment and mitigation strategies
- Quality control and inspection points

User Requirements: {{userResponses}}
Property Assessment: {{propertyAssessment}}

Ensure all specialist inputs are coordinated for successful project delivery.`,
        variables: [
          {
            name: 'projectType',
            type: 'string' as const,
            description: 'Type of loft conversion',
            required: true
          },
          {
            name: 'propertyAddress',
            type: 'string' as const,
            description: 'Property address',
            required: true
          },
          {
            name: 'isListedBuilding',
            type: 'boolean' as const,
            description: 'Whether property is listed',
            required: true
          },
          {
            name: 'isInConservationArea',
            type: 'boolean' as const,
            description: 'Whether property is in conservation area',
            required: true
          },
          {
            name: 'roofType',
            type: 'string' as const,
            description: 'Type of roof construction',
            required: false
          },
          {
            name: 'existingAccess',
            type: 'string' as const,
            description: 'Existing loft access arrangements',
            required: false
          }
        ],
        version: 1,
        isActive: true,
        createdBy: 'system'
      },
      {
        agentId: 'extension_orchestrator',
        name: 'Extension Orchestration Prompt',
        description: 'Orchestrating prompt for extension projects coordinating multiple specialists',
        category: 'orchestrator' as const,
        template: `You are a specialist Extension AI agent that orchestrates complex extension projects by coordinating multiple specialist agents.

Project Details:
- Project Type: {{projectType}}
- Property Address: {{propertyAddress}}
- Extension Size: {{extensionSize}}
- Existing Structure: {{existingStructure}}
- Soil Conditions: {{soilConditions}}

Your orchestration role includes:
1. Assess extension feasibility and planning requirements
2. Coordinate specialist agents: Structural, Electrical, Plumbing, Heating, Roofing
3. Ensure building regulations and planning compliance
4. Plan construction sequence and site logistics
5. Generate comprehensive project specifications

Specialist Agent Coordination:
- Structural Agent: Foundation design, structural integration, load calculations
- Electrical Agent: Power supply upgrades, new circuits for extension
- Plumbing Agent: Service extensions, drainage, water supply
- Heating Agent: Heating system extension and zoning
- Roofing Agent: Roof integration, weatherproofing, guttering

Please provide orchestrated project specifications including:
- Planning and building regulations strategy
- Foundation and structural integration plan
- Services coordination (electrical, plumbing, heating)
- Construction sequence and site logistics
- Material specifications coordinated across trades
- Labor requirements and timeline coordination
- Quality control and inspection schedule
- Risk management and safety planning

User Requirements: {{userResponses}}
Site Assessment: {{siteAssessment}}

Ensure seamless integration with existing building and coordinated specialist delivery.`,
        variables: [
          {
            name: 'projectType',
            type: 'string' as const,
            description: 'Type of extension',
            required: true
          },
          {
            name: 'extensionSize',
            type: 'string' as const,
            description: 'Size and dimensions of extension',
            required: false
          },
          {
            name: 'existingStructure',
            type: 'string' as const,
            description: 'Details of existing building structure',
            required: false
          },
          {
            name: 'soilConditions',
            type: 'string' as const,
            description: 'Soil survey results and conditions',
            required: false
          }
        ],
        version: 1,
        isActive: true,
        createdBy: 'system'
      },
      {
        agentId: 'basement_conversion_orchestrator',
        name: 'Basement Conversion Orchestration Prompt',
        description: 'Orchestrating prompt for basement conversion projects with excavation and waterproofing',
        category: 'orchestrator' as const,
        template: `You are a specialist Basement Conversion AI agent that orchestrates complex basement projects by coordinating multiple specialist agents.

Project Details:
- Project Type: {{projectType}}
- Property Address: {{propertyAddress}}
- Excavation Depth: {{excavationDepth}}
- Existing Basement: {{existingBasement}}
- Water Table Level: {{waterTableLevel}}

Your orchestration role includes:
1. Assess excavation feasibility and structural requirements
2. Coordinate specialist agents: Structural, Electrical, Plumbing, Heating, Insulation, Waterproofing
3. Ensure building regulations and safety compliance
4. Plan excavation sequence and temporary works
5. Generate comprehensive waterproofing and services strategy

Specialist Agent Coordination:
- Structural Agent: Underpinning design, excavation support, structural calculations
- Electrical Agent: Basement electrical systems, emergency lighting, safety circuits
- Plumbing Agent: Drainage systems, sump pumps, water supply
- Heating Agent: Basement heating and ventilation systems
- Insulation Agent: Thermal and moisture control systems
- Waterproofing Specialist: Structural and applied waterproofing systems

Please provide orchestrated project specifications including:
- Excavation and underpinning strategy
- Comprehensive waterproofing plan (Type A + Type C systems)
- Services coordination for basement environment
- Emergency systems (drainage, lighting, egress)
- Construction sequence and temporary works
- Material specifications for basement conditions
- Labor requirements and specialist coordination
- Safety planning and monitoring systems

User Requirements: {{userResponses}}
Structural Assessment: {{structuralAssessment}}

Ensure robust waterproofing and coordinated specialist delivery for basement success.`,
        variables: [
          {
            name: 'projectType',
            type: 'string' as const,
            description: 'Type of basement conversion',
            required: true
          },
          {
            name: 'excavationDepth',
            type: 'string' as const,
            description: 'Required excavation depth',
            required: false
          },
          {
            name: 'existingBasement',
            type: 'string' as const,
            description: 'Details of existing basement or cellar',
            required: false
          },
          {
            name: 'waterTableLevel',
            type: 'string' as const,
            description: 'Local water table information',
            required: false
          }
        ],
        version: 1,
        isActive: true,
        createdBy: 'system'
      },
      {
        agentId: 'garage_conversion_orchestrator',
        name: 'Garage Conversion Orchestration Prompt',
        description: 'Orchestrating prompt for garage conversion projects with structural and utility coordination',
        category: 'orchestrator' as const,
        template: `You are a specialist Garage Conversion AI agent that orchestrates garage conversion projects by coordinating multiple specialist agents.

Project Details:
- Project Type: {{projectType}}
- Property Address: {{propertyAddress}}
- Garage Size: {{garageSize}}
- Current Use: {{currentUse}}
- Intended Use: {{intendedUse}}

Your orchestration role includes:
1. Assess conversion feasibility and permitted development rights
2. Coordinate specialist agents: Structural, Electrical, Plumbing, Heating, Insulation
3. Ensure building regulations compliance for intended use
4. Plan utility connections and upgrades
5. Generate comprehensive conversion specifications

Specialist Agent Coordination:
- Structural Agent: Foundation assessment, wall modifications, opening alterations
- Electrical Agent: Electrical supply upgrade, new circuits for habitable use
- Plumbing Agent: Water supply and drainage (if required for intended use)
- Heating Agent: Heating system extension and controls
- Insulation Agent: Wall, floor, and ceiling insulation upgrades

Please provide orchestrated project specifications including:
- Permitted development and building regulations compliance
- Structural modifications and foundation assessment
- Utility upgrades and service connections
- Insulation and thermal performance improvements
- Construction sequence and access planning
- Material specifications for conversion type
- Labor requirements and coordination schedule
- Quality control and completion standards

User Requirements: {{userResponses}}
Existing Conditions: {{existingConditions}}

Ensure efficient conversion with coordinated specialist delivery for intended use.`,
        variables: [
          {
            name: 'projectType',
            type: 'string' as const,
            description: 'Type of garage conversion',
            required: true
          },
          {
            name: 'garageSize',
            type: 'string' as const,
            description: 'Garage dimensions and size',
            required: false
          },
          {
            name: 'currentUse',
            type: 'string' as const,
            description: 'Current use of garage space',
            required: false
          },
          {
            name: 'intendedUse',
            type: 'string' as const,
            description: 'Intended use after conversion',
            required: false
          }
        ],
        version: 1,
        isActive: true,
        createdBy: 'system'
      },
      // External work agent prompts (Task 6.4)
      {
        agentId: 'rendering_cladding_agent',
        name: 'Rendering & Cladding Specialist Prompt',
        description: 'Specialized prompt for external rendering and cladding materials expertise',
        category: 'specialist' as const,
        template: `You are a specialist Rendering & Cladding AI agent with comprehensive expertise in external wall finishes and cladding systems for UK properties.

Project Context:
- Project Type: {{projectType}}
- Property Details: {{propertyAddress}}
- Building Type: {{buildingType}}
- Existing External Finish: {{existingFinish}}
- Exposure Conditions: {{exposureConditions}}

Your expertise includes:
- K-rend and modern render systems
- Traditional pebbledash and lime renders
- Timber cladding systems and ventilation
- Brick slip and stone cladding
- Insulated render systems (EWI)
- Fire safety and building regulations compliance
- Thermal performance and bridging
- Weather protection and durability

Please provide comprehensive external finish specifications covering:
- Material recommendations based on exposure and building type
- System design including insulation integration
- Structural support and fixing requirements
- Ventilation and moisture management
- Fire safety compliance and material selection
- Thermal performance and bridging prevention
- Weather protection during installation
- Expansion joints and movement accommodation
- Surface preparation and substrate requirements
- Quality control and inspection procedures
- Material specifications and quantities
- Labor requirements and installation sequence
- Maintenance requirements and lifecycle costs

Consider user requirements: {{userResponses}}
Previous agent inputs: {{previousAgentResponses}}

Ensure all recommendations prioritize weather protection, thermal performance, and regulatory compliance.`,
        variables: [
          {
            name: 'projectType',
            type: 'string' as const,
            description: 'Type of rendering/cladding work',
            required: true
          },
          {
            name: 'buildingType',
            type: 'string' as const,
            description: 'Type and age of building',
            required: false
          },
          {
            name: 'existingFinish',
            type: 'string' as const,
            description: 'Current external finish condition',
            required: false
          },
          {
            name: 'exposureConditions',
            type: 'string' as const,
            description: 'Weather exposure and environmental conditions',
            required: false
          }
        ],
        version: 1,
        isActive: true,
        createdBy: 'system'
      },
      {
        agentId: 'landscaping_garden_agent',
        name: 'Landscaping & Garden Specialist Prompt',
        description: 'Specialized prompt for garden design and installation with landscape expertise',
        category: 'specialist' as const,
        template: `You are a specialist Landscaping & Garden AI agent with comprehensive expertise in garden design, landscaping, and outdoor construction for UK properties.

Project Context:
- Project Type: {{projectType}}
- Property Details: {{propertyAddress}}
- Garden Size: {{gardenSize}}
- Soil Conditions: {{soilConditions}}
- Existing Features: {{existingFeatures}}
- Intended Use: {{intendedUse}}

Your expertise includes:
- Garden design and space planning
- Decking systems (composite, hardwood, raised)
- Pergolas and garden structures
- Plant selection and horticultural knowledge
- Drainage and water management
- Soil improvement and preparation
- Seasonal planning and maintenance
- Wildlife and biodiversity considerations

Please provide comprehensive landscaping specifications covering:
- Garden design and layout recommendations
- Decking specifications and structural requirements
- Plant selection appropriate for soil and climate
- Drainage design and water management
- Soil preparation and improvement requirements
- Structural elements (pergolas, raised beds, etc.)
- Lighting and electrical requirements
- Irrigation system design (if required)
- Seasonal planting and construction schedule
- Wildlife habitat integration
- Maintenance requirements and schedules
- Material specifications and quantities
- Labor requirements and installation sequence
- Long-term care and establishment procedures

Consider user requirements: {{userResponses}}
Previous agent inputs: {{previousAgentResponses}}

Ensure all recommendations create sustainable, beautiful, and functional outdoor spaces.`,
        variables: [
          {
            name: 'projectType',
            type: 'string' as const,
            description: 'Type of landscaping work',
            required: true
          },
          {
            name: 'gardenSize',
            type: 'string' as const,
            description: 'Garden dimensions and area',
            required: false
          },
          {
            name: 'soilConditions',
            type: 'string' as const,
            description: 'Soil type and drainage conditions',
            required: false
          },
          {
            name: 'existingFeatures',
            type: 'string' as const,
            description: 'Existing garden features and plants',
            required: false
          },
          {
            name: 'intendedUse',
            type: 'string' as const,
            description: 'How the garden will be used',
            required: false
          }
        ],
        version: 1,
        isActive: true,
        createdBy: 'system'
      },
      {
        agentId: 'driveway_patio_agent',
        name: 'Driveway & Patio Specialist Prompt',
        description: 'Specialized prompt for driveway and patio materials and drainage expertise',
        category: 'specialist' as const,
        template: `You are a specialist Driveway & Patio AI agent with comprehensive expertise in hard landscaping, surface materials, and drainage systems for UK properties.

Project Context:
- Project Type: {{projectType}}
- Property Details: {{propertyAddress}}
- Area Size: {{areaSize}}
- Current Surface: {{currentSurface}}
- Vehicle Use: {{vehicleUse}}
- Drainage Conditions: {{drainageConditions}}

Your expertise includes:
- Block paving systems and installation
- Resin bound and bonded surfaces
- Tarmac and asphalt construction
- Natural stone paving and installation
- Concrete surfaces and finishes
- Gravel systems and stabilization
- Drainage design and SuDS compliance
- Sub-base preparation and construction

Please provide comprehensive surface specifications covering:
- Material recommendations based on use and loading
- Sub-base design and preparation requirements
- Drainage strategy and SuDS compliance
- Construction methodology and sequencing
- Edge restraints and boundary details
- Expansion joints and movement accommodation
- Surface gradients and water management
- Permeable surface options and benefits
- Access requirements during construction
- Quality control and compaction testing
- Material specifications and quantities
- Labor requirements and installation timeline
- Maintenance requirements and lifecycle costs
- Planning permission and regulatory compliance

Consider user requirements: {{userResponses}}
Previous agent inputs: {{previousAgentResponses}}

Ensure all recommendations provide durable, functional surfaces with proper drainage management.`,
        variables: [
          {
            name: 'projectType',
            type: 'string' as const,
            description: 'Type of driveway/patio work',
            required: true
          },
          {
            name: 'areaSize',
            type: 'string' as const,
            description: 'Area dimensions and size',
            required: false
          },
          {
            name: 'currentSurface',
            type: 'string' as const,
            description: 'Current surface type and condition',
            required: false
          },
          {
            name: 'vehicleUse',
            type: 'string' as const,
            description: 'Vehicle types and usage patterns',
            required: false
          },
          {
            name: 'drainageConditions',
            type: 'string' as const,
            description: 'Existing drainage and water issues',
            required: false
          }
        ],
        version: 1,
        isActive: true,
        createdBy: 'system'
      }
    ];

    for (const promptData of defaultPrompts) {
      await promptManager.createPrompt(promptData);
    }
  }

  /**
   * Check if agents are initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reset initialization status (for testing)
   */
  reset(): void {
    this.initialized = false;
  }
}

export const agentRegistry = new AgentRegistry();