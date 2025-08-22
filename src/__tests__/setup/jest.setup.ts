import { jest } from '@jest/globals';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@aws-sdk/client-cognito-identity-provider');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-ses');
jest.mock('@aws-sdk/client-sns');

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.DYNAMODB_USERS_TABLE = 'test-users';
process.env.DYNAMODB_PROJECTS_TABLE = 'test-projects';
process.env.DYNAMODB_PROPERTIES_TABLE = 'test-properties';
process.env.DYNAMODB_BUILDERS_TABLE = 'test-builders';
process.env.DYNAMODB_QUOTES_TABLE = 'test-quotes';
process.env.DYNAMODB_CONTRACTS_TABLE = 'test-contracts';
process.env.DYNAMODB_PAYMENTS_TABLE = 'test-payments';
process.env.DYNAMODB_AI_AGENTS_TABLE = 'test-ai-agents';
process.env.DYNAMODB_AI_PROMPTS_TABLE = 'test-ai-prompts';
process.env.DYNAMODB_AI_PROMPT_VERSIONS_TABLE = 'test-ai-prompt-versions';
process.env.DYNAMODB_AI_PROMPT_METRICS_TABLE = 'test-ai-prompt-metrics';
process.env.DYNAMODB_AI_PROMPT_TESTS_TABLE = 'test-ai-prompt-tests';
process.env.DYNAMODB_INVITATIONS_TABLE = 'test-invitations';
process.env.DYNAMODB_VETTING_RECORDS_TABLE = 'test-vetting-records';
process.env.DYNAMODB_LEADS_TABLE = 'test-leads';
process.env.DYNAMODB_LEAD_OFFERS_TABLE = 'test-lead-offers';

// Mock Claude AI
process.env.CLAUDE_API_KEY = 'test-claude-key';

// Mock Stripe
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123';

// Import enhanced test helpers
import { createMockDynamoClient, createMockStripe } from './testHelpers';

// Mock DynamoDB responses
const mockDynamoClient = createMockDynamoClient();

// Mock AWS SDK modules
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => mockDynamoClient)
  },
  PutCommand: jest.fn(),
  GetCommand: jest.fn(),
  QueryCommand: jest.fn(),
  ScanCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  DeleteCommand: jest.fn(),
}));

// Mock Stripe
const MockStripe = createMockStripe();
jest.mock('stripe', () => MockStripe);

// Export mock client for use in tests
export { mockDynamoClient };

// Suppress console logs during tests unless explicitly needed
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});