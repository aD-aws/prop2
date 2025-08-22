import { agentRegistry } from '../agentRegistry';
import { aiAgentService } from '../aiAgentService';
import { ProjectType, ProjectContext } from '../../types';

// Mock the aiAgentService
jest.mock('../aiAgentService');
jest.mock('../promptManager');

describe('Trade-Specific AI Agents (Task 6.1)', () => {
  beforeEach(async () => {
    // Reset the registry before each test
    agentRegistry.reset();
    jest.clearAllMocks();
  });

  describe('Agent Registration', () => {
    it('should register all trade-specific agents during initialization', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      // Verify that trade-specific agents are registered
      const expectedTradeAgents = [
        'windows_doors_agent',
        'electrical_agent',
        'plumbing_agent',
        'roofing_agent',
        'heating_hvac_agent'
      ];

      const registeredAgents = registerAgentSpy.mock.calls.map(call => call[0].id);
      
      expectedTradeAgents.forEach(agentId => {
        expect(registeredAgents).toContain(agentId);
      });
    });

    it('should register Windows & Doors agent with correct specialization', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      const windowsDoorsAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'windows_doors_agent'
      )?.[0];

      expect(windowsDoorsAgent).toBeDefined();
      expect(windowsDoorsAgent?.name).toBe('Windows & Doors AI Agent');
      expect(windowsDoorsAgent?.specialization).toContain('Glazing');
      expect(windowsDoorsAgent?.specialization).toContain('installation');
      expect(windowsDoorsAgent?.isOrchestrator).toBe(false);
      expect(windowsDoorsAgent?.projectTypes).toContain('windows_upvc' as ProjectType);
      expect(windowsDoorsAgent?.projectTypes).toContain('doors_bifold' as ProjectType);
    });

    it('should register Electrical agent with correct knowledge base', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      const electricalAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'electrical_agent'
      )?.[0];

      expect(electricalAgent).toBeDefined();
      expect(electricalAgent?.name).toBe('Electrical AI Agent');
      expect(electricalAgent?.specialization).toContain('Wiring');
      expect(electricalAgent?.specialization).toContain('safety compliance');
      expect(electricalAgent?.knowledgeBase.regulations).toContain('Building Regulations Part P (Electrical safety)');
      expect(electricalAgent?.knowledgeBase.regulations).toContain('BS 7671:2018+A2:2022 (IET Wiring Regulations)');
      expect(electricalAgent?.knowledgeBase.facts).toContain('RCD protection (30mA) required for most circuits in domestic installations');
    });

    it('should register Plumbing agent with correct project types', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      const plumbingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'plumbing_agent'
      )?.[0];

      expect(plumbingAgent).toBeDefined();
      expect(plumbingAgent?.name).toBe('Plumbing AI Agent');
      expect(plumbingAgent?.specialization).toContain('Pipes');
      expect(plumbingAgent?.specialization).toContain('fixtures');
      expect(plumbingAgent?.specialization).toContain('drainage');
      expect(plumbingAgent?.projectTypes).toContain('plumbing_bathroom' as ProjectType);
      expect(plumbingAgent?.projectTypes).toContain('plumbing_kitchen' as ProjectType);
      expect(plumbingAgent?.knowledgeBase.regulations).toContain('Water Supply (Water Fittings) Regulations 1999');
    });

    it('should register Roofing agent with structural dependencies', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      const roofingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'roofing_agent'
      )?.[0];

      expect(roofingAgent).toBeDefined();
      expect(roofingAgent?.name).toBe('Roofing AI Agent');
      expect(roofingAgent?.specialization).toContain('materials');
      expect(roofingAgent?.specialization).toContain('installation');
      expect(roofingAgent?.dependencies).toContain('structural_agent');
      expect(roofingAgent?.projectTypes).toContain('roofing_re_roofing' as ProjectType);
      expect(roofingAgent?.projectTypes).toContain('roofing_slate' as ProjectType);
      expect(roofingAgent?.knowledgeBase.facts).toContain('Roof pitch determines material suitability - slate minimum 20°, tiles 15°');
    });

    it('should register Heating & HVAC agent with correct dependencies', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      const heatingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'heating_hvac_agent'
      )?.[0];

      expect(heatingAgent).toBeDefined();
      expect(heatingAgent?.name).toBe('Heating & HVAC AI Agent');
      expect(heatingAgent?.specialization).toContain('system design');
      expect(heatingAgent?.dependencies).toContain('electrical_agent');
      expect(heatingAgent?.dependencies).toContain('plumbing_agent');
      expect(heatingAgent?.projectTypes).toContain('heating_boiler_replacement' as ProjectType);
      expect(heatingAgent?.projectTypes).toContain('heating_heat_pump' as ProjectType);
      expect(heatingAgent?.knowledgeBase.regulations).toContain('Building Regulations Part F (Ventilation)');
    });
  });

  describe('Knowledge Base Content', () => {
    beforeEach(async () => {
      await agentRegistry.initializeAgents();
    });

    it('should have comprehensive knowledge base for Windows & Doors agent', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const windowsDoorsAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'windows_doors_agent'
      )?.[0];

      expect(windowsDoorsAgent?.knowledgeBase.facts).toContain('U-values determine energy efficiency ratings (lower is better)');
      expect(windowsDoorsAgent?.knowledgeBase.facts).toContain('Double glazing typically achieves 1.4-2.8 W/m²K, triple glazing 0.8-1.2 W/m²K');
      expect(windowsDoorsAgent?.knowledgeBase.regulations).toContain('Building Regulations Part L (Conservation of fuel and power)');
      expect(windowsDoorsAgent?.knowledgeBase.regulations).toContain('Building Regulations Part Q (Security - Dwellings)');
      expect(windowsDoorsAgent?.knowledgeBase.bestPractices).toContain('Check structural adequacy of openings before installation');
    });

    it('should have detailed electrical knowledge for Electrical agent', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const electricalAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'electrical_agent'
      )?.[0];

      expect(electricalAgent?.knowledgeBase.facts).toContain('Cable sizing depends on load current, installation method, and cable length');
      expect(electricalAgent?.knowledgeBase.facts).toContain('Bathroom zones have specific IP ratings: Zone 0 (IPX7), Zone 1 (IPX4), Zone 2 (IPX4)');
      expect(electricalAgent?.knowledgeBase.facts).toContain('EV charging requires dedicated 32A circuit with Type A RCD protection');
      expect(electricalAgent?.knowledgeBase.bestPractices).toContain('Plan circuit layout during first fix stage before plastering');
    });

    it('should have comprehensive plumbing knowledge for Plumbing agent', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const plumbingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'plumbing_agent'
      )?.[0];

      expect(plumbingAgent?.knowledgeBase.facts).toContain('Pipe sizing affects water pressure - 15mm for basins, 22mm for baths');
      expect(plumbingAgent?.knowledgeBase.facts).toContain('Drainage falls must be 1:40 minimum for 100mm pipes, 1:80 for 150mm pipes');
      expect(plumbingAgent?.knowledgeBase.regulations).toContain('Building Regulations Part G (Sanitation, hot water safety and water efficiency)');
      expect(plumbingAgent?.knowledgeBase.bestPractices).toContain('Plan pipe routes to avoid conflicts with other services');
    });

    it('should have roofing expertise for Roofing agent', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const roofingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'roofing_agent'
      )?.[0];

      expect(roofingAgent?.knowledgeBase.facts).toContain('Ventilation prevents condensation - 25mm continuous gap at eaves and ridge');
      expect(roofingAgent?.knowledgeBase.facts).toContain('Green roofs require structural loading calculations and waterproofing');
      expect(roofingAgent?.knowledgeBase.regulations).toContain('British Standards BS 5534 for slating and tiling');
      expect(roofingAgent?.knowledgeBase.bestPractices).toContain('Ensure adequate structural support for roof loads');
    });

    it('should have HVAC expertise for Heating agent', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const heatingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'heating_hvac_agent'
      )?.[0];

      expect(heatingAgent?.knowledgeBase.facts).toContain('Heat loss calculations determine system sizing using SAP methodology');
      expect(heatingAgent?.knowledgeBase.facts).toContain('Heat pumps work efficiently down to -15°C with proper sizing');
      expect(heatingAgent?.knowledgeBase.regulations).toContain('Building Regulations Part L (Conservation of fuel and power)');
      expect(heatingAgent?.knowledgeBase.bestPractices).toContain('Calculate heat loads accurately using recognized methods');
    });
  });

  describe('Agent Initialization Status', () => {
    it('should mark registry as initialized after successful agent registration', async () => {
      expect(agentRegistry.isInitialized()).toBe(false);
      
      await agentRegistry.initializeAgents();
      
      expect(agentRegistry.isInitialized()).toBe(true);
    });

    it('should not re-initialize agents if already initialized', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();
      const firstCallCount = registerAgentSpy.mock.calls.length;
      
      await agentRegistry.initializeAgents();
      const secondCallCount = registerAgentSpy.mock.calls.length;
      
      expect(secondCallCount).toBe(firstCallCount);
    });
  });

  describe('Error Handling', () => {
    it('should handle agent registration errors gracefully', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent')
        .mockRejectedValueOnce(new Error('Registration failed'));
      
      await expect(agentRegistry.initializeAgents()).rejects.toThrow('Registration failed');
      expect(agentRegistry.isInitialized()).toBe(false);
    });
  });
});