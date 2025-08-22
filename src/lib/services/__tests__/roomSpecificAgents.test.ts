import { agentRegistry } from '../agentRegistry';
import { aiAgentService } from '../aiAgentService';
import { ProjectType } from '../../types';

// Mock the aiAgentService
jest.mock('../aiAgentService');
jest.mock('../promptManager');

describe('Room-Specific AI Agents (Task 6.2)', () => {
  beforeEach(async () => {
    // Reset the registry before each test
    agentRegistry.reset();
    jest.clearAllMocks();
  });

  describe('Agent Registration', () => {
    it('should register all room-specific agents during initialization', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      // Verify that room-specific agents are registered
      const expectedRoomAgents = [
        'kitchen_orchestrator',
        'bathroom_orchestrator', 
        'bedroom_orchestrator',
        'living_room_agent'
      ];

      const registeredAgents = registerAgentSpy.mock.calls.map(call => call[0].id);
      
      expectedRoomAgents.forEach(agentId => {
        expect(registeredAgents).toContain(agentId);
      });
    });

    it('should register Kitchen AI Agent with design and installation expertise', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      const kitchenAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'kitchen_orchestrator'
      )?.[0];

      expect(kitchenAgent).toBeDefined();
      expect(kitchenAgent?.name).toBe('Kitchen AI Agent');
      expect(kitchenAgent?.specialization).toContain('design');
      expect(kitchenAgent?.specialization).toContain('installation');
      expect(kitchenAgent?.isOrchestrator).toBe(true);
      expect(kitchenAgent?.projectTypes).toContain('kitchen_full_refit' as ProjectType);
      expect(kitchenAgent?.projectTypes).toContain('kitchen_island_installation' as ProjectType);
    });

    it('should register Bathroom AI Agent with wet room and fixture expertise', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      const bathroomAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'bathroom_orchestrator'
      )?.[0];

      expect(bathroomAgent).toBeDefined();
      expect(bathroomAgent?.name).toBe('Bathroom AI Agent');
      expect(bathroomAgent?.specialization).toContain('wet room');
      expect(bathroomAgent?.specialization).toContain('fixture');
      expect(bathroomAgent?.isOrchestrator).toBe(true);
      expect(bathroomAgent?.projectTypes).toContain('bathroom_full_refit' as ProjectType);
      expect(bathroomAgent?.projectTypes).toContain('bathroom_wet_room' as ProjectType);
    });

    it('should register Bedroom AI Agent with renovation and conversion expertise', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      const bedroomAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'bedroom_orchestrator'
      )?.[0];

      expect(bedroomAgent).toBeDefined();
      expect(bedroomAgent?.name).toBe('Bedroom AI Agent');
      expect(bedroomAgent?.specialization).toContain('renovation');
      expect(bedroomAgent?.specialization).toContain('conversion');
      expect(bedroomAgent?.isOrchestrator).toBe(true);
      expect(bedroomAgent?.projectTypes).toContain('bedroom_master' as ProjectType);
      expect(bedroomAgent?.projectTypes).toContain('bedroom_nursery' as ProjectType);
    });

    it('should register Living Room AI Agent with open plan and feature expertise', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      const livingRoomAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'living_room_agent'
      )?.[0];

      expect(livingRoomAgent).toBeDefined();
      expect(livingRoomAgent?.name).toBe('Living Room AI Agent');
      expect(livingRoomAgent?.specialization).toContain('open plan');
      expect(livingRoomAgent?.specialization).toContain('feature');
      expect(livingRoomAgent?.isOrchestrator).toBe(true);
      expect(livingRoomAgent?.projectTypes).toContain('living_room_open_plan' as ProjectType);
      expect(livingRoomAgent?.projectTypes).toContain('living_room_fireplace' as ProjectType);
    });
  });

  describe('Knowledge Base Content', () => {
    beforeEach(async () => {
      await agentRegistry.initializeAgents();
    });

    it('should have comprehensive kitchen design knowledge', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const kitchenAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'kitchen_orchestrator'
      )?.[0];

      expect(kitchenAgent?.knowledgeBase.facts).toContain('Kitchen triangle principle optimizes workflow between sink, hob, and fridge');
      expect(kitchenAgent?.knowledgeBase.facts).toContain('Kitchen islands need minimum 1200mm circulation space around them');
      expect(kitchenAgent?.knowledgeBase.regulations).toContain('Building Regulations Part P (Electrical safety in kitchens)');
      expect(kitchenAgent?.knowledgeBase.regulations).toContain('Building Regulations Part F (Ventilation) - mechanical extract required');
      expect(kitchenAgent?.knowledgeBase.bestPractices).toContain('Plan electrical points before tiling - include appliance circuits');
    });

    it('should have detailed bathroom and wet area knowledge', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const bathroomAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'bathroom_orchestrator'
      )?.[0];

      expect(bathroomAgent?.knowledgeBase.facts).toContain('Waterproofing is critical in wet areas - tanking required behind baths and showers');
      expect(bathroomAgent?.knowledgeBase.facts).toContain('Electrical zones have specific IP ratings - Zone 0: IPX7, Zone 1: IPX4, Zone 2: IPX4');
      expect(bathroomAgent?.knowledgeBase.regulations).toContain('Building Regulations Part P (Electrical zones in bathrooms)');
      expect(bathroomAgent?.knowledgeBase.bestPractices).toContain('Install proper waterproof membrane behind all wet areas');
    });

    it('should have comprehensive bedroom renovation knowledge', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const bedroomAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'bedroom_orchestrator'
      )?.[0];

      expect(bedroomAgent?.knowledgeBase.facts).toContain('Natural light and ventilation are essential for healthy sleep environments');
      expect(bedroomAgent?.knowledgeBase.facts).toContain('Built-in wardrobes can increase usable floor space by 15-20%');
      expect(bedroomAgent?.knowledgeBase.regulations).toContain('Building Regulations Part F (Ventilation) - minimum 8.4 l/s per person');
      expect(bedroomAgent?.knowledgeBase.bestPractices).toContain('Plan lighting zones: ambient, task, accent, and night lighting');
    });

    it('should have living room and open plan expertise', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const livingRoomAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'living_room_agent'
      )?.[0];

      expect(livingRoomAgent?.knowledgeBase.facts).toContain('Open plan living requires careful zoning for different activities');
      expect(livingRoomAgent?.knowledgeBase.facts).toContain('Fireplace installations need proper flue design and safety clearances');
      expect(livingRoomAgent?.knowledgeBase.regulations).toContain('Building Regulations Part A (Structure) for wall removals');
      expect(livingRoomAgent?.knowledgeBase.bestPractices).toContain('Create distinct zones for different activities (seating, dining, entertainment)');
    });
  });

  describe('Project Type Coverage', () => {
    beforeEach(async () => {
      await agentRegistry.initializeAgents();
    });

    it('should cover all kitchen project types', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const kitchenAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'kitchen_orchestrator'
      )?.[0];

      const expectedKitchenTypes: ProjectType[] = [
        'kitchen_full_refit',
        'kitchen_partial_upgrade',
        'kitchen_island_installation',
        'kitchen_galley',
        'kitchen_l_shaped',
        'kitchen_u_shaped',
        'kitchen_bespoke_design'
      ];

      expectedKitchenTypes.forEach(type => {
        expect(kitchenAgent?.projectTypes).toContain(type);
      });
    });

    it('should cover all bathroom project types', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const bathroomAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'bathroom_orchestrator'
      )?.[0];

      const expectedBathroomTypes: ProjectType[] = [
        'bathroom_full_refit',
        'bathroom_shower_room',
        'bathroom_ensuite',
        'bathroom_downstairs_wc',
        'bathroom_wet_room',
        'bathroom_family',
        'bathroom_luxury_suite'
      ];

      expectedBathroomTypes.forEach(type => {
        expect(bathroomAgent?.projectTypes).toContain(type);
      });
    });

    it('should cover all bedroom project types', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const bedroomAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'bedroom_orchestrator'
      )?.[0];

      const expectedBedroomTypes: ProjectType[] = [
        'bedroom_master',
        'bedroom_children',
        'bedroom_guest',
        'bedroom_nursery'
      ];

      expectedBedroomTypes.forEach(type => {
        expect(bedroomAgent?.projectTypes).toContain(type);
      });
    });

    it('should cover all living room project types', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const livingRoomAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'living_room_agent'
      )?.[0];

      const expectedLivingRoomTypes: ProjectType[] = [
        'living_room_open_plan',
        'living_room_fireplace',
        'living_room_storage',
        'living_room_snug'
      ];

      expectedLivingRoomTypes.forEach(type => {
        expect(livingRoomAgent?.projectTypes).toContain(type);
      });
    });
  });

  describe('Regulatory Compliance', () => {
    beforeEach(async () => {
      await agentRegistry.initializeAgents();
    });

    it('should include relevant building regulations for each room type', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      // Kitchen regulations
      const kitchenAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'kitchen_orchestrator'
      )?.[0];
      expect(kitchenAgent?.knowledgeBase.regulations).toContain('Building Regulations Part P (Electrical safety in kitchens)');
      expect(kitchenAgent?.knowledgeBase.regulations).toContain('Gas Safety (Installation and Use) Regulations 1998');

      // Bathroom regulations
      const bathroomAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'bathroom_orchestrator'
      )?.[0];
      expect(bathroomAgent?.knowledgeBase.regulations).toContain('Building Regulations Part P (Electrical zones in bathrooms)');
      expect(bathroomAgent?.knowledgeBase.regulations).toContain('Building Regulations Part G (Sanitation, hot water safety)');

      // Bedroom regulations
      const bedroomAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'bedroom_orchestrator'
      )?.[0];
      expect(bedroomAgent?.knowledgeBase.regulations).toContain('Building Regulations Part F (Ventilation) - minimum 8.4 l/s per person');
      expect(bedroomAgent?.knowledgeBase.regulations).toContain('Building Regulations Part L (Energy efficiency and insulation)');

      // Living room regulations
      const livingRoomAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'living_room_agent'
      )?.[0];
      expect(livingRoomAgent?.knowledgeBase.regulations).toContain('Building Regulations Part A (Structure) for wall removals');
      expect(livingRoomAgent?.knowledgeBase.regulations).toContain('Building Regulations Part B (Fire safety) for escape routes');
    });
  });

  describe('Agent Specialization', () => {
    beforeEach(async () => {
      await agentRegistry.initializeAgents();
    });

    it('should have room-specific best practices for each agent', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      // Kitchen best practices
      const kitchenAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'kitchen_orchestrator'
      )?.[0];
      expect(kitchenAgent?.knowledgeBase.bestPractices.length).toBeGreaterThan(5);
      expect(kitchenAgent?.knowledgeBase.bestPractices).toContain('Consider workflow and ergonomics in layout design');

      // Bathroom best practices
      const bathroomAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'bathroom_orchestrator'
      )?.[0];
      expect(bathroomAgent?.knowledgeBase.bestPractices.length).toBeGreaterThan(5);
      expect(bathroomAgent?.knowledgeBase.bestPractices).toContain('Use appropriate electrical zones and IP-rated fittings');

      // Bedroom best practices
      const bedroomAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'bedroom_orchestrator'
      )?.[0];
      expect(bedroomAgent?.knowledgeBase.bestPractices.length).toBeGreaterThan(5);
      expect(bedroomAgent?.knowledgeBase.bestPractices).toContain('Design flexible layouts that can adapt over time');

      // Living room best practices
      const livingRoomAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'living_room_agent'
      )?.[0];
      expect(livingRoomAgent?.knowledgeBase.bestPractices.length).toBeGreaterThan(5);
      expect(livingRoomAgent?.knowledgeBase.bestPractices).toContain('Plan electrical circuits for multiple lighting scenes');
    });
  });
});