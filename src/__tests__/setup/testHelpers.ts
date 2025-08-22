// Test helpers to fix ProjectType enum issues
import { ProjectType } from '../../lib/types';

// Map old enum names to new ones for backward compatibility in tests
export const ProjectTypeMap = {
  KITCHEN_RENOVATION: 'kitchen_full_refit' as ProjectType,
  BATHROOM_RENOVATION: 'bathroom_full_refit' as ProjectType,
  LOFT_CONVERSION: 'loft_conversion_dormer' as ProjectType,
  WINDOWS_REPLACEMENT: 'windows_upvc' as ProjectType,
  EXTENSION: 'rear_extension_single_storey' as ProjectType,
  OTHERS: 'others' as ProjectType
};

// Helper function to get project type
export const getProjectType = (type: keyof typeof ProjectTypeMap): ProjectType => {
  return ProjectTypeMap[type];
};

// Mock data generators with correct enum values
export const createTestAgent = (overrides: any = {}) => ({
  id: `agent_${Date.now()}`,
  name: 'Test Agent',
  specialization: 'test',
  projectTypes: [getProjectType('KITCHEN_RENOVATION')],
  promptTemplate: 'test-prompt',
  knowledgeBase: {
    id: 'kb_test',
    domain: 'test',
    facts: [],
    regulations: [],
    bestPractices: [],
    lastUpdated: new Date()
  },
  dependencies: [],
  isOrchestrator: false,
  ...overrides
});

export const createTestProjectContext = (overrides: any = {}) => ({
  projectId: 'test-project',
  projectType: getProjectType('KITCHEN_RENOVATION'),
  property: {
    id: 'test-property',
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
  userResponses: {},
  previousAgentResponses: [],
  ...overrides
});

// Enhanced mock DynamoDB client with better test data
export const createMockDynamoClient = () => {
  const mockData = new Map();
  
  return {
    send: jest.fn().mockImplementation((command) => {
      const commandName = command.constructor.name;
      
      if (commandName === 'PutCommand') {
        const { TableName, Item } = command.input;
        const key = `${TableName}:${Item.id || Item.userId || Item.projectId || 'default'}`;
        mockData.set(key, Item);
        return Promise.resolve({});
      }
      
      if (commandName === 'GetCommand') {
        const { TableName, Key } = command.input;
        const keyStr = `${TableName}:${Object.values(Key)[0]}`;
        const item = mockData.get(keyStr);
        return Promise.resolve({ Item: item || null });
      }
      
      if (commandName === 'QueryCommand') {
        const { TableName } = command.input;
        const items = Array.from(mockData.entries())
          .filter(([key]) => key.startsWith(`${TableName}:`))
          .map(([, value]) => value);
        return Promise.resolve({ Items: items });
      }
      
      if (commandName === 'ScanCommand') {
        const { TableName } = command.input;
        const items = Array.from(mockData.entries())
          .filter(([key]) => key.startsWith(`${TableName}:`))
          .map(([, value]) => value);
        return Promise.resolve({ Items: items });
      }
      
      if (commandName === 'UpdateCommand') {
        return Promise.resolve({});
      }
      
      if (commandName === 'DeleteCommand') {
        return Promise.resolve({});
      }
      
      return Promise.resolve({});
    }),
    
    // Helper methods for tests
    setMockData: (tableName: string, key: string, data: any) => {
      mockData.set(`${tableName}:${key}`, data);
    },
    
    clearMockData: () => {
      mockData.clear();
    },
    
    getMockData: (tableName: string, key: string) => {
      return mockData.get(`${tableName}:${key}`);
    }
  };
};

// Enhanced Stripe mock
export const createMockStripe = () => {
  const mockStripe = {
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
      update: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
    },
    
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ 
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_test',
        status: 'requires_payment_method'
      }),
      retrieve: jest.fn().mockResolvedValue({ 
        id: 'pi_test123',
        status: 'succeeded'
      }),
      confirm: jest.fn().mockResolvedValue({ 
        id: 'pi_test123',
        status: 'succeeded'
      }),
    },
    
    subscriptions: {
      create: jest.fn().mockResolvedValue({ 
        id: 'sub_test123',
        status: 'active'
      }),
      retrieve: jest.fn().mockResolvedValue({ 
        id: 'sub_test123',
        status: 'active'
      }),
      update: jest.fn().mockResolvedValue({ 
        id: 'sub_test123',
        status: 'active'
      }),
      cancel: jest.fn().mockResolvedValue({ 
        id: 'sub_test123',
        status: 'canceled'
      }),
    },
    
    coupons: {
      create: jest.fn().mockResolvedValue({ 
        id: 'coupon_test123'
      }),
    },
    
    webhookEndpoints: {
      create: jest.fn().mockResolvedValue({ 
        id: 'we_test123'
      }),
    }
  };
  
  // Add reset method for tests
  mockStripe.reset = () => {
    Object.values(mockStripe).forEach(service => {
      if (typeof service === 'object' && service !== null) {
        Object.values(service).forEach(method => {
          if (jest.isMockFunction(method)) {
            method.mockClear();
          }
        });
      }
    });
  };
  
  return mockStripe;
};

// Material category mapping
export const MaterialCategoryMap = {
  HOMEOWNER_PROVIDED: 'homeowner_provided',
  BUILDER_PROVIDED: 'builder_provided'
};

// Test data factories
export const TestDataFactory = {
  createUser: (overrides: any = {}) => ({
    id: `user_${Date.now()}`,
    email: 'test@example.com',
    userType: 'homeowner',
    profile: {
      firstName: 'John',
      lastName: 'Doe'
    },
    createdAt: new Date(),
    lastLogin: new Date(),
    ...overrides
  }),
  
  createProject: (overrides: any = {}) => ({
    id: `project_${Date.now()}`,
    homeownerId: 'homeowner_123',
    propertyId: 'property_123',
    projectType: getProjectType('KITCHEN_RENOVATION'),
    status: 'initial',
    quotes: [],
    invitedBuilders: [],
    timeline: { milestones: [] },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  createBuilder: (overrides: any = {}) => ({
    id: `builder_${Date.now()}`,
    email: 'builder@example.com',
    userType: 'builder',
    profile: {
      firstName: 'Bob',
      lastName: 'Builder',
      companyName: 'Test Construction Ltd',
      vettingStatus: 'approved',
      specializations: [getProjectType('KITCHEN_RENOVATION')],
      serviceAreas: ['London'],
      rating: 4.5
    },
    createdAt: new Date(),
    lastLogin: new Date(),
    ...overrides
  })
};