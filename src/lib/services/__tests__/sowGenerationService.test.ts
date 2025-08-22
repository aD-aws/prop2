import { sowGenerationService } from '../sowGenerationService';
import { ProjectType } from '../../types';

// Mock the aiService
jest.mock('../aiService', () => ({
  aiService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    generateSoW: jest.fn().mockResolvedValue({
      sowDocument: {
        id: 'test-sow',
        projectId: 'test-project',
        version: 1,
        sections: [],
        materials: [],
        laborRequirements: [],
        timeline: [],
        estimatedCosts: {
          totalEstimate: 25000,
          laborCosts: 15000,
          materialCosts: 10000,
          builderMaterials: 6000,
          homeownerMaterials: 4000,
          breakdown: []
        },
        regulatoryRequirements: [],
        generatedAt: new Date()
      },
      ganttChart: {
        id: 'test-gantt',
        projectId: 'test-project',
        tasks: [],
        totalDuration: 30,
        criticalPath: [],
        generatedAt: new Date()
      },
      processingTime: 5000,
      agentsUsed: ['kitchen_agent', 'electrical_agent'],
      orchestrationId: 'test-orchestration'
    })
  }
}));

// Mock the material classification service
jest.mock('../materialClassificationService', () => ({
  materialClassificationService: {
    classifyMaterials: jest.fn().mockResolvedValue([
      {
        id: 'material-1',
        name: 'Kitchen Units',
        category: 'homeowner_provided',
        quantity: 1,
        unit: 'set',
        estimatedCost: 3000,
        specifications: []
      }
    ])
  }
}));

// Mock the labor cost service
jest.mock('../laborCostService', () => ({
  laborCostService: {
    calculateLaborCosts: jest.fn().mockResolvedValue([
      {
        id: 'labor-1',
        trade: 'carpenter',
        description: 'Kitchen installation',
        personDays: 5,
        estimatedCost: 1200,
        qualifications: []
      }
    ])
  }
}));

describe('SoWGenerationService', () => {
  beforeEach(() => {
    // Clear any existing jobs
    sowGenerationService.cleanupJobs();
  });

  describe('startSoWGeneration', () => {
    it('should start SoW generation and return job details', async () => {
      const request = {
        projectId: 'test-project-1',
        projectType: 'kitchen_full_refit' as ProjectType,
        propertyId: 'test-property',
        userResponses: {
          budget: 'Under £5,000',
          timeline: 'Within 3-6 months'
        }
      };

      const notifications = {
        preferredMethod: 'email' as const,
        email: 'test@example.com'
      };

      const result = await sowGenerationService.startSoWGeneration(request, notifications);

      expect(result).toBeDefined();
      expect(result.jobId).toBeDefined();
      expect(result.estimatedCompletionTime).toBeInstanceOf(Date);

      // Check that job was created
      const job = sowGenerationService.getJobStatus(result.jobId);
      expect(job).toBeDefined();
      expect(job?.projectId).toBe(request.projectId);
      expect(job?.status).toBe('queued');
    });

    it('should handle "others" project type with custom description', async () => {
      const request = {
        projectId: 'test-project-2',
        projectType: 'others' as ProjectType,
        propertyId: 'test-property',
        userResponses: {
          budget: 'Under £5,000'
        },
        customDescription: 'Build a custom wine cellar'
      };

      const notifications = {
        preferredMethod: 'email' as const,
        email: 'test@example.com'
      };

      const result = await sowGenerationService.startSoWGeneration(request, notifications);

      expect(result).toBeDefined();
      expect(result.jobId).toBeDefined();
    });
  });

  describe('getJobStatus', () => {
    it('should return job status', async () => {
      const request = {
        projectId: 'test-project-3',
        projectType: 'bathroom_full_refit' as ProjectType,
        propertyId: 'test-property',
        userResponses: {}
      };

      const notifications = {
        preferredMethod: 'email' as const,
        email: 'test@example.com'
      };

      const { jobId } = await sowGenerationService.startSoWGeneration(request, notifications);
      const job = sowGenerationService.getJobStatus(jobId);

      expect(job).toBeDefined();
      expect(job?.id).toBe(jobId);
      expect(job?.projectId).toBe(request.projectId);
    });

    it('should return null for non-existent job', () => {
      const job = sowGenerationService.getJobStatus('non-existent-job');
      expect(job).toBeNull();
    });
  });

  describe('modifySoW', () => {
    it('should create new generation job for modifications', async () => {
      const modificationRequest = {
        projectId: 'test-project-4',
        sowId: 'test-sow-1',
        modifications: {
          userResponses: {
            budget: '£15,000 - £30,000'
          }
        },
        reason: 'Budget increase'
      };

      const result = await sowGenerationService.modifySoW(modificationRequest);

      expect(result).toBeDefined();
      expect(result.jobId).toBeDefined();
      expect(result.estimatedCompletionTime).toBeInstanceOf(Date);
    });
  });

  describe('cancelJob', () => {
    it('should cancel an active job', async () => {
      const request = {
        projectId: 'test-project-5',
        projectType: 'kitchen_full_refit' as ProjectType,
        propertyId: 'test-property',
        userResponses: {}
      };

      const notifications = {
        preferredMethod: 'email' as const,
        email: 'test@example.com'
      };

      const { jobId } = await sowGenerationService.startSoWGeneration(request, notifications);
      
      const cancelled = sowGenerationService.cancelJob(jobId);
      expect(cancelled).toBe(true);

      const job = sowGenerationService.getJobStatus(jobId);
      expect(job?.status).toBe('failed');
      expect(job?.error).toBe('Cancelled by user');
    });

    it('should not cancel completed job', async () => {
      const request = {
        projectId: 'test-project-6',
        projectType: 'kitchen_full_refit' as ProjectType,
        propertyId: 'test-property',
        userResponses: {}
      };

      const notifications = {
        preferredMethod: 'email' as const,
        email: 'test@example.com'
      };

      const { jobId } = await sowGenerationService.startSoWGeneration(request, notifications);
      
      // Manually set job as completed
      const job = sowGenerationService.getJobStatus(jobId);
      if (job) {
        job.status = 'completed';
      }

      const cancelled = sowGenerationService.cancelJob(jobId);
      expect(cancelled).toBe(false);
    });
  });

  describe('getProjectJobs', () => {
    it('should return all jobs for a project', async () => {
      const projectId = 'test-project-7';
      
      const request1 = {
        projectId,
        projectType: 'kitchen_full_refit' as ProjectType,
        propertyId: 'test-property',
        userResponses: {}
      };

      const request2 = {
        projectId,
        projectType: 'kitchen_full_refit' as ProjectType,
        propertyId: 'test-property',
        userResponses: { modified: true }
      };

      const notifications = {
        preferredMethod: 'email' as const,
        email: 'test@example.com'
      };

      await sowGenerationService.startSoWGeneration(request1, notifications);
      await sowGenerationService.startSoWGeneration(request2, notifications);

      const jobs = sowGenerationService.getProjectJobs(projectId);
      expect(jobs).toHaveLength(2);
      expect(jobs.every(job => job.projectId === projectId)).toBe(true);
    });

    it('should return empty array for project with no jobs', () => {
      const jobs = sowGenerationService.getProjectJobs('non-existent-project');
      expect(jobs).toHaveLength(0);
    });
  });

  describe('job processing simulation', () => {
    it('should process job through all phases', async () => {
      const request = {
        projectId: 'test-project-8',
        projectType: 'kitchen_full_refit' as ProjectType,
        propertyId: 'test-property',
        userResponses: {
          budget: 'Under £5,000'
        }
      };

      const notifications = {
        preferredMethod: 'email' as const,
        email: 'test@example.com'
      };

      const { jobId } = await sowGenerationService.startSoWGeneration(request, notifications);

      // Wait a bit for processing to start
      await new Promise(resolve => setTimeout(resolve, 100));

      const job = sowGenerationService.getJobStatus(jobId);
      expect(job?.status).toBe('processing');
      expect(job?.progress).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle AI service failures gracefully', async () => {
      // Mock AI service to fail
      const { aiService } = require('../aiService');
      aiService.generateSoW.mockRejectedValueOnce(new Error('AI service unavailable'));

      const request = {
        projectId: 'test-project-9',
        projectType: 'kitchen_full_refit' as ProjectType,
        propertyId: 'test-property',
        userResponses: {}
      };

      const notifications = {
        preferredMethod: 'email' as const,
        email: 'test@example.com'
      };

      const { jobId } = await sowGenerationService.startSoWGeneration(request, notifications);

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      const job = sowGenerationService.getJobStatus(jobId);
      expect(job?.status).toBe('failed');
      expect(job?.error).toContain('AI service unavailable');
    });
  });
});