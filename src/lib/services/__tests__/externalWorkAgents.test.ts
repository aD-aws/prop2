import { agentRegistry } from '../agentRegistry';
import { aiAgentService } from '../aiAgentService';
import { ProjectType } from '../../types';

// Mock the aiAgentService
jest.mock('../aiAgentService');
jest.mock('../promptManager');

describe('External Work AI Agents (Task 6.4)', () => {
  beforeEach(async () => {
    // Reset the registry before each test
    agentRegistry.reset();
    jest.clearAllMocks();
  });

  describe('Agent Registration', () => {
    it('should register all external work agents during initialization', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      // Verify that external work agents are registered
      const expectedExternalAgents = [
        'rendering_cladding_agent',
        'landscaping_garden_agent',
        'driveway_patio_agent'
      ];

      const registeredAgents = registerAgentSpy.mock.calls.map(call => call[0].id);
      
      expectedExternalAgents.forEach(agentId => {
        expect(registeredAgents).toContain(agentId);
      });
    });

    it('should register Rendering & Cladding AI Agent with materials expertise', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      const renderingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'rendering_cladding_agent'
      )?.[0];

      expect(renderingAgent).toBeDefined();
      expect(renderingAgent?.name).toBe('Rendering & Cladding AI Agent');
      expect(renderingAgent?.specialization).toContain('materials expertise');
      expect(renderingAgent?.isOrchestrator).toBe(false);
      expect(renderingAgent?.dependencies).toContain('structural_agent');
      expect(renderingAgent?.projectTypes).toContain('rendering_k_rend' as ProjectType);
      expect(renderingAgent?.projectTypes).toContain('cladding_timber' as ProjectType);
    });

    it('should register Landscaping & Garden AI Agent with design and installation expertise', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      const landscapingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'landscaping_garden_agent'
      )?.[0];

      expect(landscapingAgent).toBeDefined();
      expect(landscapingAgent?.name).toBe('Landscaping & Garden AI Agent');
      expect(landscapingAgent?.specialization).toContain('design');
      expect(landscapingAgent?.specialization).toContain('installation');
      expect(landscapingAgent?.isOrchestrator).toBe(false);
      expect(landscapingAgent?.dependencies).toEqual([]);
      expect(landscapingAgent?.projectTypes).toContain('garden_landscaping' as ProjectType);
      expect(landscapingAgent?.projectTypes).toContain('garden_decking_composite' as ProjectType);
    });

    it('should register Driveway & Patio AI Agent with materials and drainage expertise', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      await agentRegistry.initializeAgents();

      const drivewayAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'driveway_patio_agent'
      )?.[0];

      expect(drivewayAgent).toBeDefined();
      expect(drivewayAgent?.name).toBe('Driveway & Patio AI Agent');
      expect(drivewayAgent?.specialization).toContain('materials');
      expect(drivewayAgent?.specialization).toContain('drainage');
      expect(drivewayAgent?.isOrchestrator).toBe(false);
      expect(drivewayAgent?.dependencies).toEqual([]);
      expect(drivewayAgent?.projectTypes).toContain('driveway_block_paving' as ProjectType);
      expect(drivewayAgent?.projectTypes).toContain('patio_natural_stone' as ProjectType);
    });
  });

  describe('Knowledge Base Content', () => {
    beforeEach(async () => {
      await agentRegistry.initializeAgents();
    });

    it('should have comprehensive rendering and cladding knowledge', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const renderingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'rendering_cladding_agent'
      )?.[0];

      expect(renderingAgent?.knowledgeBase.facts).toContain('K-rend systems provide weather protection and thermal performance');
      expect(renderingAgent?.knowledgeBase.facts).toContain('Timber cladding requires proper ventilation and moisture management');
      expect(renderingAgent?.knowledgeBase.regulations).toContain('Building Regulations Part B (Fire safety) - cladding fire performance');
      expect(renderingAgent?.knowledgeBase.regulations).toContain('British Standards BS 8297 for cladding systems');
      expect(renderingAgent?.knowledgeBase.bestPractices).toContain('Ensure proper substrate preparation before application');
      expect(renderingAgent?.knowledgeBase.bestPractices).toContain('Install adequate ventilation behind cladding systems');
    });

    it('should have detailed landscaping and garden knowledge', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const landscapingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'landscaping_garden_agent'
      )?.[0];

      expect(landscapingAgent?.knowledgeBase.facts).toContain('Garden design should consider soil conditions and drainage');
      expect(landscapingAgent?.knowledgeBase.facts).toContain('Composite decking requires minimal maintenance but higher initial cost');
      expect(landscapingAgent?.knowledgeBase.facts).toContain('Raised decking requires structural support and building regulations compliance');
      expect(landscapingAgent?.knowledgeBase.regulations).toContain('Building Regulations Part A (Structure) for raised decking over 600mm');
      expect(landscapingAgent?.knowledgeBase.bestPractices).toContain('Conduct soil survey and drainage assessment');
      expect(landscapingAgent?.knowledgeBase.bestPractices).toContain('Plan for seasonal changes and plant growth');
    });

    it('should have comprehensive driveway and patio knowledge', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const drivewayAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'driveway_patio_agent'
      )?.[0];

      expect(drivewayAgent?.knowledgeBase.facts).toContain('Block paving provides flexibility and easy repair but requires edge restraints');
      expect(drivewayAgent?.knowledgeBase.facts).toContain('Resin bound surfaces are permeable and low maintenance');
      expect(drivewayAgent?.knowledgeBase.facts).toContain('Drainage is critical for preventing water damage and ice formation');
      expect(drivewayAgent?.knowledgeBase.regulations).toContain('Planning permission for front garden paving over 5m²');
      expect(drivewayAgent?.knowledgeBase.regulations).toContain('Sustainable Drainage Systems (SuDS) requirements');
      expect(drivewayAgent?.knowledgeBase.bestPractices).toContain('Ensure adequate sub-base preparation for loading');
      expect(drivewayAgent?.knowledgeBase.bestPractices).toContain('Install proper drainage to prevent water damage');
    });
  });

  describe('Project Type Coverage', () => {
    beforeEach(async () => {
      await agentRegistry.initializeAgents();
    });

    it('should cover all rendering and cladding project types', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const renderingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'rendering_cladding_agent'
      )?.[0];

      const expectedRenderingTypes: ProjectType[] = [
        'rendering_k_rend',
        'rendering_pebbledash',
        'cladding_timber',
        'cladding_brick_slip'
      ];

      expectedRenderingTypes.forEach(type => {
        expect(renderingAgent?.projectTypes).toContain(type);
      });
    });

    it('should cover all landscaping and garden project types', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const landscapingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'landscaping_garden_agent'
      )?.[0];

      const expectedLandscapingTypes: ProjectType[] = [
        'garden_landscaping',
        'garden_decking_composite',
        'garden_decking_hardwood',
        'garden_decking_raised',
        'garden_pergola'
      ];

      expectedLandscapingTypes.forEach(type => {
        expect(landscapingAgent?.projectTypes).toContain(type);
      });
    });

    it('should cover all driveway and patio project types', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      const drivewayAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'driveway_patio_agent'
      )?.[0];

      const expectedDrivewayTypes: ProjectType[] = [
        'driveway_block_paving',
        'driveway_resin',
        'driveway_tarmac',
        'driveway_natural_stone',
        'driveway_gravel',
        'driveway_concrete',
        'patio_block_paving',
        'patio_natural_stone',
        'patio_concrete'
      ];

      expectedDrivewayTypes.forEach(type => {
        expect(drivewayAgent?.projectTypes).toContain(type);
      });
    });
  });

  describe('Regulatory Compliance', () => {
    beforeEach(async () => {
      await agentRegistry.initializeAgents();
    });

    it('should include relevant building regulations for external work', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      // Rendering & Cladding regulations
      const renderingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'rendering_cladding_agent'
      )?.[0];
      expect(renderingAgent?.knowledgeBase.regulations).toContain('Building Regulations Part B (Fire safety) - cladding fire performance');
      expect(renderingAgent?.knowledgeBase.regulations).toContain('Building Regulations Part C (Resistance to moisture)');

      // Landscaping regulations
      const landscapingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'landscaping_garden_agent'
      )?.[0];
      expect(landscapingAgent?.knowledgeBase.regulations).toContain('Building Regulations Part A (Structure) for raised decking over 600mm');
      expect(landscapingAgent?.knowledgeBase.regulations).toContain('Tree Preservation Orders (TPO) for protected trees');

      // Driveway & Patio regulations
      const drivewayAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'driveway_patio_agent'
      )?.[0];
      expect(drivewayAgent?.knowledgeBase.regulations).toContain('Planning permission for front garden paving over 5m²');
      expect(drivewayAgent?.knowledgeBase.regulations).toContain('Sustainable Drainage Systems (SuDS) requirements');
    });
  });

  describe('Specialist Dependencies', () => {
    beforeEach(async () => {
      await agentRegistry.initializeAgents();
    });

    it('should have appropriate dependencies for external work agents', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      // Rendering & Cladding should depend on structural agent
      const renderingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'rendering_cladding_agent'
      )?.[0];
      expect(renderingAgent?.dependencies).toContain('structural_agent');

      // Landscaping should have no dependencies (independent work)
      const landscapingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'landscaping_garden_agent'
      )?.[0];
      expect(landscapingAgent?.dependencies).toEqual([]);

      // Driveway & Patio should have no dependencies (independent work)
      const drivewayAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'driveway_patio_agent'
      )?.[0];
      expect(drivewayAgent?.dependencies).toEqual([]);
    });
  });

  describe('Material Expertise', () => {
    beforeEach(async () => {
      await agentRegistry.initializeAgents();
    });

    it('should have material-specific knowledge for each external work type', async () => {
      const registerAgentSpy = jest.spyOn(aiAgentService, 'registerAgent');
      
      // Rendering materials knowledge
      const renderingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'rendering_cladding_agent'
      )?.[0];
      expect(renderingAgent?.knowledgeBase.facts.length).toBeGreaterThan(10);
      expect(renderingAgent?.knowledgeBase.bestPractices.length).toBeGreaterThan(8);

      // Landscaping materials knowledge
      const landscapingAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'landscaping_garden_agent'
      )?.[0];
      expect(landscapingAgent?.knowledgeBase.facts.length).toBeGreaterThan(10);
      expect(landscapingAgent?.knowledgeBase.bestPractices.length).toBeGreaterThan(8);

      // Driveway materials knowledge
      const drivewayAgent = registerAgentSpy.mock.calls.find(
        call => call[0].id === 'driveway_patio_agent'
      )?.[0];
      expect(drivewayAgent?.knowledgeBase.facts.length).toBeGreaterThan(10);
      expect(drivewayAgent?.knowledgeBase.bestPractices.length).toBeGreaterThan(8);
    });
  });
});