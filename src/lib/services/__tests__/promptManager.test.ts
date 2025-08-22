import { PromptManager } from '../promptManager';
import { ProjectType, ProjectContext } from '../../types';

describe('PromptManager', () => {
  let promptManager: PromptManager;

  beforeEach(() => {
    promptManager = new PromptManager();
  });

  describe('getPrompt', () => {
    it('should return kitchen renovation prompt template', () => {
      const promptId = 'kitchen-renovation-orchestrator';
      const context: ProjectContext = {
        projectId: 'proj-123',
        projectType: ProjectType.KITCHEN_RENOVATION,
        propertyDetails: {
          propertyType: 'terraced',
          yearBuilt: 1950,
          currentKitchenSize: 'medium'
        },
        userResponses: {
          budget: '£25000',
          timeline: '8 weeks',
          appliances: 'yes'
        },
        currentStep: 1
      };

      const result = promptManager.getPrompt(promptId, context);

      expect(result).toContain('kitchen renovation');
      expect(result).toContain('£25000');
      expect(result).toContain('8 weeks');
      expect(result).toContain('terraced');
    });

    it('should return bathroom renovation prompt template', () => {
      const promptId = 'bathroom-renovation-orchestrator';
      const context: ProjectContext = {
        projectId: 'proj-456',
        projectType: ProjectType.BATHROOM_RENOVATION,
        propertyDetails: {
          propertyType: 'detached',
          yearBuilt: 1980,
          numberOfBathrooms: 2
        },
        userResponses: {
          budget: '£15000',
          timeline: '6 weeks',
          accessibility: 'no'
        },
        currentStep: 1
      };

      const result = promptManager.getPrompt(promptId, context);

      expect(result).toContain('bathroom renovation');
      expect(result).toContain('£15000');
      expect(result).toContain('6 weeks');
      expect(result).toContain('detached');
    });

    it('should handle missing prompt template gracefully', () => {
      const promptId = 'non-existent-prompt';
      const context: ProjectContext = {
        projectId: 'proj-789',
        projectType: ProjectType.LOFT_CONVERSION,
        propertyDetails: {},
        userResponses: {},
        currentStep: 1
      };

      expect(() => {
        promptManager.getPrompt(promptId, context);
      }).toThrow('Prompt template not found: non-existent-prompt');
    });
  });

  describe('registerPrompt', () => {
    it('should register a new prompt template', () => {
      const promptId = 'custom-prompt';
      const template = 'This is a custom prompt for {{projectType}} with budget {{budget}}';

      promptManager.registerPrompt(promptId, template);

      const context: ProjectContext = {
        projectId: 'proj-custom',
        projectType: ProjectType.EXTENSION,
        propertyDetails: {},
        userResponses: { budget: '£50000' },
        currentStep: 1
      };

      const result = promptManager.getPrompt(promptId, context);

      expect(result).toContain('extension');
      expect(result).toContain('£50000');
    });

    it('should throw error when registering duplicate prompt ID', () => {
      const promptId = 'duplicate-prompt';
      const template = 'Template 1';

      promptManager.registerPrompt(promptId, template);

      expect(() => {
        promptManager.registerPrompt(promptId, 'Template 2');
      }).toThrow('Prompt template already exists: duplicate-prompt');
    });
  });

  describe('interpolateTemplate', () => {
    it('should interpolate template variables correctly', () => {
      const template = 'Project {{projectId}} is a {{projectType}} with budget {{userResponses.budget}}';
      const context: ProjectContext = {
        projectId: 'proj-123',
        projectType: ProjectType.KITCHEN_RENOVATION,
        propertyDetails: {},
        userResponses: { budget: '£30000' },
        currentStep: 1
      };

      const result = promptManager.interpolateTemplate(template, context);

      expect(result).toBe('Project proj-123 is a kitchen-renovation with budget £30000');
    });

    it('should handle nested property interpolation', () => {
      const template = 'Property type: {{propertyDetails.propertyType}}, Year: {{propertyDetails.yearBuilt}}';
      const context: ProjectContext = {
        projectId: 'proj-456',
        projectType: ProjectType.BATHROOM_RENOVATION,
        propertyDetails: {
          propertyType: 'semi-detached',
          yearBuilt: 1970
        },
        userResponses: {},
        currentStep: 1
      };

      const result = promptManager.interpolateTemplate(template, context);

      expect(result).toBe('Property type: semi-detached, Year: 1970');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Budget: {{userResponses.budget}}, Timeline: {{userResponses.timeline}}';
      const context: ProjectContext = {
        projectId: 'proj-789',
        projectType: ProjectType.LOFT_CONVERSION,
        propertyDetails: {},
        userResponses: { budget: '£20000' },
        currentStep: 1
      };

      const result = promptManager.interpolateTemplate(template, context);

      expect(result).toBe('Budget: £20000, Timeline: {{userResponses.timeline}}');
    });
  });

  describe('validatePromptTemplate', () => {
    it('should validate correct prompt template', () => {
      const template = 'Valid template with {{projectType}} and {{userResponses.budget}}';

      const result = promptManager.validatePromptTemplate(template);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect invalid template syntax', () => {
      const template = 'Invalid template with {{unclosed variable';

      const result = promptManager.validatePromptTemplate(template);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unclosed template variable: {{unclosed variable');
    });

    it('should detect unsupported variables', () => {
      const template = 'Template with {{unsupportedVariable}}';

      const result = promptManager.validatePromptTemplate(template);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unsupported variable: unsupportedVariable');
    });
  });

  describe('getAvailablePrompts', () => {
    it('should return list of available prompt templates', () => {
      const result = promptManager.getAvailablePrompts();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('kitchen-renovation-orchestrator');
      expect(result).toContain('bathroom-renovation-orchestrator');
    });
  });
});