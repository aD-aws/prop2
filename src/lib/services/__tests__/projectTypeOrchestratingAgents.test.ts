import { agentRegistry } from '../agentRegistry';
import { aiAgentService } from '../aiAgentService';
import { ProjectType } from '../../types';

// Mock the aiAgentService
jest.mock('../aiAgentService');
jest.mock('../promptManager');

describe('Project-Type Orchestrating AI Agents (Task 6.3)', () => {
  beforeEach(async () => {
    // Reset the registry before each test
    agentRegistry.reset();
    jest.clearAllMocks();
  });

  describe('Agent Registration', () => {
    it('should register all project-type orchestrating agents during initialization', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      // Verify that project-type orchestrating agents are registered
      const expectedOrchestratingAgents = [
        'loft_conversion_orchestrator',
        'extension_orchestrator',
        'basement_conversion_orchestrator',
        'garage_conversion_orchestrator'
      ];

      const registeredAgents = registerAgentSpy.mock.calls.map(call => call[0].id);
      
      expectedOrchestratingAgents.forEach(agentId => {
        expect(registeredAgents).toContain(agentId);
      });
    });

    it('should register Loft Conversion AI Agent that coordinates multiple specialists', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      const loftAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'loft_conversion_orchestrator'
      )?.[0];

      expect(loftAgent).toBeDefined();
      expect(loftAgent?.name).toBe('Loft Conversion AI Agent');
      expect(loftAgent?.specialization).toContain('coordinates multiple specialists');
      expect(loftAgent?.isOrchestrator).toBe(true);
      expect(loftAgent?.dependencies).toContain('structural_agent');
      expect(loftAgent?.dependencies).toContain('electrical_agent');
      expect(loftAgent?.dependencies).toContain('plumbing_agent');
      expect(loftAgent?.dependencies).toContain('heating_hvac_agent');
      expect(loftAgent?.dependencies).toContain('insulation_agent');
      expect(loftAgent?.projectTypes).toContain('loft_conversion_dormer' as ProjectType);
    });

    it('should register Extension AI Agent for rear, side, and wrap-around extensions', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      const extensionAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'extension_orchestrator'
      )?.[0];

      expect(extensionAgent).toBeDefined();
      expect(extensionAgent?.name).toBe('Extension AI Agent');
      expect(extensionAgent?.specialization).toContain('rear, side, and wrap-around extensions');
      expect(extensionAgent?.isOrchestrator).toBe(true);
      expect(extensionAgent?.dependencies).toContain('structural_agent');
      expect(extensionAgent?.dependencies).toContain('electrical_agent');
      expect(extensionAgent?.dependencies).toContain('plumbing_agent');
      expect(extensionAgent?.dependencies).toContain('heating_hvac_agent');
      expect(extensionAgent?.dependencies).toContain('roofing_agent');
      expect(extensionAgent?.projectTypes).toContain('rear_extension_single_storey' as ProjectType);
      expect(extensionAgent?.projectTypes).toContain('side_extension_double_storey' as ProjectType);
    });

    it('should register Basement Conversion AI Agent with excavation and waterproofing expertise', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      const basementAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'basement_conversion_orchestrator'
      )?.[0];

      expect(basementAgent).toBeDefined();
      expect(basementAgent?.name).toBe('Basement Conversion AI Agent');
      expect(basementAgent?.specialization).toContain('excavation');
      expect(basementAgent?.specialization).toContain('waterproofing');
      expect(basementAgent?.isOrchestrator).toBe(true);
      expect(basementAgent?.dependencies).toContain('structural_agent');
      expect(basementAgent?.dependencies).toContain('electrical_agent');
      expect(basementAgent?.dependencies).toContain('plumbing_agent');
      expect(basementAgent?.dependencies).toContain('heating_hvac_agent');
      expect(basementAgent?.dependencies).toContain('insulation_agent');
      expect(basementAgent?.projectTypes).toContain('basement_conversion_full' as ProjectType);
    });

    it('should register Garage Conversion AI Agent with structural and utility expertise', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      const garageAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'garage_conversion_orchestrator'
      )?.[0];

      expect(garageAgent).toBeDefined();
      expect(garageAgent?.name).toBe('Garage Conversion AI Agent');
      expect(garageAgent?.specialization).toContain('structural');
      expect(garageAgent?.specialization).toContain('utility');
      expect(garageAgent?.isOrchestrator).toBe(true);
      expect(garageAgent?.dependencies).toContain('structural_agent');
      expect(garageAgent?.dependencies).toContain('electrical_agent');
      expect(garageAgent?.dependencies).toContain('plumbing_agent');
      expect(garageAgent?.dependencies).toContain('heating_hvac_agent');
      expect(garageAgent?.dependencies).toContain('insulation_agent');
      expect(garageAgent?.projectTypes).toContain('garage_conversion_living_space' as ProjectType);
    });
  });

  describe('Orchestration Capabilities', () => {
    beforeEach(async () => {
      await agentRegistry.initializeAgents();
    });

    it('should have comprehensive orchestration knowledge for loft conversions', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const loftAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'loft_conversion_orchestrator'
      )?.[0];

      expect(loftAgent?.knowledgeBase.facts).toContain('Loft conversions typically require structural calculations for floor strengthening');
      expect(loftAgent?.knowledgeBase.facts).toContain('Dormer windows require planning permission in most cases');
      expect(loftAgent?.knowledgeBase.facts).toContain('Electrical circuits need upgrading for additional rooms');
      expect(loftAgent?.knowledgeBase.bestPractices).toContain('Always engage structural engineer for floor and roof calculations');
      expect(loftAgent?.knowledgeBase.bestPractices).toContain('Coordinate electrical, plumbing, and heating early in design');
    });

    it('should have detailed extension orchestration knowledge', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const extensionAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'extension_orchestrator'
      )?.[0];

      expect(extensionAgent?.knowledgeBase.facts).toContain('Single-storey rear extensions can be up to 6m (detached) or 4m (other houses)');
      expect(extensionAgent?.knowledgeBase.facts).toContain('Structural integration with existing building is critical');
      expect(extensionAgent?.knowledgeBase.facts).toContain('Services (electrical, plumbing, heating) need extending and upgrading');
      expect(extensionAgent?.knowledgeBase.bestPractices).toContain('Plan services integration carefully with existing systems');
      expect(extensionAgent?.knowledgeBase.bestPractices).toContain('Coordinate roofing to ensure weatherproof integration');
    });

    it('should have comprehensive basement conversion orchestration knowledge', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const basementAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'basement_conversion_orchestrator'
      )?.[0];

      expect(basementAgent?.knowledgeBase.facts).toContain('Basement conversions require extensive structural calculations and underpinning');
      expect(basementAgent?.knowledgeBase.facts).toContain('Structural waterproofing (Type A) and applied systems (Type C) both needed');
      expect(basementAgent?.knowledgeBase.facts).toContain('Party wall agreements essential for excavation work');
      expect(basementAgent?.knowledgeBase.bestPractices).toContain('Always engage specialist structural engineer for underpinning design');
      expect(basementAgent?.knowledgeBase.bestPractices).toContain('Implement comprehensive waterproofing strategy (Type A + Type C)');
    });

    it('should have garage conversion orchestration expertise', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const garageAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'garage_conversion_orchestrator'
      )?.[0];

      expect(garageAgent?.knowledgeBase.facts).toContain('Electrical supply usually needs significant upgrading for habitable use');
      expect(garageAgent?.knowledgeBase.facts).toContain('Heating systems need extending from main house');
      expect(garageAgent?.knowledgeBase.facts).toContain('Fire safety and emergency egress must be considered');
      expect(garageAgent?.knowledgeBase.bestPractices).toContain('Upgrade electrical supply and circuits for modern use');
      expect(garageAgent?.knowledgeBase.bestPractices).toContain('Coordinate utility connections efficiently');
    });
  });

  describe('Specialist Dependencies', () => {
    beforeEach(async () => {
      await agentRegistry.initializeAgents();
    });

    it('should have appropriate specialist dependencies for each orchestrating agent', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      // Loft conversion dependencies
      const loftAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'loft_conversion_orchestrator'
      )?.[0];
      expect(loftAgent?.dependencies).toEqual(
        expect.arrayContaining(['structural_agent', 'electrical_agent', 'plumbing_agent', 'heating_hvac_agent', 'insulation_agent'])
      );

      // Extension dependencies
      const extensionAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'extension_orchestrator'
      )?.[0];
      expect(extensionAgent?.dependencies).toEqual(
        expect.arrayContaining(['structural_agent', 'electrical_agent', 'plumbing_agent', 'heating_hvac_agent', 'roofing_agent'])
      );

      // Basement conversion dependencies
      const basementAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'basement_conversion_orchestrator'
      )?.[0];
      expect(basementAgent?.dependencies).toEqual(
        expect.arrayContaining(['structural_agent', 'electrical_agent', 'plumbing_agent', 'heating_hvac_agent', 'insulation_agent'])
      );

      // Garage conversion dependencies
      const garageAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'garage_conversion_orchestrator'
      )?.[0];
      expect(garageAgent?.dependencies).toEqual(
        expect.arrayContaining(['structural_agent', 'electrical_agent', 'plumbing_agent', 'heating_hvac_agent', 'insulation_agent'])
      );
    });
  });

  describe('Project Type Coverage', () => {
    beforeEach(async () => {
      await agentRegistry.initializeAgents();
    });

    it('should cover all loft conversion project types', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const loftAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'loft_conversion_orchestrator'
      )?.[0];

      const expectedLoftTypes: ProjectType[] = [
        'loft_conversion_dormer',
        'loft_conversion_hip_to_gable',
        'loft_conversion_mansard',
        'loft_conversion_velux',
        'loft_conversion_roof_light'
      ];

      expectedLoftTypes.forEach(type => {
        expect(loftAgent?.projectTypes).toContain(type);
      });
    });

    it('should cover all extension project types', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const extensionAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'extension_orchestrator'
      )?.[0];

      const expectedExtensionTypes: ProjectType[] = [
        'rear_extension_single_storey',
        'rear_extension_double_storey',
        'rear_extension_wrap_around',
        'rear_extension_glass_box',
        'side_extension_single_storey',
        'side_extension_double_storey',
        'side_extension_infill'
      ];

      expectedExtensionTypes.forEach(type => {
        expect(extensionAgent?.projectTypes).toContain(type);
      });
    });

    it('should cover all basement conversion project types', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const basementAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'basement_conversion_orchestrator'
      )?.[0];

      const expectedBasementTypes: ProjectType[] = [
        'basement_conversion_full',
        'basement_conversion_partial'
      ];

      expectedBasementTypes.forEach(type => {
        expect(basementAgent?.projectTypes).toContain(type);
      });
    });

    it('should cover all garage conversion project types', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const garageAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'garage_conversion_orchestrator'
      )?.[0];

      const expectedGarageTypes: ProjectType[] = [
        'garage_conversion_living_space',
        'garage_conversion_office',
        'garage_conversion_gym',
        'garage_conversion_studio'
      ];

      expectedGarageTypes.forEach(type => {
        expect(garageAgent?.projectTypes).toContain(type);
      });
    });
  });

  describe('Regulatory Compliance', () => {
    beforeEach(async () => {
      await agentRegistry.initializeAgents();
    });

    it('should include comprehensive building regulations for orchestrating agents', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      // Loft conversion regulations
      const loftAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'loft_conversion_orchestrator'
      )?.[0];
      expect(loftAgent?.knowledgeBase.regulations).toContain('Building Regulations Part A (Structure) - floor and roof strengthening');
      expect(loftAgent?.knowledgeBase.regulations).toContain('Building Regulations Part B (Fire Safety) - escape routes and fire doors');

      // Extension regulations
      const extensionAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'extension_orchestrator'
      )?.[0];
      expect(extensionAgent?.knowledgeBase.regulations).toContain('Planning Permission requirements and permitted development rights');
      expect(extensionAgent?.knowledgeBase.regulations).toContain('Building Regulations full approval (all parts applicable)');

      // Basement conversion regulations
      const basementAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'basement_conversion_orchestrator'
      )?.[0];
      expect(basementAgent?.knowledgeBase.regulations).toContain('Building Regulations Part A (Structure) - underpinning and excavation');
      expect(basementAgent?.knowledgeBase.regulations).toContain('Party Wall Act 1996 for excavation near boundaries');

      // Garage conversion regulations
      const garageAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'garage_conversion_orchestrator'
      )?.[0];
      expect(garageAgent?.knowledgeBase.regulations).toContain('Building Regulations approval required for habitable conversions');
      expect(garageAgent?.knowledgeBase.regulations).toContain('Planning permission check needed - permitted development limits');
    });
  });
});