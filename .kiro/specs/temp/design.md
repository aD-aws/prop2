# Design Document - Core Infrastructure MVP

## Overview

The Core Infrastructure MVP establishes the foundational AWS services for a home improvement platform. This minimal viable product focuses on proving the core technology stack works together: authentication via AWS Cognito, data persistence with DynamoDB, and AI capabilities through AWS Bedrock with Haiku 3.

### Key Design Principles

- **Simplicity First**: Minimal features to prove the stack works
- **AWS Native**: Leverage managed services to reduce operational overhead  
- **Serverless**: Use Lambda and API Gateway for cost-effective scaling
- **Infrastructure as Code**: CDK for reproducible deployments
- **Security**: Proper authentication and data protection from day one

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │   Lambda        │
│   (Next.js)     │◄──►│   (REST API)     │◄──►│   Functions     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   Cognito        │    │   DynamoDB      │
│   (CDN)         │    │   (Auth)         │    │   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   AWS Bedrock   │
                                               │   (Haiku 3)     │
                                               └─────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- AWS Amplify UI components for auth
- React Hook Form for form handling

**Backend:**
- AWS Lambda (Node.js 18)
- AWS API Gateway (REST API)
- AWS CDK v2 for infrastructure

**Database:**
- AWS DynamoDB with single table design

**Authentication:**
- AWS Cognito User Pools
- JWT tokens for API authentication

**AI:**
- AWS Bedrock with Anthropic Claude 3 Haiku
- Simple text-based interactions

## Components and Interfaces

### 1. Authentication Service

**Purpose**: Handle user registration, login, and session management using AWS Cognito.

**Key Components:**
- `AuthService`: Wrapper around Cognito operations
- `LoginForm`: User login interface
- `RegisterForm`: User registration interface
- `AuthProvider`: React context for auth state

**Interfaces:**
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthService {
  signUp(email: string, password: string, name: string): Promise<void>;
  signIn(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
```

### 2. Database Service

**Purpose**: Manage user data persistence in DynamoDB with a simple single-table design.

**Table Design:**
```
Table: core-infrastructure-mvp
PK: USER#{userId}
SK: PROFILE
Attributes: email, name, createdAt, updatedAt
```

**Key Components:**
- `DatabaseService`: DynamoDB operations wrapper
- `UserRepository`: User-specific database operations

**Interfaces:**
```typescript
interface UserProfile {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseService {
  createUser(user: UserProfile): Promise<void>;
  getUser(userId: string): Promise<UserProfile | null>;
  updateUser(userId: string, updates: Partial<UserProfile>): Promise<void>;
}
```

### 3. AI Service

**Purpose**: Provide simple AI interactions using AWS Bedrock and Haiku 3.

**Key Components:**
- `AIService`: Bedrock integration wrapper
- `ChatInterface`: Simple chat UI for testing AI
- `AITestPage`: Dedicated page for AI functionality testing

**Interfaces:**
```typescript
interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIService {
  sendMessage(message: string): Promise<string>;
  getChatHistory(userId: string): Promise<AIMessage[]>;
  saveChatMessage(userId: string, message: AIMessage): Promise<void>;
}
```

### 4. API Layer

**Purpose**: Provide REST endpoints for frontend-backend communication.

**Endpoints:**
```
POST /api/auth/register - User registration
POST /api/auth/login - User login
GET /api/user/profile - Get user profile
PUT /api/user/profile - Update user profile
POST /api/ai/chat - Send message to AI
GET /api/ai/history - Get chat history
```

**Lambda Functions:**
- `authHandler`: Handles authentication operations
- `userHandler`: Manages user profile operations  
- `aiHandler`: Processes AI interactions

## Data Models

### User Profile
```typescript
interface UserProfile {
  userId: string;        // Cognito user ID
  email: string;         // User email address
  name: string;          // Display name
  createdAt: string;     // ISO timestamp
  updatedAt: string;     // ISO timestamp
}
```

### AI Chat Message
```typescript
interface ChatMessage {
  id: string;           // Unique message ID
  userId: string;       // User who sent/received message
  role: 'user' | 'assistant';
  content: string;      // Message content
  timestamp: string;    // ISO timestamp
}
```

### DynamoDB Items
```typescript
// User Profile Item
{
  PK: "USER#123e4567-e89b-12d3-a456-426614174000",
  SK: "PROFILE",
  email: "user@example.com",
  name: "John Doe",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}

// Chat Message Item
{
  PK: "USER#123e4567-e89b-12d3-a456-426614174000",
  SK: "CHAT#2024-01-01T12:00:00Z",
  messageId: "msg_123",
  role: "user",
  content: "Hello, how are you?",
  timestamp: "2024-01-01T12:00:00Z"
}
```

## Error Handling

### Error Categories
1. **Authentication Errors**: Invalid credentials, expired tokens
2. **Database Errors**: Connection failures, item not found
3. **AI Service Errors**: Bedrock unavailable, rate limits
4. **Validation Errors**: Invalid input data

### Error Response Format
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    timestamp: string;
  };
}
```

### Error Handling Strategy
- Frontend: Global error boundary with user-friendly messages
- Backend: Structured error responses with proper HTTP status codes
- Logging: CloudWatch logs for debugging and monitoring
- Retry: Exponential backoff for transient failures

## Testing Strategy

### Unit Tests
- Authentication service functions
- Database operations
- AI service integration
- Form validation logic

### Integration Tests
- API endpoint functionality
- Cognito integration
- DynamoDB operations
- Bedrock AI responses

### End-to-End Tests
- User registration flow
- Login and dashboard access
- Profile management
- AI chat functionality

## Security Considerations

### Authentication
- AWS Cognito handles password security
- JWT tokens for API authentication
- Secure token storage in browser

### Data Protection
- DynamoDB encryption at rest
- HTTPS/TLS for data in transit
- Input validation and sanitization

### API Security
- CORS configuration
- Rate limiting on API Gateway
- Request validation

## Deployment Strategy

### Infrastructure
- AWS CDK for infrastructure as code
- Separate stacks for different environments
- Environment-specific configuration

### CI/CD Pipeline
- GitHub Actions for automated deployment
- Automated testing before deployment
- Blue-green deployment for zero downtime

### Monitoring
- CloudWatch logs for all Lambda functions
- CloudWatch metrics for API Gateway
- Basic alerting for errors and performance

## Performance Considerations

### Frontend
- Next.js static generation where possible
- Code splitting for optimal loading
- CloudFront CDN for global delivery

### Backend
- Lambda cold start optimization
- DynamoDB single-table design for efficiency
- Connection pooling for external services

### Scalability
- Serverless architecture auto-scales
- DynamoDB on-demand billing
- API Gateway handles traffic spikes

This design provides a solid, deployable foundation that proves the core AWS services work together while remaining simple enough to build and deploy quickly. Each component can be extended incrementally as new features are added.