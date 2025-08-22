import { questionnaireService } from '../questionnaireService';
import { ProjectType } from '../../types';

// Mock the aiAgentService
jest.mock('../aiAgentService', () => ({
  aiAgentService: {
    invokeAgent: jest.fn().mockResolvedValue({
      agentId: 'test-agent',
      response: 'Mock response',
      confidence: 0.9,
      recommendations: [],
      nextQuestions: [],
      data: {
        questions: [
          {
            id: 'test_question',
            text: 'Test question?',
            type: 'text',
            validation: { required: true }
          }
        ]
      }
    })
  }
}));

// Mock the agentSelector
jest.mock('../agentSelector', () => ({
  agentSelector: {
    analyzeOthersProject: jest.fn().mockResolvedValue({
      recommendedAgent: 'general_project_agent'
    }),
    getRequiredAgents: jest.fn().mockResolvedValue({
      orchestrator: { id: 'kitchen_agent' },
      specialists: [{ id: 'electrical_agent' }]
    })
  }
}));

describe('QuestionnaireService', () => {
  beforeEach(() => {
    // Clear any existing sessions
    questionnaireService.cleanupSessions();
  });

  describe('startQuestionnaire', () => {
    it('should start a questionnaire for a standard project type', async () => {
      const projectId = 'test-project-1';
      const projectType: ProjectType = 'kitchen_full_refit';

      const response = await questionnaireService.startQuestionnaire(
        projectId,
        projectType
      );

      expect(response).toBeDefined();
      expect(response.sessionId).toBeDefined();
      expect(response.question).toBeDefined();
      expect(response.progress).toBe(0);
      expect(response.isLastQuestion).toBe(false);
    });

    it('should start a questionnaire for "others" project type with custom description', async () => {
      const projectId = 'test-project-2';
      const projectType: ProjectType = 'others';
      const customDescription = 'I want to build a custom wine cellar';

      const response = await questionnaireService.startQuestionnaire(
        projectId,
        projectType,
        customDescription
      );

      expect(response).toBeDefined();
      expect(response.sessionId).toBeDefined();
      expect(response.question).toBeDefined();
    });

    it('should generate default questions when AI agent fails', async () => {
      // Mock AI agent to throw error
      const { aiAgentService } = require('../aiAgentService');
      aiAgentService.invokeAgent.mockRejectedValueOnce(new Error('AI service unavailable'));

      const projectId = 'test-project-3';
      const projectType: ProjectType = 'bathroom_full_refit';

      const response = await questionnaireService.startQuestionnaire(
        projectId,
        projectType
      );

      expect(response).toBeDefined();
      expect(response.question).toBeDefined();
      expect(response.question.text).toContain('budget');
    });
  });

  describe('answerQuestion', () => {
    it('should accept a valid answer and return next question', async () => {
      const projectId = 'test-project-4';
      const projectType: ProjectType = 'kitchen_full_refit';

      // Start questionnaire
      const startResponse = await questionnaireService.startQuestionnaire(
        projectId,
        projectType
      );

      // Answer the first question
      const answerResponse = await questionnaireService.answerQuestion(
        startResponse.sessionId,
        startResponse.question.id,
        'Under £5,000'
      );

      expect(answerResponse).toBeDefined();
      if (answerResponse) {
        expect(answerResponse.progress).toBeGreaterThan(0);
      }
    });

    it('should validate required answers', async () => {
      const projectId = 'test-project-5';
      const projectType: ProjectType = 'kitchen_full_refit';

      const startResponse = await questionnaireService.startQuestionnaire(
        projectId,
        projectType
      );

      // Try to submit empty answer for required question
      await expect(
        questionnaireService.answerQuestion(
          startResponse.sessionId,
          startResponse.question.id,
          ''
        )
      ).rejects.toThrow('This question is required');
    });

    it('should complete questionnaire when all questions answered', async () => {
      const projectId = 'test-project-6';
      const projectType: ProjectType = 'kitchen_full_refit';

      const startResponse = await questionnaireService.startQuestionnaire(
        projectId,
        projectType
      );

      // Mock that this is the last question
      const session = questionnaireService.getSession(startResponse.sessionId);
      if (session) {
        session.questions = [session.questions[0]]; // Only one question
      }

      const answerResponse = await questionnaireService.answerQuestion(
        startResponse.sessionId,
        startResponse.question.id,
        'Under £5,000'
      );

      expect(answerResponse).toBeNull(); // No more questions
    });
  });

  describe('getSession', () => {
    it('should return session data', async () => {
      const projectId = 'test-project-7';
      const projectType: ProjectType = 'kitchen_full_refit';

      const startResponse = await questionnaireService.startQuestionnaire(
        projectId,
        projectType
      );

      const session = questionnaireService.getSession(startResponse.sessionId);

      expect(session).toBeDefined();
      expect(session?.projectId).toBe(projectId);
      expect(session?.projectType).toBe(projectType);
    });

    it('should return null for non-existent session', () => {
      const session = questionnaireService.getSession('non-existent-session');
      expect(session).toBeNull();
    });
  });

  describe('completeQuestionnaire', () => {
    it('should return all answers when questionnaire is completed', async () => {
      const projectId = 'test-project-8';
      const projectType: ProjectType = 'kitchen_full_refit';

      const startResponse = await questionnaireService.startQuestionnaire(
        projectId,
        projectType
      );

      // Answer a question
      await questionnaireService.answerQuestion(
        startResponse.sessionId,
        startResponse.question.id,
        'Under £5,000'
      );

      const answers = questionnaireService.completeQuestionnaire(startResponse.sessionId);

      expect(answers).toBeDefined();
      expect(answers[startResponse.question.id]).toBe('Under £5,000');
    });
  });

  describe('validation', () => {
    it('should validate number inputs', async () => {
      const projectId = 'test-project-9';
      const projectType: ProjectType = 'kitchen_full_refit';

      // Create a session with a number question
      const startResponse = await questionnaireService.startQuestionnaire(
        projectId,
        projectType
      );

      const session = questionnaireService.getSession(startResponse.sessionId);
      if (session) {
        session.questions[0] = {
          id: 'number_question',
          text: 'How many rooms?',
          type: 'number',
          validation: { required: true, min: 1, max: 10 }
        };
      }

      // Test valid number
      const validResponse = await questionnaireService.answerQuestion(
        startResponse.sessionId,
        'number_question',
        5
      );
      expect(validResponse).toBeDefined();
    });

    it('should validate pattern matching', async () => {
      const projectId = 'test-project-10';
      const projectType: ProjectType = 'kitchen_full_refit';

      const startResponse = await questionnaireService.startQuestionnaire(
        projectId,
        projectType
      );

      const session = questionnaireService.getSession(startResponse.sessionId);
      if (session) {
        session.questions[0] = {
          id: 'pattern_question',
          text: 'Enter area in m²',
          type: 'text',
          validation: { required: true, pattern: '^[0-9]+m²?$' }
        };
      }

      // Test valid pattern
      const validResponse = await questionnaireService.answerQuestion(
        startResponse.sessionId,
        'pattern_question',
        '20m²'
      );
      expect(validResponse).toBeDefined();

      // Test invalid pattern
      await expect(
        questionnaireService.answerQuestion(
          startResponse.sessionId,
          'pattern_question',
          'invalid format'
        )
      ).rejects.toThrow('Answer format is invalid');
    });
  });
});