import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { aiService } from '../aiService';
import { ProjectType } from '../../types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

describe('AIService', () => {
  beforeEach(() => {
    // Reset any mocks or state
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const status = await aiService.getStatus();
      expect(status).toBeDefined();
      expect(typeof status.initialized).toBe('boolean');
    });

    it('should handle initialization errors gracefully', async () => {
      // Test error handling during initialization
      expect(async () => {
        await aiService.initialize();
      }).not.toThrow();
    });
  });

  describe('SoW generation', () => {
    it('should generate SoW for kitchen renovation', async () => {
      const request = {
        projectId: 'test_project_1',
        projectType: 'kitchen_full_refit' as ProjectType,
        propertyId: 'test_property_1',
        userResponses: {
          kitchenSize: 'medium',
          budget: '25000',
          timeline: 'flexible',
          appliances: 'include'
        }
      };

      const result = await aiService.generateSoW(request);

      expect(result).toBeDefined();
      expect(result.sowDocument).toBeDefined();
      expect(result.ganttChart).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
      expect(Array.isArray(result.agentsUsed)).toBe(true);
      expect(result.orchestrationId).toBeDefined();
    });

    it('should handle "others" project type with custom description', async () => {
      const request = {
        projectId: 'test_project_2',
        projectType: 'others' as ProjectType,
        propertyId: 'test_property_2',
        userResponses: {
          budget: '15000',
          timeline: '8 weeks'
        },
        customDescription: 'Convert spare bedroom into home office with built-in desk and shelving'
      };

      const result = await aiService.generateSoW(request);

      expect(result).toBeDefined();
      expect(result.sowDocument).toBeDefined();
      expect(result.ganttChart).toBeDefined();
    });

    it('should regenerate SoW with modifications', async () => {
      const originalRequest = {
        projectId: 'test_project_3',
        projectType: 'bathroom_full_refit' as ProjectType,
        propertyId: 'test_property_3',
        userResponses: {
          bathroomType: 'family',
          budget: '12000'
        }
      };

      const modifications = {
        budget: '15000',
        luxuryFeatures: true
      };

      const result = await aiService.regenerateSoW(originalRequest, modifications);

      expect(result).toBeDefined();
      expect(result.sowDocument).toBeDefined();
    });
  });

  describe('agent management', () => {
    it('should get required agents for project type', async () => {
      const agents = await aiService.getRequiredAgents('loft_conversion_dormer' as ProjectType);

      expect(agents).toBeDefined();
      expect(agents.orchestrator).toBeDefined();
      expect(Array.isArray(agents.specialists)).toBe(true);
      expect(agents.specialists.length).toBeGreaterThan(0);
    });

    it('should test individual agent functionality', async () => {
      const testInput = {
        roomSize: '4m x 3m',
        currentElectrical: 'old_fuse_box',
        requirements: 'full_rewire'
      };

      const response = await aiService.testAgent('electrical_agent', testInput);

      expect(response).toBeDefined();
      expect(response.agentId).toBe('electrical_agent');
      expect(response.response).toBeDefined();
      expect(typeof response.confidence).toBe('number');
    });

    it('should get project type complexity', async () => {
      const complexity = await aiService.getProjectTypeComplexity();

      expect(complexity).toBeDefined();
      expect(typeof complexity).toBe('object');
    });
  });

  describe('prompt management', () => {
    it('should update agent prompt', async () => {
      const newPrompt = 'Updated prompt template for testing';
      const changelog = 'Test update for unit testing';
      const updatedBy = 'test_user';

      await expect(
        aiService.updateAgentPrompt('electrical_agent', newPrompt, changelog, updatedBy)
      ).resolves.not.toThrow();
    });

    it('should get agent metrics', async () => {
      const metrics = await aiService.getAgentMetrics('electrical_agent');

      // Metrics might be null if no data exists yet
      if (metrics) {
        expect(typeof metrics).toBe('object');
      }
    });
  });

  describe('error handling', () => {
    it('should handle invalid project type gracefully', async () => {
      const request = {
        projectId: 'test_project_error',
        projectType: 'invalid_type' as ProjectType,
        propertyId: 'test_property_error',
        userResponses: {}
      };

      await expect(aiService.generateSoW(request)).rejects.toThrow();
    });

    it('should handle missing agent gracefully', async () => {
      await expect(
        aiService.testAgent('non_existent_agent', {})
      ).rejects.toThrow();
    });
  });

  describe('service status', () => {
    it('should return service status', async () => {
      const status = await aiService.getStatus();

      expect(status).toBeDefined();
      expect(typeof status.initialized).toBe('boolean');
      expect(typeof status.agentsRegistered).toBe('number');
      expect(typeof status.promptsCreated).toBe('number');
      expect(typeof status.activeOrchestrations).toBe('number');
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources without errors', async () => {
      await expect(aiService.cleanup()).resolves.not.toThrow();
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete SoW generation workflow', async () => {
    // Test the complete workflow from project selection to SoW generation
    const request = {
      projectId: 'integration_test_1',
      projectType: 'rear_extension_single_storey' as ProjectType,
      propertyId: 'integration_property_1',
      userResponses: {
        extensionSize: '6m x 4m',
        purpose: 'kitchen_dining',
        budget: '45000',
        timeline: '12_weeks',
        planningPermission: 'not_required',
        buildingRegs: 'required'
      }
    };

    const result = await aiService.generateSoW(request);

    // Verify the complete result structure
    expect(result.sowDocument).toBeDefined();
    expect(result.sowDocument.id).toBeDefined();
    expect(result.sowDocument.projectId).toBe(request.projectId);
    expect(result.sowDocument.version).toBe(1);
    expect(Array.isArray(result.sowDocument.sections)).toBe(true);
    expect(Array.isArray(result.sowDocument.materials)).toBe(true);
    expect(Array.isArray(result.sowDocument.laborRequirements)).toBe(true);

    expect(result.ganttChart).toBeDefined();
    expect(result.ganttChart.id).toBeDefined();
    expect(result.ganttChart.projectId).toBe(request.projectId);
    expect(Array.isArray(result.ganttChart.tasks)).toBe(true);

    expect(result.processingTime).toBeGreaterThan(0);
    expect(Array.isArray(result.agentsUsed)).toBe(true);
    expect(result.orchestrationId).toBeDefined();
  });

  it('should handle complex multi-agent coordination', async () => {
    // Test a complex project that requires multiple agents
    const request = {
      projectId: 'complex_test_1',
      projectType: 'loft_conversion_dormer' as ProjectType,
      propertyId: 'complex_property_1',
      userResponses: {
        loftType: 'dormer',
        rooms: 'bedroom_ensuite',
        access: 'new_staircase',
        insulation: 'high_performance',
        heating: 'extend_existing',
        electrical: 'new_circuits',
        plumbing: 'new_bathroom',
        budget: '65000'
      }
    };

    const result = await aiService.generateSoW(request);

    // Should involve orchestrator and multiple specialists
    expect(result.agentsUsed.length).toBeGreaterThan(3);
    expect(result.agentsUsed).toContain('loft_conversion_orchestrator');
    
    // Should have comprehensive SoW sections
    expect(result.sowDocument.sections.length).toBeGreaterThan(0);
    expect(result.sowDocument.materials.length).toBeGreaterThan(0);
    expect(result.sowDocument.laborRequirements.length).toBeGreaterThan(0);
  });
});