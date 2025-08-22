import { PromptManager } from '../../lib/services/promptManager';
import { AIAgentService } from '../../lib/services/aiAgentService';
import { ProjectType, ProjectContext, AIAgent } from '../../lib/types';

describe('AI Prompt Regression Testing', () => {
  let promptManager: PromptManager;
  let aiAgentService: AIAgentService;

  beforeEach(() => {
    promptManager = new PromptManager();
    aiAgentService = new AIAgentService();
  });

  describe('Kitchen Renovation Prompts', () => {
    const baselineContext: ProjectContext = {
      projectId: 'regression-test-kitchen-001',
      projectType: 'kitchen_full_refit' as ProjectType,
      property: {
        id: 'prop-001',
        address: {
          line1: '123 Test Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'UK'
        },
        councilArea: 'Westminster',
        isListedBuilding: false,
        isInConservationArea: false,
        planningHistory: [],
        buildingRegulations: []
      },
      userResponses: {
        budget: '£30000',
        timeline: '10 weeks',
        style: 'modern'
      },
      previousAgentResponses: []
    };

    it('should generate consistent orchestrator prompts', () => {
      const promptId = 'kitchen-renovation-orchestrator';
      
      // Generate prompt multiple times
      const prompt1 = promptManager.getPrompt(promptId, baselineContext);
      const prompt2 = promptManager.getPrompt(promptId, baselineContext);
      const prompt3 = promptManager.getPrompt(promptId, baselineContext);

      // Should be identical for same context
      expect(prompt1).toBe(prompt2);
      expect(prompt2).toBe(prompt3);

      // Should contain expected elements
      expect(prompt1).toContain('kitchen renovation');
      expect(prompt1).toContain('£30000');
      expect(prompt1).toContain('10 weeks');
      expect(prompt1).toContain('modern');
      expect(prompt1).toContain('terraced');
    });

    it('should handle context variations appropriately', () => {
      const promptId = 'kitchen-renovation-orchestrator';
      
      const variations = [
        {
          ...baselineContext,
          userResponses: { ...baselineContext.userResponses, budget: '£50000' }
        },
        {
          ...baselineContext,
          userResponses: { ...baselineContext.userResponses, style: 'traditional' }
        },
        {
          ...baselineContext,
          propertyDetails: { ...baselineContext.propertyDetails, yearBuilt: 1920 }
        }
      ];

      const prompts = variations.map(context => 
        promptManager.getPrompt(promptId, context)
      );

      // Each should be different
      expect(prompts[0]).not.toBe(prompts[1]);
      expect(prompts[1]).not.toBe(prompts[2]);
      expect(prompts[0]).not.toBe(prompts[2]);

      // But should contain appropriate variations
      expect(prompts[0]).toContain('£50000');
      expect(prompts[1]).toContain('traditional');
      expect(prompts[2]).toContain('1920');
    });

    it('should maintain prompt quality metrics', () => {
      const promptId = 'kitchen-renovation-orchestrator';
      const prompt = promptManager.getPrompt(promptId, baselineContext);

      // Quality metrics
      const wordCount = prompt.split(/\s+/).length;
      const sentenceCount = prompt.split(/[.!?]+/).length;
      const avgWordsPerSentence = wordCount / sentenceCount;

      // Baseline quality thresholds
      expect(wordCount).toBeGreaterThan(50); // Minimum detail
      expect(wordCount).toBeLessThan(500); // Maximum verbosity
      expect(avgWordsPerSentence).toBeGreaterThan(8); // Adequate complexity
      expect(avgWordsPerSentence).toBeLessThan(25); // Readable complexity

      // Should contain key instruction words
      const instructionWords = ['analyze', 'consider', 'recommend', 'ensure', 'include'];
      const containsInstructions = instructionWords.some(word => 
        prompt.toLowerCase().includes(word)
      );
      expect(containsInstructions).toBe(true);
    });
  });

  describe('Bathroom Renovation Prompts', () => {
      const bathroomContext: ProjectContext = {
      projectId: 'regression-test-bathroom-001',
      projectType: 'bathroom_full_refit' as ProjectType,
      property: {
        id: 'prop-002',
        address: {
          line1: '456 Test Avenue',
          city: 'Manchester',
          postcode: 'M1 1AA',
          country: 'UK'
        },
        councilArea: 'Manchester',
        isListedBuilding: false,
        isInConservationArea: false,
        planningHistory: [],
        buildingRegulations: []
      },
      userResponses: {
        budget: '£15000',
        timeline: '6 weeks',
        accessibility: 'yes'
      },
      previousAgentResponses: []
    };

    it('should generate accessibility-aware prompts', () => {
      const promptId = 'bathroom-renovation-orchestrator';
      const prompt = promptManager.getPrompt(promptId, bathroomContext);

      // Should include accessibility considerations
      expect(prompt.toLowerCase()).toContain('accessibility');
      expect(prompt.toLowerCase()).toMatch(/grab rail|level access|wheelchair|mobility/);
    });

    it('should handle plumbing complexity appropriately', () => {
      const promptId = 'plumbing-specialist';
      const prompt = promptManager.getPrompt(promptId, bathroomContext);

      // Should include plumbing-specific considerations
      expect(prompt.toLowerCase()).toMatch(/plumbing|pipes|drainage|water pressure/);
      expect(prompt).toContain('2'); // Number of bathrooms
    });
  });

  describe('Loft Conversion Prompts', () => {
    const loftContext: ProjectContext = {
      projectId: 'regression-test-loft-001',
      projectType: 'loft_conversion_dormer' as ProjectType,
      property: {
        id: 'prop-003',
        address: {
          line1: '789 Test Road',
          city: 'Birmingham',
          postcode: 'B1 1AA',
          country: 'UK'
        },
        councilArea: 'Birmingham',
        isListedBuilding: false,
        isInConservationArea: false,
        planningHistory: [],
        buildingRegulations: []
      },
      userResponses: {
        budget: '£40000',
        timeline: '16 weeks',
        use: 'bedroom',
        dormerWindows: 'yes'
      },
      previousAgentResponses: []
    };

    it('should include structural considerations', () => {
      const promptId = 'loft-conversion-orchestrator';
      const prompt = promptManager.getPrompt(promptId, loftContext);

      // Should include structural elements
      expect(prompt.toLowerCase()).toMatch(/structural|beam|support|load bearing/);
      expect(prompt).toContain('2.1m'); // Head height
      expect(prompt).toContain('25sqm'); // Floor area
    });

    it('should consider planning permission requirements', () => {
      const promptId = 'loft-conversion-orchestrator';
      const prompt = promptManager.getPrompt(promptId, loftContext);

      // Should mention planning considerations
      expect(prompt.toLowerCase()).toMatch(/planning|permission|regulations|dormer/);
    });
  });

  describe('Prompt Performance Benchmarks', () => {
    it('should generate prompts within performance thresholds', () => {
      const contexts = [
        {
          projectId: 'perf-test-001',
          projectType: 'kitchen_full_refit' as ProjectType,
          property: {
            id: 'prop-perf-001',
            address: { line1: 'Test', city: 'Test', postcode: 'T1 1AA', country: 'UK' },
            councilArea: 'Test',
            isListedBuilding: false,
            isInConservationArea: false,
            planningHistory: [],
            buildingRegulations: []
          },
          userResponses: { budget: '£25000' },
          previousAgentResponses: []
        },
        {
          projectId: 'perf-test-002',
          projectType: 'bathroom_full_refit' as ProjectType,
          property: {
            id: 'prop-perf-002',
            address: { line1: 'Test', city: 'Test', postcode: 'T2 2AA', country: 'UK' },
            councilArea: 'Test',
            isListedBuilding: false,
            isInConservationArea: false,
            planningHistory: [],
            buildingRegulations: []
          },
          userResponses: { budget: '£18000' },
          previousAgentResponses: []
        },
        {
          projectId: 'perf-test-003',
          projectType: 'loft_conversion_dormer' as ProjectType,
          property: {
            id: 'prop-perf-003',
            address: { line1: 'Test', city: 'Test', postcode: 'T3 3AA', country: 'UK' },
            councilArea: 'Test',
            isListedBuilding: false,
            isInConservationArea: false,
            planningHistory: [],
            buildingRegulations: []
          },
          userResponses: { budget: '£45000' },
          previousAgentResponses: []
        }
      ];

      const startTime = Date.now();

      contexts.forEach(context => {
        const promptId = `${context.projectType}-orchestrator`;
        promptManager.getPrompt(promptId, context);
      });

      const executionTime = Date.now() - startTime;

      // Should generate all prompts quickly
      expect(executionTime).toBeLessThan(100); // 100ms threshold
    });

    it('should handle concurrent prompt generation', async () => {
      const context: ProjectContext = {
        projectId: 'concurrent-test-001',
        projectType: ProjectType.KITCHEN_RENOVATION,
        propertyDetails: { propertyType: 'terraced' },
        userResponses: { budget: '£30000' },
        currentStep: 1
      };

      const concurrentPromises = Array(10).fill(null).map(() =>
        Promise.resolve(promptManager.getPrompt('kitchen-renovation-orchestrator', context))
      );

      const results = await Promise.all(concurrentPromises);

      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toBe(firstResult);
      });
    });
  });

  describe('AI Response Quality Metrics', () => {
    const testAgent: AIAgent = {
      id: 'test-quality-agent',
      name: 'Quality Test Agent',
      specialization: 'kitchen',
      projectTypes: [ProjectType.KITCHEN_RENOVATION],
      promptTemplate: 'kitchen-renovation-orchestrator',
      knowledgeBase: {},
      dependencies: [],
      isOrchestrator: true
    };

    it('should measure response relevance', async () => {
      const context: ProjectContext = {
        projectId: 'quality-test-001',
        projectType: ProjectType.KITCHEN_RENOVATION,
        propertyDetails: { propertyType: 'terraced' },
        userResponses: { budget: '£30000', style: 'modern' },
        currentStep: 1
      };

      const response = await aiAgentService.invokeAgent(testAgent.id, context);

      // Response should be relevant to kitchen renovation
      const relevanceKeywords = ['kitchen', 'renovation', 'modern', '£30000', 'terraced'];
      const relevanceScore = relevanceKeywords.filter(keyword =>
        response.response.toLowerCase().includes(keyword.toLowerCase())
      ).length / relevanceKeywords.length;

      expect(relevanceScore).toBeGreaterThan(0.6); // 60% relevance threshold
    });

    it('should measure response completeness', async () => {
      const context: ProjectContext = {
        projectId: 'completeness-test-001',
        projectType: ProjectType.KITCHEN_RENOVATION,
        propertyDetails: { propertyType: 'detached' },
        userResponses: { budget: '£40000' },
        currentStep: 1
      };

      const response = await aiAgentService.invokeAgent(testAgent.id, context);

      // Should include key components
      expect(response.nextQuestions).toBeDefined();
      expect(response.recommendations).toBeDefined();
      expect(response.dependencies).toBeDefined();

      // Should have substantial content
      expect(response.response.length).toBeGreaterThan(100);
      expect(response.nextQuestions.length).toBeGreaterThan(0);
    });

    it('should measure response consistency', async () => {
      const context: ProjectContext = {
        projectId: 'consistency-test-001',
        projectType: ProjectType.KITCHEN_RENOVATION,
        propertyDetails: { propertyType: 'terraced' },
        userResponses: { budget: '£25000' },
        currentStep: 1
      };

      // Generate multiple responses for same context
      const responses = await Promise.all([
        aiAgentService.invokeAgent(testAgent.id, context),
        aiAgentService.invokeAgent(testAgent.id, context),
        aiAgentService.invokeAgent(testAgent.id, context)
      ]);

      // Responses should be similar in structure
      responses.forEach(response => {
        expect(response.agentId).toBe(testAgent.id);
        expect(response.nextQuestions.length).toBeGreaterThan(0);
        expect(response.recommendations.length).toBeGreaterThan(0);
      });

      // Should contain similar key concepts
      const keyTerms = ['kitchen', 'budget', 'timeline', 'materials'];
      responses.forEach(response => {
        const containsKeyTerms = keyTerms.filter(term =>
          response.response.toLowerCase().includes(term)
        ).length;
        expect(containsKeyTerms).toBeGreaterThan(keyTerms.length * 0.5);
      });
    });
  });

  describe('Prompt Template Validation', () => {
    it('should validate all registered prompt templates', () => {
      const availablePrompts = promptManager.getAvailablePrompts();

      availablePrompts.forEach(promptId => {
        const template = promptManager.getPromptTemplate(promptId);
        const validation = promptManager.validatePromptTemplate(template);

        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);
      });
    });

    it('should detect template syntax errors', () => {
      const invalidTemplates = [
        'Template with {{unclosed variable',
        'Template with {{invalid.nested.property}}',
        'Template with {{}}',
        'Template with {{  }}'
      ];

      invalidTemplates.forEach(template => {
        const validation = promptManager.validatePromptTemplate(template);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });
    });

    it('should ensure template coverage for all project types', () => {
      const projectTypes = Object.values(ProjectType);
      
      projectTypes.forEach(projectType => {
        const orchestratorPromptId = `${projectType}-orchestrator`;
        
        expect(() => {
          promptManager.getPromptTemplate(orchestratorPromptId);
        }).not.toThrow();
      });
    });
  });
});