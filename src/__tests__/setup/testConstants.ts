// Test constants to fix enum issues in tests
export const TestProjectTypes = {
  KITCHEN_RENOVATION: 'kitchen_full_refit',
  BATHROOM_RENOVATION: 'bathroom_full_refit',
  LOFT_CONVERSION: 'loft_conversion_dormer',
  WINDOWS_REPLACEMENT: 'windows_upvc',
  EXTENSION: 'rear_extension_single_storey',
  OTHERS: 'others'
} as const;

export const TestMaterialCategories = {
  HOMEOWNER_PROVIDED: 'homeowner_provided',
  BUILDER_PROVIDED: 'builder_provided'
} as const;

export const TestUserTypes = {
  HOMEOWNER: 'homeowner',
  BUILDER: 'builder',
  ADMIN: 'admin'
} as const;

export const TestProjectStatuses = {
  INITIAL: 'initial',
  PROPERTY_ASSESSMENT: 'property_assessment',
  AI_PLANNING: 'ai_planning',
  SOW_GENERATION: 'sow_generation',
  BUILDER_INVITATION: 'builder_invitation',
  QUOTE_COLLECTION: 'quote_collection',
  BUILDER_SELECTION: 'builder_selection',
  CONTRACT_GENERATION: 'contract_generation',
  PROJECT_EXECUTION: 'project_execution',
  COMPLETION: 'completion'
} as const;

export const TestQuoteStatuses = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
} as const;

export const TestContractStatuses = {
  DRAFT: 'draft',
  PENDING_SIGNATURES: 'pending_signatures',
  SENT_FOR_SIGNING: 'sent_for_signing',
  PARTIALLY_SIGNED: 'partially_signed',
  SIGNED: 'signed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
} as const;

export const TestVettingStatuses = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export const TestPaymentStatuses = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
} as const;

export const TestSubscriptionStatuses = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PAST_DUE: 'past_due'
} as const;

// Mock data generators
export const createMockUser = (overrides: any = {}) => ({
  id: `user_${Date.now()}`,
  email: 'test@example.com',
  userType: TestUserTypes.HOMEOWNER,
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    phone: '+44 7700 900123',
    address: {
      line1: '123 Test Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'UK'
    }
  },
  createdAt: new Date(),
  lastLogin: new Date(),
  ...overrides
});

export const createMockProject = (overrides: any = {}) => ({
  id: `project_${Date.now()}`,
  homeownerId: 'homeowner_123',
  propertyId: 'property_123',
  projectType: TestProjectTypes.KITCHEN_RENOVATION,
  status: TestProjectStatuses.INITIAL,
  quotes: [],
  invitedBuilders: [],
  timeline: {
    milestones: []
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockBuilder = (overrides: any = {}) => ({
  id: `builder_${Date.now()}`,
  email: 'builder@example.com',
  userType: TestUserTypes.BUILDER,
  profile: {
    firstName: 'Bob',
    lastName: 'Builder',
    companyName: 'Test Construction Ltd',
    companiesHouseNumber: '12345678',
    insuranceDocuments: [],
    vettingStatus: TestVettingStatuses.APPROVED,
    specializations: [TestProjectTypes.KITCHEN_RENOVATION],
    serviceAreas: ['London', 'Surrey'],
    rating: 4.5,
    completedProjects: 25
  },
  createdAt: new Date(),
  lastLogin: new Date(),
  ...overrides
});

export const createMockQuote = (overrides: any = {}) => ({
  id: `quote_${Date.now()}`,
  projectId: 'project_123',
  builderId: 'builder_123',
  pricing: {
    totalAmount: 25000,
    laborCosts: 15000,
    materialCosts: 10000,
    breakdown: []
  },
  timeline: 30,
  startDate: new Date(),
  projectedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  amendments: [],
  termsAndConditions: 'Standard terms and conditions',
  insuranceDocuments: [],
  referenceProjects: [],
  status: TestQuoteStatuses.DRAFT,
  submittedAt: new Date(),
  ...overrides
});

export const createMockContract = (overrides: any = {}) => ({
  id: `contract_${Date.now()}`,
  projectId: 'project_123',
  homeownerId: 'homeowner_123',
  builderId: 'builder_123',
  quoteId: 'quote_123',
  sowId: 'sow_123',
  content: 'Contract content',
  status: TestContractStatuses.DRAFT,
  templateVersion: '1.0',
  totalAmount: 25000,
  projectTimeline: 30,
  startDate: new Date(),
  projectedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  termsAndConditions: 'Standard terms',
  createdAt: new Date(),
  updatedAt: new Date(),
  complianceChecks: {
    ukBuildingRegulations: true,
    industryStandards: true,
    unambiguousTerms: true,
    validatedAt: new Date()
  },
  ...overrides
});

export const createMockSoW = (overrides: any = {}) => ({
  id: `sow_${Date.now()}`,
  projectId: 'project_123',
  version: 1,
  sections: [
    {
      id: 'section_1',
      title: 'Kitchen Renovation',
      description: 'Complete kitchen renovation including units, appliances, and finishes',
      specifications: ['Remove existing kitchen', 'Install new units', 'Fit appliances'],
      dependencies: []
    }
  ],
  materials: [
    {
      id: 'material_1',
      name: 'Kitchen Units',
      category: TestMaterialCategories.HOMEOWNER_PROVIDED,
      quantity: 1,
      unit: 'set',
      estimatedCost: 5000,
      specifications: ['Modern style', 'Soft close doors']
    }
  ],
  laborRequirements: [
    {
      id: 'labor_1',
      trade: 'Kitchen Fitter',
      description: 'Install kitchen units and worktops',
      personDays: 5,
      estimatedCost: 2500,
      qualifications: ['City & Guilds Kitchen Fitting']
    }
  ],
  timeline: [
    {
      id: 'task_1',
      name: 'Remove existing kitchen',
      description: 'Strip out old kitchen units and appliances',
      duration: 2,
      dependencies: [],
      canRunInParallel: false,
      trade: 'General Builder'
    }
  ],
  estimatedCosts: {
    totalEstimate: 25000,
    laborCosts: 15000,
    materialCosts: 10000,
    builderMaterials: 6000,
    homeownerMaterials: 4000,
    breakdown: []
  },
  regulatoryRequirements: [],
  generatedAt: new Date(),
  ...overrides
});

export const createMockAIAgent = (overrides: any = {}) => ({
  id: `agent_${Date.now()}`,
  name: 'Kitchen Specialist Agent',
  specialization: 'kitchen',
  projectTypes: [TestProjectTypes.KITCHEN_RENOVATION],
  promptTemplate: 'kitchen-specialist-prompt',
  knowledgeBase: {
    id: 'kb_kitchen',
    domain: 'kitchen_renovation',
    facts: ['Kitchen units require 18mm moisture resistant MDF'],
    regulations: ['Part P electrical regulations apply'],
    bestPractices: ['Always check for asbestos in pre-1980 properties'],
    lastUpdated: new Date()
  },
  dependencies: [],
  isOrchestrator: false,
  ...overrides
});

export const createMockProjectContext = (overrides: any = {}) => ({
  projectId: 'project_123',
  projectType: TestProjectTypes.KITCHEN_RENOVATION,
  property: {
    id: 'property_123',
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
  previousAgentResponses: [],
  ...overrides
});

export const createMockPayment = (overrides: any = {}) => ({
  id: `payment_${Date.now()}`,
  userId: 'user_123',
  type: 'subscription',
  amount: 2999,
  currency: 'GBP',
  status: TestPaymentStatuses.COMPLETED,
  stripePaymentIntentId: 'pi_test123',
  description: 'Monthly subscription',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockSubscription = (overrides: any = {}) => ({
  id: `subscription_${Date.now()}`,
  userId: 'user_123',
  planId: 'plan_basic',
  status: TestSubscriptionStatuses.ACTIVE,
  stripeSubscriptionId: 'sub_test123',
  stripeCustomerId: 'cus_test123',
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  cancelAtPeriodEnd: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});