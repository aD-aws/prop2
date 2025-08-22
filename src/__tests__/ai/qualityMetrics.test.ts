import { AIAgentService } from '../../lib/services/aiAgentService';
import { AgentOrchestrator } from '../../lib/services/agentOrchestrator';
import { SoWGenerationService } from '../../lib/services/sowGenerationService';
import { ProjectType, ProjectContext, AIAgent } from '../../lib/types';

interface QualityMetrics {
  accuracy: number;
  completeness: number;
  relevance: number;
  consistency: number;
  responseTime: number;
  errorRate: number;
}

interface SoWQualityMetrics {
  structuralCompleteness: number;
  costAccuracy: number;
  timelineRealism: number;
  materialSpecificity: number;
  regulatoryCompliance: number;
}

describe('AI Quality Metrics Testing', () => {
  let aiAgentService: AIAgentService;
  let orchestrator: AgentOrchestrator;
  let sowService: SoWGenerationService;

  beforeEach(() => {
    aiAgentService = new AIAgentService();
    orchestrator = new AgentOrchestrator();
    sowService = new SoWGenerationService();
  });

  describe('Agent Response Quality Metrics', () => {
    const testScenarios = [
      {
        name: 'Simple Kitchen Renovation',
        context: {
          projectId: 'quality-test-001',
          projectType: ProjectType.KITCHEN_RENOVATION,
          propertyDetails: { propertyType: 'terraced', yearBuilt: 1960 },
          userResponses: { budget: '£25000', timeline: '8 weeks' },
          currentStep: 1
        },
        expectedKeywords: ['kitchen', 'renovation', 'budget', 'timeline', 'materials'],
        minResponseLength: 200,
        maxResponseTime: 5000
      },
      {
        name: 'Complex Loft Conversion',
        context: {
          projectId: 'quality-test-002',
          projectType: ProjectType.LOFT_CONVERSION,
          propertyDetails: { 
            propertyType: 'terraced', 
            yearBuilt: 1920,
            loftSpace: { headHeight: '2.0m', floorArea: '30sqm' }
          },
          userResponses: { 
            budget: '£50000', 
            timeline: '20 weeks',
            structuralWork: 'yes',
            planningPermission: 'required'
          },
          currentStep: 1
        },
        expectedKeywords: ['loft', 'structural', 'planning', 'permission', 'regulations'],
        minResponseLength: 300,
        maxResponseTime: 7000
      },
      {
        name: 'Accessible Bathroom Renovation',
        context: {
          projectId: 'quality-test-003',
          projectType: ProjectType.BATHROOM_RENOVATION,
          propertyDetails: { propertyType: 'bungalow', yearBuilt: 1980 },
          userResponses: { 
            budget: '£18000', 
            timeline: '6 weeks',
            accessibility: 'full',
            mobility: 'wheelchair'
          },
          currentStep: 1
        },
        expectedKeywords: ['bathroom', 'accessibility', 'wheelchair', 'grab rails', 'level access'],
        minResponseLength: 250,
        maxResponseTime: 5000
      }
    ];

    testScenarios.forEach(scenario => {
      it(`should meet quality metrics for ${scenario.name}`, async () => {
        const startTime = Date.now();
        
        const agents = await orchestrator.selectAgents(
          scenario.context.projectType,
          scenario.context.propertyDetails
        );

        const orchestratorAgent = agents.find(a => a.isOrchestrator);
        expect(orchestratorAgent).toBeDefined();

        const response = await aiAgentService.invokeAgent(
          orchestratorAgent!.id,
          scenario.context
        );

        const responseTime = Date.now() - startTime;

        // Performance metrics
        expect(responseTime).toBeLessThan(scenario.maxResponseTime);

        // Content quality metrics
        expect(response.response.length).toBeGreaterThan(scenario.minResponseLength);

        // Relevance metrics
        const relevanceScore = calculateRelevanceScore(
          response.response,
          scenario.expectedKeywords
        );
        expect(relevanceScore).toBeGreaterThan(0.6);

        // Completeness metrics
        expect(response.nextQuestions).toBeDefined();
        expect(response.recommendations).toBeDefined();
        expect(response.nextQuestions.length).toBeGreaterThan(0);
        expect(response.recommendations.length).toBeGreaterThan(0);

        // Structure metrics
        const structureScore = calculateStructureScore(response.response);
        expect(structureScore).toBeGreaterThan(0.7);
      });
    });

    it('should maintain consistency across multiple invocations', async () => {
      const context: ProjectContext = {
        projectId: 'consistency-test-001',
        projectType: ProjectType.KITCHEN_RENOVATION,
        propertyDetails: { propertyType: 'detached' },
        userResponses: { budget: '£30000' },
        currentStep: 1
      };

      const agents = await orchestrator.selectAgents(
        context.projectType,
        context.propertyDetails
      );

      const orchestratorAgent = agents.find(a => a.isOrchestrator);
      
      // Generate multiple responses
      const responses = await Promise.all(
        Array(5).fill(null).map(() =>
          aiAgentService.invokeAgent(orchestratorAgent!.id, context)
        )
      );

      // Calculate consistency metrics
      const consistencyScore = calculateConsistencyScore(responses);
      expect(consistencyScore).toBeGreaterThan(0.8);

      // All responses should have similar structure
      responses.forEach(response => {
        expect(response.nextQuestions.length).toBeGreaterThan(0);
        expect(response.recommendations.length).toBeGreaterThan(0);
        expect(response.response.length).toBeGreaterThan(100);
      });
    });
  });

  describe('Statement of Work Quality Metrics', () => {
    it('should generate high-quality SoW for kitchen renovation', async () => {
      const context: ProjectContext = {
        projectId: 'sow-quality-test-001',
        projectType: ProjectType.KITCHEN_RENOVATION,
        propertyDetails: {
          propertyType: 'terraced',
          yearBuilt: 1960,
          currentKitchenSize: 'medium'
        },
        userResponses: {
          budget: '£35000',
          timeline: '12 weeks',
          style: 'contemporary',
          appliances: 'integrated'
        },
        currentStep: 1
      };

      const agents = await orchestrator.selectAgents(
        context.projectType,
        context.propertyDetails
      );

      const sowResult = await orchestrator.coordinateAgents(agents, context);

      const qualityMetrics = calculateSoWQualityMetrics(sowResult.sowDocument);

      // Structural completeness
      expect(qualityMetrics.structuralCompleteness).toBeGreaterThan(0.9);
      expect(sowResult.sowDocument.sections.length).toBeGreaterThan(5);
      expect(sowResult.sowDocument.materials.length).toBeGreaterThan(10);
      expect(sowResult.sowDocument.laborRequirements.length).toBeGreaterThan(3);

      // Cost accuracy
      expect(qualityMetrics.costAccuracy).toBeGreaterThan(0.8);
      expect(sowResult.sowDocument.estimatedCosts.total).toBeGreaterThan(0);
      expect(sowResult.sowDocument.estimatedCosts.total).toBeLessThan(context.userResponses.budget * 1.2);

      // Timeline realism
      expect(qualityMetrics.timelineRealism).toBeGreaterThan(0.8);
      expect(sowResult.ganttChart.totalDuration).toBeGreaterThan(0);
      expect(sowResult.ganttChart.tasks.length).toBeGreaterThan(5);

      // Material specificity
      expect(qualityMetrics.materialSpecificity).toBeGreaterThan(0.7);
      
      // Regulatory compliance
      expect(qualityMetrics.regulatoryCompliance).toBeGreaterThan(0.9);
    });

    it('should handle complex projects with high quality', async () => {
      const context: ProjectContext = {
        projectId: 'sow-complex-test-001',
        projectType: ProjectType.LOFT_CONVERSION,
        propertyDetails: {
          propertyType: 'terraced',
          yearBuilt: 1920,
          loftSpace: { headHeight: '2.2m', floorArea: '35sqm' },
          planningConstraints: ['conservation area']
        },
        userResponses: {
          budget: '£60000',
          timeline: '24 weeks',
          use: 'master bedroom',
          ensuite: 'yes',
          dormerWindows: 'yes'
        },
        currentStep: 1
      };

      const agents = await orchestrator.selectAgents(
        context.projectType,
        context.propertyDetails
      );

      const sowResult = await orchestrator.coordinateAgents(agents, context);

      // Should include planning permission requirements
      expect(sowResult.sowDocument.regulatoryRequirements.length).toBeGreaterThan(0);
      
      const planningRequirement = sowResult.sowDocument.regulatoryRequirements.find(
        req => req.type === 'planning-permission'
      );
      expect(planningRequirement).toBeDefined();

      // Should include conservation area considerations
      const conservationConsiderations = sowResult.sowDocument.sections.find(
        section => section.title.toLowerCase().includes('conservation')
      );
      expect(conservationConsiderations).toBeDefined();

      // Timeline should account for planning permission delays
      expect(sowResult.ganttChart.totalDuration).toBeGreaterThan(20);
    });
  });

  describe('Error Rate and Reliability Metrics', () => {
    it('should maintain low error rates under normal conditions', async () => {
      const testContexts = Array(20).fill(null).map((_, index) => ({
        projectId: `error-rate-test-${index}`,
        projectType: ProjectType.KITCHEN_RENOVATION,
        propertyDetails: { propertyType: 'terraced' },
        userResponses: { budget: `£${25000 + index * 1000}` },
        currentStep: 1
      }));

      const results = await Promise.allSettled(
        testContexts.map(async context => {
          const agents = await orchestrator.selectAgents(
            context.projectType,
            context.propertyDetails
          );
          const orchestratorAgent = agents.find(a => a.isOrchestrator);
          return aiAgentService.invokeAgent(orchestratorAgent!.id, context);
        })
      );

      const successfulResults = results.filter(r => r.status === 'fulfilled');
      const errorRate = (results.length - successfulResults.length) / results.length;

      expect(errorRate).toBeLessThan(0.05); // Less than 5% error rate
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCases = [
        {
          projectId: 'edge-case-001',
          projectType: ProjectType.KITCHEN_RENOVATION,
          propertyDetails: {},
          userResponses: {},
          currentStep: 1
        },
        {
          projectId: 'edge-case-002',
          projectType: ProjectType.BATHROOM_RENOVATION,
          propertyDetails: { propertyType: 'unusual-property-type' },
          userResponses: { budget: '£1' },
          currentStep: 1
        }
      ];

      for (const context of edgeCases) {
        try {
          const agents = await orchestrator.selectAgents(
            context.projectType,
            context.propertyDetails
          );
          
          if (agents.length > 0) {
            const orchestratorAgent = agents.find(a => a.isOrchestrator);
            if (orchestratorAgent) {
              const response = await aiAgentService.invokeAgent(orchestratorAgent.id, context);
              expect(response).toBeDefined();
            }
          }
        } catch (error) {
          // Should handle errors gracefully without crashing
          expect(error).toBeInstanceOf(Error);
        }
      }
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet response time benchmarks', async () => {
      const benchmarkTests = [
        { name: 'Simple Query', maxTime: 2000, complexity: 'low' },
        { name: 'Medium Query', maxTime: 5000, complexity: 'medium' },
        { name: 'Complex Query', maxTime: 10000, complexity: 'high' }
      ];

      for (const test of benchmarkTests) {
        const startTime = Date.now();

        const context: ProjectContext = {
          projectId: `benchmark-${test.complexity}`,
          projectType: ProjectType.KITCHEN_RENOVATION,
          propertyDetails: { propertyType: 'detached' },
          userResponses: { budget: '£30000' },
          currentStep: 1
        };

        const agents = await orchestrator.selectAgents(
          context.projectType,
          context.propertyDetails
        );

        const orchestratorAgent = agents.find(a => a.isOrchestrator);
        await aiAgentService.invokeAgent(orchestratorAgent!.id, context);

        const executionTime = Date.now() - startTime;
        expect(executionTime).toBeLessThan(test.maxTime);
      }
    });
  });

  // Helper functions
  function calculateRelevanceScore(response: string, keywords: string[]): number {
    const lowerResponse = response.toLowerCase();
    const matchedKeywords = keywords.filter(keyword =>
      lowerResponse.includes(keyword.toLowerCase())
    );
    return matchedKeywords.length / keywords.length;
  }

  function calculateStructureScore(response: string): number {
    let score = 0;
    
    // Check for proper sentence structure
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 3) score += 0.3;
    
    // Check for paragraphs
    const paragraphs = response.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (paragraphs.length > 1) score += 0.3;
    
    // Check for lists or structured content
    if (response.includes('•') || response.includes('-') || response.includes('1.')) {
      score += 0.2;
    }
    
    // Check for proper capitalization
    const properCapitalization = sentences.every(s => 
      s.trim().charAt(0) === s.trim().charAt(0).toUpperCase()
    );
    if (properCapitalization) score += 0.2;
    
    return score;
  }

  function calculateConsistencyScore(responses: any[]): number {
    if (responses.length < 2) return 1;
    
    // Compare structure consistency
    const structureScores = responses.map(r => ({
      questionCount: r.nextQuestions.length,
      recommendationCount: r.recommendations.length,
      responseLength: r.response.length
    }));
    
    const avgQuestions = structureScores.reduce((sum, s) => sum + s.questionCount, 0) / structureScores.length;
    const avgRecommendations = structureScores.reduce((sum, s) => sum + s.recommendationCount, 0) / structureScores.length;
    const avgLength = structureScores.reduce((sum, s) => sum + s.responseLength, 0) / structureScores.length;
    
    const questionVariance = structureScores.reduce((sum, s) => sum + Math.pow(s.questionCount - avgQuestions, 2), 0) / structureScores.length;
    const recommendationVariance = structureScores.reduce((sum, s) => sum + Math.pow(s.recommendationCount - avgRecommendations, 2), 0) / structureScores.length;
    const lengthVariance = structureScores.reduce((sum, s) => sum + Math.pow(s.responseLength - avgLength, 2), 0) / structureScores.length;
    
    // Lower variance = higher consistency
    const consistencyScore = 1 - Math.min(1, (questionVariance + recommendationVariance + lengthVariance / 10000) / 3);
    
    return consistencyScore;
  }

  function calculateSoWQualityMetrics(sowDocument: any): SoWQualityMetrics {
    return {
      structuralCompleteness: calculateStructuralCompleteness(sowDocument),
      costAccuracy: calculateCostAccuracy(sowDocument),
      timelineRealism: calculateTimelineRealism(sowDocument),
      materialSpecificity: calculateMaterialSpecificity(sowDocument),
      regulatoryCompliance: calculateRegulatoryCompliance(sowDocument)
    };
  }

  function calculateStructuralCompleteness(sowDocument: any): number {
    let score = 0;
    
    if (sowDocument.sections && sowDocument.sections.length > 0) score += 0.2;
    if (sowDocument.materials && sowDocument.materials.length > 0) score += 0.2;
    if (sowDocument.laborRequirements && sowDocument.laborRequirements.length > 0) score += 0.2;
    if (sowDocument.timeline && sowDocument.timeline.length > 0) score += 0.2;
    if (sowDocument.estimatedCosts && sowDocument.estimatedCosts.total > 0) score += 0.2;
    
    return score;
  }

  function calculateCostAccuracy(sowDocument: any): number {
    // Simplified cost accuracy check
    if (!sowDocument.estimatedCosts) return 0;
    
    const { total, labor, materials } = sowDocument.estimatedCosts;
    
    if (total > 0 && labor > 0 && materials > 0) {
      const sum = labor + materials;
      const accuracy = 1 - Math.abs(total - sum) / total;
      return Math.max(0, accuracy);
    }
    
    return 0.5; // Partial score if some costs are present
  }

  function calculateTimelineRealism(sowDocument: any): number {
    // Simplified timeline realism check
    if (!sowDocument.timeline || sowDocument.timeline.length === 0) return 0;
    
    // Check if timeline has reasonable duration
    const totalDays = sowDocument.timeline.reduce((sum: number, task: any) => sum + (task.duration || 0), 0);
    
    if (totalDays > 7 && totalDays < 365) { // Between 1 week and 1 year
      return 1;
    }
    
    return 0.5;
  }

  function calculateMaterialSpecificity(sowDocument: any): number {
    if (!sowDocument.materials || sowDocument.materials.length === 0) return 0;
    
    const specificMaterials = sowDocument.materials.filter((material: any) =>
      material.description && material.description.length > 10 && material.quantity
    );
    
    return specificMaterials.length / sowDocument.materials.length;
  }

  function calculateRegulatoryCompliance(sowDocument: any): number {
    // Check if regulatory requirements are considered
    if (sowDocument.regulatoryRequirements && sowDocument.regulatoryRequirements.length > 0) {
      return 1;
    }
    
    // Check if compliance is mentioned in sections
    const complianceMentioned = sowDocument.sections?.some((section: any) =>
      section.content?.toLowerCase().includes('regulation') ||
      section.content?.toLowerCase().includes('compliance') ||
      section.content?.toLowerCase().includes('building control')
    );
    
    return complianceMentioned ? 0.7 : 0.3;
  }
});