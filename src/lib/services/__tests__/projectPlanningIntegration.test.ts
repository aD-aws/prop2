import { questionnaireService } from '../questionnaireService';
import { sowGenerationService } from '../sowGenerationService';
import { materialClassificationService } from '../materialClassificationService';
import { laborCostService } from '../laborCostService';
import { ProjectType } from '../../types';

// Mock external dependencies
jest.mock('../aiAgentService');
jest.mock('../agentSelector');
jest.mock('../aiService');

describe('Project Planning Integration', () => {
  beforeEach(() => {
    // Clean up services
    questionnaireService.cleanupSessions();
    sowGenerationService.cleanupJobs();
  });

  it('should complete the full project planning flow', async () => {
    const projectId = 'integration-test-project';
    const projectType: ProjectType = 'kitchen_full_refit';

    // Step 1: Start questionnaire
    const questionnaireResponse = await questionnaireService.startQuestionnaire(
      projectId,
      projectType
    );

    expect(questionnaireResponse).toBeDefined();
    expect(questionnaireResponse.question).toBeDefined();

    // Step 2: Answer questions (simulate completing questionnaire)
    const answers = {
      [questionnaireResponse.question.id]: 'Under £5,000',
      project_timeline: 'Within 3-6 months',
      property_age: '1980-2000'
    };

    // Complete questionnaire
    const completedAnswers = questionnaireService.completeQuestionnaire(
      questionnaireResponse.sessionId
    );

    expect(completedAnswers).toBeDefined();

    // Step 3: Start SoW generation
    const sowGeneration = await sowGenerationService.startSoWGeneration(
      {
        projectId,
        projectType,
        propertyId: 'test-property',
        userResponses: { ...completedAnswers, ...answers }
      },
      {
        preferredMethod: 'email',
        email: 'test@example.com'
      }
    );

    expect(sowGeneration.jobId).toBeDefined();
    expect(sowGeneration.estimatedCompletionTime).toBeInstanceOf(Date);

    // Step 4: Check job status
    const job = sowGenerationService.getJobStatus(sowGeneration.jobId);
    expect(job).toBeDefined();
    expect(job?.projectId).toBe(projectId);
  });

  it('should handle material classification correctly', async () => {
    const materials = [
      {
        id: 'mat-1',
        name: 'Kitchen Units',
        category: 'builder_provided' as const,
        quantity: 1,
        unit: 'set',
        specifications: []
      },
      {
        id: 'mat-2',
        name: 'Structural Timber',
        category: 'builder_provided' as const,
        quantity: 10,
        unit: 'linear meters',
        specifications: []
      }
    ];

    const classified = await materialClassificationService.classifyMaterials(
      materials,
      'kitchen_full_refit'
    );

    expect(classified).toHaveLength(2);
    expect(classified[0].category).toBe('homeowner_provided'); // Kitchen units should be homeowner provided
    expect(classified[1].category).toBe('builder_provided'); // Structural timber should be builder provided
  });

  it('should calculate labor costs with regional variations', async () => {
    const laborRequirements = [
      {
        id: 'labor-1',
        trade: 'carpenter',
        description: 'Kitchen installation',
        personDays: 5,
        qualifications: []
      },
      {
        id: 'labor-2',
        trade: 'electrician',
        description: 'Kitchen electrical work',
        personDays: 2,
        qualifications: []
      }
    ];

    const calculated = await laborCostService.calculateLaborCosts(
      laborRequirements,
      'kitchen_full_refit',
      { region: 'london', timeline: 'normal' }
    );

    expect(calculated).toHaveLength(2);
    expect(calculated[0].estimatedCost).toBeGreaterThan(0);
    expect(calculated[1].estimatedCost).toBeGreaterThan(0);

    // London rates should be higher than northern rates
    const northernCalculated = await laborCostService.calculateLaborCosts(
      laborRequirements,
      'kitchen_full_refit',
      { region: 'north', timeline: 'normal' }
    );

    expect(calculated[0].estimatedCost).toBeGreaterThan(northernCalculated[0].estimatedCost!);
  });

  it('should handle "others" project type with AI categorization', async () => {
    const projectId = 'others-test-project';
    const customDescription = 'I want to build a custom wine cellar with temperature control';

    const questionnaireResponse = await questionnaireService.startQuestionnaire(
      projectId,
      'others',
      customDescription
    );

    expect(questionnaireResponse).toBeDefined();
    expect(questionnaireResponse.question).toBeDefined();

    // The session should have the custom description stored
    const session = questionnaireService.getSession(questionnaireResponse.sessionId);
    expect(session?.answers.projectDescription).toBe(customDescription);
  });

  it('should provide accurate cost estimates', () => {
    // Test material cost estimation
    const materialCost = materialClassificationService.getMaterialCost('ceramic wall tiles');
    expect(materialCost).toBeDefined();
    expect(materialCost?.basePrice).toBeGreaterThan(0);

    // Test labor rate retrieval
    const carpenterRate = laborCostService.getAverageDailyRate('carpenter');
    expect(carpenterRate).toBeGreaterThan(0);

    // Test project duration estimation
    const laborRequirements = [
      {
        id: 'labor-1',
        trade: 'carpenter',
        description: 'Kitchen installation',
        personDays: 5,
        qualifications: []
      }
    ];

    const duration = laborCostService.estimateProjectDuration(laborRequirements);
    expect(duration.sequentialDays).toBe(5);
    expect(duration.recommendedDuration).toBeGreaterThan(0);
  });
});