import { BuilderProfile, Project, Quote } from '@/lib/types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

// Import after mocking
import { builderDashboardService, BuilderAnalytics } from '../builderDashboardService';

describe('BuilderDashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateAnalytics', () => {
    it('should calculate correct analytics from projects and quotes', () => {
      const mockProjects: Project[] = [
        {
          id: 'proj1',
          homeownerId: 'home1',
          propertyId: 'prop1',
          projectType: 'kitchen_full_refit',
          status: 'completion',
          selectedBuilderId: 'builder1',
          quotes: [],
          invitedBuilders: [{ builderId: 'builder1', invitationCode: 'code1', invitedAt: new Date(), accessedAt: new Date(), quoteSubmitted: true, status: 'selected' }],
          timeline: { milestones: [] },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: 'proj2',
          homeownerId: 'home2',
          propertyId: 'prop2',
          projectType: 'bathroom_full_refit',
          status: 'builder_selection',
          quotes: [],
          invitedBuilders: [{ builderId: 'builder1', invitationCode: 'code2', invitedAt: new Date(), accessedAt: new Date(), quoteSubmitted: true, status: 'invited' }],
          timeline: { milestones: [] },
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-20'),
        },
      ];

      const mockQuotes: Quote[] = [
        {
          id: 'quote1',
          projectId: 'proj1',
          builderId: 'builder1',
          pricing: { totalAmount: 15000, laborCosts: 8000, materialCosts: 7000, breakdown: [] },
          timeline: 14,
          startDate: new Date('2024-02-01'),
          projectedCompletionDate: new Date('2024-02-20'),
          amendments: [],
          termsAndConditions: 'Standard terms',
          insuranceDocuments: [],
          referenceProjects: [],
          status: 'accepted',
          submittedAt: new Date('2024-01-05'),
        },
        {
          id: 'quote2',
          projectId: 'proj2',
          builderId: 'builder1',
          pricing: { totalAmount: 12000, laborCosts: 6000, materialCosts: 6000, breakdown: [] },
          timeline: 10,
          startDate: new Date('2024-02-15'),
          projectedCompletionDate: new Date('2024-02-28'),
          amendments: [],
          termsAndConditions: 'Standard terms',
          insuranceDocuments: [],
          referenceProjects: [],
          status: 'submitted',
          submittedAt: new Date('2024-01-12'),
        },
      ];

      // Access the private method through type assertion
      const analytics = (builderDashboardService as any).calculateAnalytics(mockProjects, mockQuotes);

      expect(analytics.totalProjectsInvited).toBe(2);
      expect(analytics.totalQuotesSubmitted).toBe(2);
      expect(analytics.totalProjectsWon).toBe(1);
      expect(analytics.totalProjectsCompleted).toBe(1);
      expect(analytics.winRate).toBe(50); // 1 win out of 2 quotes
      expect(analytics.averageQuoteValue).toBe(13500); // (15000 + 12000) / 2
      expect(analytics.totalRevenue).toBe(15000); // Only from won project
    });

    it('should handle empty projects and quotes arrays', () => {
      const analytics = (builderDashboardService as any).calculateAnalytics([], []);

      expect(analytics.totalProjectsInvited).toBe(0);
      expect(analytics.totalQuotesSubmitted).toBe(0);
      expect(analytics.totalProjectsWon).toBe(0);
      expect(analytics.totalProjectsCompleted).toBe(0);
      expect(analytics.winRate).toBe(0);
      expect(analytics.averageQuoteValue).toBe(0);
      expect(analytics.totalRevenue).toBe(0);
    });

    it('should calculate top project types correctly', () => {
      const mockProjects: Project[] = [
        {
          id: 'proj1',
          homeownerId: 'home1',
          propertyId: 'prop1',
          projectType: 'kitchen_full_refit',
          status: 'completion',
          selectedBuilderId: 'builder1',
          quotes: [],
          invitedBuilders: [],
          timeline: { milestones: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'proj2',
          homeownerId: 'home2',
          propertyId: 'prop2',
          projectType: 'kitchen_full_refit',
          status: 'builder_selection',
          quotes: [],
          invitedBuilders: [],
          timeline: { milestones: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'proj3',
          homeownerId: 'home3',
          propertyId: 'prop3',
          projectType: 'bathroom_full_refit',
          status: 'completion',
          selectedBuilderId: 'builder1',
          quotes: [],
          invitedBuilders: [],
          timeline: { milestones: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const analytics = (builderDashboardService as any).calculateAnalytics(mockProjects, []);

      expect(analytics.topProjectTypes).toHaveLength(2);
      expect(analytics.topProjectTypes[0].projectType).toBe('kitchen_full_refit');
      expect(analytics.topProjectTypes[0].count).toBe(2);
      expect(analytics.topProjectTypes[0].winRate).toBe(50); // 1 win out of 2
      expect(analytics.topProjectTypes[1].projectType).toBe('bathroom_full_refit');
      expect(analytics.topProjectTypes[1].count).toBe(1);
      expect(analytics.topProjectTypes[1].winRate).toBe(100); // 1 win out of 1
    });
  });

  describe('calculateCompletionDate', () => {
    it('should calculate completion date excluding weekends', () => {
      // Start on a Monday (2024-01-01 was a Monday)
      const startDate = new Date('2024-01-01');
      const workingDays = 5;

      const completionDate = (builderDashboardService as any).calculateCompletionDate(startDate, workingDays);

      // Should be Monday of next week (5 working days later)
      expect(completionDate.getDay()).toBe(1); // Monday
      expect(completionDate.getDate()).toBe(8); // January 8th
    });

    it('should skip weekends when calculating completion date', () => {
      // Start on a Friday (2024-01-05 was a Friday)
      const startDate = new Date('2024-01-05');
      const workingDays = 3;

      const completionDate = (builderDashboardService as any).calculateCompletionDate(startDate, workingDays);

      // Should be Wednesday of next week (skipping weekend)
      expect(completionDate.getDay()).toBe(3); // Wednesday
      expect(completionDate.getDate()).toBe(10); // January 10th
    });
  });

  describe('helper methods', () => {
    it('should correctly identify if builder is invited to project', () => {
      const builderId = 'builder1';
      const project: Project = {
        id: 'proj1',
        homeownerId: 'home1',
        propertyId: 'prop1',
        projectType: 'kitchen_full_refit',
        status: 'builder_invitation',
        quotes: [],
        invitedBuilders: [
          { builderId: 'builder1', invitationCode: 'code1', invitedAt: new Date(), accessedAt: new Date(), quoteSubmitted: false, status: 'invited' },
          { builderId: 'builder2', invitationCode: 'code2', invitedAt: new Date(), accessedAt: new Date(), quoteSubmitted: false, status: 'invited' },
        ],
        timeline: { milestones: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const isInvited = (builderDashboardService as any).isInvitedToProject(builderId, project);
      expect(isInvited).toBe(true);

      const isNotInvited = (builderDashboardService as any).isInvitedToProject('builder3', project);
      expect(isNotInvited).toBe(false);
    });

    it('should correctly identify if builder has quoted for project', () => {
      const builderId = 'builder1';
      const project: Project = {
        id: 'proj1',
        homeownerId: 'home1',
        propertyId: 'prop1',
        projectType: 'kitchen_full_refit',
        status: 'quote_collection',
        quotes: [],
        invitedBuilders: [],
        timeline: { milestones: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const quotes: Quote[] = [
        {
          id: 'quote1',
          projectId: 'proj1',
          builderId: 'builder1',
          pricing: { totalAmount: 15000, laborCosts: 8000, materialCosts: 7000, breakdown: [] },
          timeline: 14,
          startDate: new Date(),
          projectedCompletionDate: new Date(),
          amendments: [],
          termsAndConditions: 'Standard terms',
          insuranceDocuments: [],
          referenceProjects: [],
          status: 'submitted',
          submittedAt: new Date(),
        },
      ];

      const hasQuoted = (builderDashboardService as any).hasQuotedForProject(builderId, project, quotes);
      expect(hasQuoted).toBe(true);

      const hasNotQuoted = (builderDashboardService as any).hasQuotedForProject('builder2', project, quotes);
      expect(hasNotQuoted).toBe(false);
    });
  });
});