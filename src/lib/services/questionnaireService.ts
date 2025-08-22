import { ProjectType, ProjectContext, AgentResponse } from '../types';
import { aiAgentService } from './aiAgentService';
import { agentSelector } from './agentSelector';

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'range';
  options?: string[];
  validation?: {
    required: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
  helpText?: string;
  dependsOn?: string; // Previous question ID
  conditionalLogic?: {
    showIf: string; // Previous answer value
    hideIf: string;
  };
}

export interface QuestionnaireSession {
  id: string;
  projectId: string;
  projectType: ProjectType;
  currentQuestionIndex: number;
  questions: Question[];
  answers: Record<string, any>;
  agentId: string;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionnaireResponse {
  question: Question;
  isLastQuestion: boolean;
  progress: number; // 0-100
  sessionId: string;
}

export class QuestionnaireService {
  private activeSessions = new Map<string, QuestionnaireSession>();

  /**
   * Start a new questionnaire session for a project
   */
  async startQuestionnaire(
    projectId: string,
    projectType: ProjectType,
    customDescription?: string
  ): Promise<QuestionnaireResponse> {
    const sessionId = `quest_${projectId}_${Date.now()}`;

    // Determine which agent should handle the questionnaire
    let agentId: string;
    
    if (projectType === 'others' && customDescription) {
      // Use AI to analyze and determine appropriate agent
      const analysis = await agentSelector.analyzeOthersProject(customDescription);
      agentId = analysis.orchestrator?.id || analysis.specialists[0]?.id || 'general_project_agent';
    } else {
      // Get the primary agent for this project type
      const requiredAgents = await agentSelector.getRequiredAgents(projectType);
      agentId = requiredAgents.orchestrator?.id || requiredAgents.specialists[0]?.id || 'general_project_agent';
    }

    // Generate initial questions from the agent
    const initialQuestions = await this.generateQuestionsFromAgent(agentId, projectType, customDescription);

    const session: QuestionnaireSession = {
      id: sessionId,
      projectId,
      projectType,
      currentQuestionIndex: 0,
      questions: initialQuestions,
      answers: customDescription ? { projectDescription: customDescription } : {},
      agentId,
      isComplete: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.activeSessions.set(sessionId, session);

    return {
      question: session.questions[0],
      isLastQuestion: session.questions.length === 1,
      progress: 0,
      sessionId
    };
  }

  /**
   * Answer a question and get the next one
   */
  async answerQuestion(
    sessionId: string,
    questionId: string,
    answer: any
  ): Promise<QuestionnaireResponse | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Questionnaire session not found');
    }

    // Validate answer
    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (currentQuestion.id !== questionId) {
      throw new Error('Question ID mismatch');
    }

    this.validateAnswer(currentQuestion, answer);

    // Store answer
    session.answers[questionId] = answer;
    session.updatedAt = new Date();

    // Check if we need to generate more questions based on this answer
    const additionalQuestions = await this.generateFollowUpQuestions(session, currentQuestion, answer);
    
    if (additionalQuestions.length > 0) {
      // Insert additional questions after current position
      session.questions.splice(session.currentQuestionIndex + 1, 0, ...additionalQuestions);
    }

    // Move to next question
    session.currentQuestionIndex++;

    // Check if questionnaire is complete
    if (session.currentQuestionIndex >= session.questions.length) {
      session.isComplete = true;
      return null; // No more questions
    }

    // Apply conditional logic for next question
    const nextQuestion = this.getNextValidQuestion(session);
    if (!nextQuestion) {
      session.isComplete = true;
      return null;
    }

    const progress = Math.round((session.currentQuestionIndex / session.questions.length) * 100);

    return {
      question: nextQuestion,
      isLastQuestion: session.currentQuestionIndex === session.questions.length - 1,
      progress,
      sessionId
    };
  }

  /**
   * Get questionnaire session
   */
  getSession(sessionId: string): QuestionnaireSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Complete questionnaire and return all answers
   */
  completeQuestionnaire(sessionId: string): Record<string, any> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Questionnaire session not found');
    }

    session.isComplete = true;
    session.updatedAt = new Date();

    return session.answers;
  }

  /**
   * Generate initial questions from AI agent
   */
  private async generateQuestionsFromAgent(
    agentId: string,
    projectType: ProjectType,
    customDescription?: string
  ): Promise<Question[]> {
    try {
      const context: ProjectContext = {
        projectId: 'temp',
        projectType,
        property: {} as any,
        userResponses: customDescription ? { projectDescription: customDescription } : {},
        previousAgentResponses: []
      };

      const response = await aiAgentService.invokeAgent({
        agentId,
        context,
        requestType: 'generate_questions'
      });

      // Parse questions from agent response
      return this.parseQuestionsFromResponse(response);
    } catch (error) {
      console.error('Error generating questions from agent:', error);
      // Fallback to default questions
      return this.getDefaultQuestions(projectType);
    }
  }

  /**
   * Generate follow-up questions based on previous answer
   */
  private async generateFollowUpQuestions(
    session: QuestionnaireSession,
    currentQuestion: Question,
    answer: any
  ): Promise<Question[]> {
    try {
      const context: ProjectContext = {
        projectId: session.projectId,
        projectType: session.projectType,
        property: {} as any,
        userResponses: session.answers,
        previousAgentResponses: []
      };

      const response = await aiAgentService.invokeAgent({
        agentId: session.agentId,
        context,
        requestType: 'generate_followup_questions',
        additionalData: {
          currentQuestion: currentQuestion.id,
          currentAnswer: answer
        }
      });

      return this.parseQuestionsFromResponse(response);
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      return [];
    }
  }

  /**
   * Parse questions from AI agent response
   */
  private parseQuestionsFromResponse(response: AgentResponse): Question[] {
    try {
      const questions = response.data.questions as Question[];
      return questions || [];
    } catch (error) {
      console.error('Error parsing questions from response:', error);
      return [];
    }
  }

  /**
   * Get default questions for a project type (fallback)
   */
  private getDefaultQuestions(projectType: ProjectType): Question[] {
    const baseQuestions: Question[] = [
      {
        id: 'project_budget',
        text: 'What is your approximate budget for this project?',
        type: 'select',
        options: [
          'Under £5,000',
          '£5,000 - £15,000',
          '£15,000 - £30,000',
          '£30,000 - £50,000',
          '£50,000 - £100,000',
          'Over £100,000'
        ],
        validation: { required: true },
        helpText: 'This helps us provide accurate recommendations and material suggestions.'
      },
      {
        id: 'project_timeline',
        text: 'When would you like to start this project?',
        type: 'select',
        options: [
          'As soon as possible',
          'Within 1-3 months',
          'Within 3-6 months',
          'Within 6-12 months',
          'More than 12 months'
        ],
        validation: { required: true }
      },
      {
        id: 'property_age',
        text: 'What is the approximate age of your property?',
        type: 'select',
        options: [
          'Pre-1900',
          '1900-1930',
          '1930-1960',
          '1960-1980',
          '1980-2000',
          'Post-2000'
        ],
        validation: { required: true },
        helpText: 'Property age affects building regulations and material requirements.'
      }
    ];

    // Add project-specific questions based on type
    const specificQuestions = this.getProjectSpecificQuestions(projectType);
    
    return [...baseQuestions, ...specificQuestions];
  }

  /**
   * Get project-specific questions
   */
  private getProjectSpecificQuestions(projectType: ProjectType): Question[] {
    const questions: Question[] = [];

    // Kitchen projects
    if (projectType.includes('kitchen')) {
      questions.push(
        {
          id: 'kitchen_size',
          text: 'What is the approximate size of your kitchen?',
          type: 'select',
          options: ['Small (under 10m²)', 'Medium (10-15m²)', 'Large (15-25m²)', 'Very large (over 25m²)'],
          validation: { required: true }
        },
        {
          id: 'kitchen_layout',
          text: 'What kitchen layout are you considering?',
          type: 'select',
          options: ['Galley', 'L-shaped', 'U-shaped', 'Island', 'Peninsula', 'Open plan'],
          validation: { required: true }
        }
      );
    }

    // Bathroom projects
    if (projectType.includes('bathroom')) {
      questions.push(
        {
          id: 'bathroom_type',
          text: 'What type of bathroom is this?',
          type: 'select',
          options: ['Main bathroom', 'En-suite', 'Downstairs WC', 'Wet room', 'Shower room'],
          validation: { required: true }
        },
        {
          id: 'bathroom_fixtures',
          text: 'Which fixtures do you want to include?',
          type: 'multiselect',
          options: ['Bath', 'Shower', 'Toilet', 'Basin', 'Bidet', 'Heated towel rail'],
          validation: { required: true }
        }
      );
    }

    // Extension projects
    if (projectType.includes('extension')) {
      questions.push(
        {
          id: 'extension_size',
          text: 'What is the approximate size of the extension?',
          type: 'text',
          validation: { required: true, pattern: '^[0-9]+m²?$' },
          helpText: 'Please specify in square meters (e.g., 20m²)'
        },
        {
          id: 'extension_purpose',
          text: 'What will the extension be used for?',
          type: 'multiselect',
          options: ['Kitchen', 'Dining room', 'Living room', 'Bedroom', 'Bathroom', 'Home office', 'Utility room'],
          validation: { required: true }
        }
      );
    }

    return questions;
  }

  /**
   * Validate answer against question requirements
   */
  private validateAnswer(question: Question, answer: any): void {
    if (!question.validation) return;

    if (question.validation.required && (answer === null || answer === undefined || answer === '')) {
      throw new Error('This question is required');
    }

    if (question.type === 'number' && typeof answer !== 'number') {
      throw new Error('Answer must be a number');
    }

    if (question.validation.min !== undefined && answer < question.validation.min) {
      throw new Error(`Answer must be at least ${question.validation.min}`);
    }

    if (question.validation.max !== undefined && answer > question.validation.max) {
      throw new Error(`Answer must be at most ${question.validation.max}`);
    }

    if (question.validation.pattern && typeof answer === 'string') {
      const regex = new RegExp(question.validation.pattern);
      if (!regex.test(answer)) {
        throw new Error('Answer format is invalid');
      }
    }
  }

  /**
   * Get next valid question considering conditional logic
   */
  private getNextValidQuestion(session: QuestionnaireSession): Question | null {
    while (session.currentQuestionIndex < session.questions.length) {
      const question = session.questions[session.currentQuestionIndex];
      
      // Check conditional logic
      if (question.conditionalLogic) {
        const dependentAnswer = session.answers[question.dependsOn || ''];
        
        if (question.conditionalLogic.hideIf && dependentAnswer === question.conditionalLogic.hideIf) {
          session.currentQuestionIndex++;
          continue;
        }
        
        if (question.conditionalLogic.showIf && dependentAnswer !== question.conditionalLogic.showIf) {
          session.currentQuestionIndex++;
          continue;
        }
      }
      
      return question;
    }
    
    return null;
  }

  /**
   * Clean up completed sessions
   */
  cleanupSessions(): void {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now.getTime() - session.updatedAt.getTime() > maxAge) {
        this.activeSessions.delete(sessionId);
      }
    }
  }
}

export const questionnaireService = new QuestionnaireService();