# Design Document - UK Home Improvement Platform

## Overview

The UK Home Improvement Platform is a comprehensive web application that streamlines the process of planning, scoping, and contracting home improvement projects. The platform leverages AI-driven project planning to connect homeowners with vetted builders through automatically generated Scopes of Work (SoW) that comply with UK building regulations.

### Key Design Principles

- **AI-First Approach**: Multi-agent AI system provides specialized expertise for different project types
- **Regulatory Compliance**: Built-in UK building regulations and planning permission checks
- **Transparency**: Clear pricing, timelines, and builder verification
- **Scalability**: Microservices architecture supporting growth and feature expansion
- **Security**: Secure authentication, payment processing, and data protection

## Architecture

### High-Level Architecture

The platform follows a serverless microservices architecture on AWS, designed for scalability, reliability, and cost-effectiveness.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │   Lambda        │
│   (React SPA)   │◄──►│   (REST/GraphQL) │◄──►│   Functions     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   Cognito        │    │   DynamoDB      │
│   (CDN)         │    │   (Auth)         │    │   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                ┌──────────────────────────┼─────────────────┐
                                │                          ▼                 │
                        ┌───────────────┐    ┌─────────────────┐    ┌───────────────┐
                        │   S3 Bucket   │    │   Step Functions│    │   EventBridge │
                        │   (Storage)   │    │   (Workflows)   │    │   (Events)    │
                        └───────────────┘    └─────────────────┘    └───────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Next.js for SSR and routing
- Tailwind CSS for styling
- React Query for state management
- Recharts for Gantt chart visualization

**Backend:**
- AWS Lambda (Node.js/TypeScript)
- AWS API Gateway (REST + GraphQL)
- AWS DynamoDB (NoSQL database)
- AWS Step Functions (AI workflow orchestration)
- AWS EventBridge (event-driven architecture)

**AI & ML:**
- Claude Sonnet 4 for specialized agents
- AWS Bedrock for Claude integration
- Custom prompt management system
- Multi-agent orchestration framework

**Infrastructure:**
- AWS CDK for Infrastructure as Code
- AWS Cognito for authentication
- AWS S3 for file storage
- Stripe for payment processing
- DocuSign for contract signing

## Components and Interfaces

### 1. Authentication & User Management

**Design Decision**: AWS Cognito provides enterprise-grade authentication with built-in security features, reducing development overhead while ensuring compliance.

**Components:**
- `AuthService`: Handles login, registration, and session management
- `UserProfileService`: Manages user profiles and preferences
- `InvitationService`: Manages builder invitation codes and access control

**Key Interfaces:**
```typescript
interface User {
  id: string;
  email: string;
  userType: 'homeowner' | 'builder' | 'admin';
  profile: UserProfile;
  createdAt: Date;
  lastLogin: Date;
}

interface BuilderProfile extends UserProfile {
  companiesHouseNumber: string;
  insuranceDocuments: Document[];
  vettingStatus: 'pending' | 'approved' | 'rejected';
  specializations: ProjectType[];
  serviceAreas: string[];
}
```

### 2. Multi-Agent AI System

**Design Decision**: Specialized AI agents provide domain expertise while maintaining modularity and allowing for independent updates and improvements.

**Agent Architecture:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Orchestrator   │    │   Specialized   │    │   Timeline      │
│     Agent       │◄──►│     Agents      │◄──►│  Optimization   │
│                 │    │                 │    │     Agent       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Project       │    │   Knowledge     │    │   SoW & Gantt   │
│   Context       │    │     Base        │    │   Generation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Specialized Agents:**

*Trade-Specific Agents:*
- Windows & Doors AI Agent
- Electrical AI Agent  
- Plumbing AI Agent
- Carpets & Flooring AI Agent
- Tiling AI Agent
- Wall Paint & Decorating AI Agent
- Roofing AI Agent
- Insulation AI Agent
- Heating & HVAC AI Agent

*Room-Specific Agents:*
- Kitchen AI Agent
- Bathroom AI Agent
- Bedroom AI Agent
- Living Room AI Agent
- Utility Room AI Agent

*Project-Type Agents:*
- Loft Conversion AI Agent
- Extension AI Agent (rear, side, wrap-around)
- Basement Conversion AI Agent
- Garage Conversion AI Agent
- Conservatory AI Agent
- Garden Room AI Agent

*External Work Agents:*
- Rendering & Cladding AI Agent
- Landscaping & Garden AI Agent
- Driveway & Patio AI Agent
- Fencing AI Agent
- External Drainage AI Agent

*Specialist Agents:*
- Planning Permission AI Agent
- Listed Building AI Agent
- Structural Work AI Agent
- Accessibility Modifications AI Agent
- Builder Review AI Agent
- Timeline Optimization AI Agent

**Agent Management Service:**
```typescript
interface AIAgent {
  id: string;
  name: string;
  specialization: string;
  projectTypes: ProjectType[]; // Which project types this agent handles
  promptTemplate: string;
  knowledgeBase: KnowledgeBase;
  dependencies: string[];
  isOrchestrator: boolean; // true for high-level agents like Extension, Loft Conversion
}

interface AgentOrchestrator {
  selectAgents(projectType: ProjectType, projectDetails: any): AIAgent[];
  invokeAgent(agentId: string, context: ProjectContext): Promise<AgentResponse>;
  coordinateAgents(agents: AIAgent[], context: ProjectContext): Promise<SoWResult>;
  optimizeTimeline(tasks: Task[]): Promise<GanttChart>;
}

// Agent Selection Logic
interface AgentSelector {
  // For complex projects like "Loft Conversion", select orchestrating agent
  // which then invokes specialized agents (Electrical, Plumbing, Insulation, etc.)
  getRequiredAgents(projectType: ProjectType): {
    orchestrator?: AIAgent;
    specialists: AIAgent[];
  };
}
```

### 3. Project Management System

**Design Decision**: Event-driven architecture ensures loose coupling between project phases while maintaining data consistency and enabling real-time updates.

**Core Components:**
- `ProjectService`: Manages project lifecycle
- `SoWGenerator`: Coordinates AI agents for scope generation
- `QuoteManager`: Handles builder quotes and comparisons
- `ContractService`: Generates and manages contracts

**Project State Machine:**
```
Initial → Property Assessment → AI Planning → SoW Generation → 
Builder Invitation → Quote Collection → Builder Selection → 
Contract Generation → Project Execution → Completion
```

### 4. Property Assessment & Compliance

**Design Decision**: Integration with council APIs and property databases ensures accurate regulatory compliance checking without manual intervention.

**Components:**
- `PropertyService`: Manages property data and assessments
- `ComplianceChecker`: Validates against UK building regulations
- `CouncilAPIService`: Interfaces with local council systems

**Property Data Model:**
```typescript
interface Property {
  id: string;
  address: Address;
  councilArea: string;
  isListedBuilding: boolean;
  isInConservationArea: boolean;
  planningHistory: PlanningApplication[];
  buildingRegulations: RegulationRequirement[];
}
```

### 5. Builder Management & Verification

**Design Decision**: Comprehensive vetting process with automated verification reduces risk while maintaining builder quality standards.

**Components:**
- `BuilderVerificationService`: Handles vetting process
- `LeadManagementService`: Manages lead distribution
- `RatingService`: Processes feedback and ratings

**Builder Verification Flow:**
```
Registration → Companies House Check → Insurance Verification → 
Reference Validation → Manual Review → Approval/Rejection
```

### 6. Payment & Subscription Management

**Design Decision**: Stripe integration provides secure, PCI-compliant payment processing with flexible subscription models.

**Components:**
- `PaymentService`: Handles all payment operations
- `SubscriptionService`: Manages tiered access and billing
- `DiscountService`: Manages promotional codes and campaigns

**Subscription Tiers:**
```typescript
interface SubscriptionTier {
  id: string;
  name: 'free' | 'basic' | 'premium';
  features: Feature[];
  monthlyPrice: number;
  limits: UsageLimits;
}
```

## Data Models

### Core Entities

**Project Entity:**
```typescript
interface Project {
  id: string;
  homeownerId: string;
  propertyId: string;
  projectType: ProjectType;
  status: ProjectStatus;
  sowDocument: SoWDocument;
  ganttChart: GanttChart;
  quotes: Quote[];
  invitedBuilders: BuilderInvitation[];
  selectedBuilderId?: string;
  contract?: Contract;
  timeline: ProjectTimeline;
  createdAt: Date;
  updatedAt: Date;
}

interface BuilderInvitation {
  builderId: string;
  invitationCode: string;
  invitedAt: Date;
  accessedAt?: Date;
  quoteSubmitted: boolean;
  quoteId?: string;
  status: 'invited' | 'accessed' | 'quoted' | 'selected' | 'rejected';
}
```

**SoW Document:**
```typescript
interface SoWDocument {
  id: string;
  projectId: string;
  version: number;
  sections: SoWSection[];
  materials: MaterialSpecification[];
  laborRequirements: LaborRequirement[];
  timeline: TaskTimeline[];
  estimatedCosts: CostBreakdown;
  regulatoryRequirements: RegulationRequirement[];
  generatedAt: Date;
}
```

**Quote Entity:**
```typescript
interface Quote {
  id: string;
  projectId: string;
  builderId: string;
  pricing: QuotePricing;
  timeline: number; // working days
  startDate: Date;
  projectedCompletionDate: Date;
  amendments: SoWAmendment[];
  termsAndConditions: string;
  insuranceDocuments: Document[];
  referenceProjects: ReferenceProject[];
  status: QuoteStatus;
  submittedAt: Date;
  aiAnalysis?: QuoteAnalysis; // AI-generated insights and red flags
}

interface QuotePricing {
  totalAmount: number;
  laborCosts: number;
  materialCosts: number;
  breakdown: PricingBreakdown[];
  varianceFromEstimate?: number; // percentage variance from AI estimate
}

interface ReferenceProject {
  address: string;
  projectType: string;
  completionDate: Date;
  contactAllowed: boolean;
  visitAllowed: boolean;
  description: string;
}

interface QuoteAnalysis {
  redFlags: RedFlag[];
  timelineAnalysis: TimelineAnalysis;
  pricingAnalysis: PricingAnalysis;
  overallRisk: 'low' | 'medium' | 'high';
}
```

### Database Design

**DynamoDB Table Structure:**

1. **Users Table** (PK: userId)
2. **Projects Table** (PK: projectId, GSI: homeownerId)
3. **Properties Table** (PK: propertyId, GSI: postcode)
4. **Builders Table** (PK: builderId, GSI: postcode-specialization)
5. **Quotes Table** (PK: quoteId, GSI: projectId, GSI: builderId)
6. **AIPrompts Table** (PK: agentId-version)
7. **Contracts Table** (PK: contractId, GSI: projectId)
8. **Payments Table** (PK: paymentId, GSI: userId)

## Error Handling

### Error Categories

1. **User Input Errors**: Validation failures, missing required fields
2. **System Errors**: Database failures, external API timeouts
3. **Business Logic Errors**: Regulatory compliance failures, invalid state transitions
4. **Integration Errors**: Payment processing failures, AI service unavailability

### Error Handling Strategy

**Frontend Error Handling:**
- Global error boundary for React components
- User-friendly error messages with actionable guidance
- Retry mechanisms for transient failures
- Offline capability for critical user flows

**Backend Error Handling:**
- Structured error responses with error codes
- Comprehensive logging with correlation IDs
- Circuit breaker pattern for external services
- Dead letter queues for failed async operations

**Error Response Format:**
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    correlationId: string;
    timestamp: Date;
  };
}
```

## Testing Strategy

### Testing Pyramid

**Unit Tests (70%)**
- Individual function and component testing
- AI agent prompt validation
- Business logic verification
- Data model validation

**Integration Tests (20%)**
- API endpoint testing
- Database integration testing
- External service integration testing
- Multi-agent workflow testing

**End-to-End Tests (10%)**
- Complete user journey testing
- Cross-browser compatibility testing
- Performance testing under load
- Security penetration testing

### AI Testing Strategy

**Prompt Testing:**
- Regression testing for AI responses
- A/B testing for prompt optimization
- Quality metrics for generated SoWs
- Consistency testing across agent interactions

**Multi-Agent Testing:**
- Agent coordination validation
- Context sharing verification
- Timeline optimization accuracy
- Error handling in agent failures

### Test Automation

- GitHub Actions for CI/CD pipeline
- Automated testing on pull requests
- Staging environment validation
- Production monitoring and alerting

## Security Considerations

### Authentication & Authorization

- AWS Cognito for secure authentication
- JWT tokens with short expiration times
- Role-based access control (RBAC)
- Multi-factor authentication for sensitive operations

### Data Protection

- Encryption at rest (DynamoDB encryption)
- Encryption in transit (TLS 1.3)
- PII data anonymization
- GDPR compliance measures

### API Security

- Rate limiting and throttling
- Input validation and sanitization
- SQL injection prevention
- Cross-site scripting (XSS) protection

### Payment Security

- PCI DSS compliance through Stripe
- Tokenization of payment methods
- Secure webhook validation
- Fraud detection integration

## Performance Optimization

### Frontend Performance

- Code splitting and lazy loading
- Image optimization and CDN delivery
- Service worker for offline capability
- Progressive Web App (PWA) features

### Backend Performance

- Lambda cold start optimization
- DynamoDB query optimization
- Caching strategy with ElastiCache
- Asynchronous processing for heavy operations

### AI Performance

- Prompt caching for repeated queries
- Parallel agent execution where possible
- Response streaming for long-running operations
- Fallback mechanisms for AI service failures

### Monitoring & Observability

- CloudWatch for infrastructure monitoring
- X-Ray for distributed tracing
- Custom metrics for business KPIs
- Real-time alerting for critical issues

## Scalability Design

### Horizontal Scaling

- Serverless architecture with auto-scaling
- Event-driven processing for decoupling
- Microservices for independent scaling
- CDN for global content delivery

### Data Scaling

- DynamoDB auto-scaling
- Data partitioning strategies
- Read replicas for query optimization
- Data archiving for historical records

### AI Scaling

- Agent pool management
- Load balancing across AI services
- Caching for frequently requested analyses
- Graceful degradation during peak loads

This design provides a robust, scalable foundation for the UK Home Improvement Platform while addressing all requirements specified in the requirements document. The multi-agent AI system, comprehensive builder verification, and regulatory compliance features differentiate this platform in the market while ensuring user trust and satisfaction.