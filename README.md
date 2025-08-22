# UK Home Improvement Platform

A comprehensive web platform that streamlines the process of planning, scoping, and contracting home improvement projects in the UK. The platform leverages AI-driven project planning to connect homeowners with vetted builders through automatically generated Scopes of Work (SoW) that comply with UK building regulations.

## Features

- **AI-Powered Project Planning**: Multi-agent AI system with specialized expertise for different project types
- **Regulatory Compliance**: Built-in UK building regulations and planning permission checks
- **Builder Verification**: Comprehensive vetting process with Companies House verification
- **Transparent Pricing**: Detailed cost breakdowns and AI-powered quote analysis
- **Contract Generation**: Automated contract creation with DocuSign integration
- **Payment Processing**: Secure payments via Stripe with tiered access models

## Technology Stack

### Frontend
- **Next.js 15** with TypeScript
- **Tailwind CSS** for styling
- **React Query** for state management
- **Recharts** for Gantt chart visualization

### Backend
- **AWS Lambda** (Node.js/TypeScript)
- **AWS API Gateway** (REST + GraphQL)
- **AWS DynamoDB** (NoSQL database)
- **AWS Cognito** for authentication
- **AWS S3** for file storage

### AI & ML
- **Claude Sonnet 4** for specialized agents
- **AWS Bedrock** for Claude integration
- Custom multi-agent orchestration framework

### Infrastructure
- **AWS CDK** for Infrastructure as Code
- **Stripe** for payment processing
- **DocuSign** for contract signing

## Project Structure

```
uk-home-improvement-platform/
├── src/
│   ├── app/                    # Next.js app directory
│   ├── components/             # React components
│   │   └── ui/                # Reusable UI components
│   └── lib/                   # Utility libraries
│       ├── aws/               # AWS service integrations
│       ├── config/            # Configuration files
│       └── types/             # TypeScript type definitions
├── infrastructure/            # AWS CDK infrastructure code
└── public/                   # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- AWS CDK CLI installed globally: `npm install -g aws-cdk`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd uk-home-improvement-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration values
   ```

4. **Deploy AWS infrastructure**
   ```bash
   cd infrastructure
   npm install
   npx cdk bootstrap  # Only needed once per AWS account/region
   npx cdk deploy
   ```

5. **Update environment variables**
   After CDK deployment, update `.env.local` with the output values from the stack.

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Infrastructure Setup

The AWS infrastructure includes:

### DynamoDB Tables
- **Users**: User profiles and authentication data
- **Projects**: Project information and status
- **Properties**: Property details and compliance data
- **Builders**: Builder profiles and verification status
- **Quotes**: Builder quotes and pricing information
- **AI Prompts**: AI agent prompts and versioning
- **Contracts**: Contract documents and signatures
- **Payments**: Payment transactions and subscriptions

### Cognito Configuration
- User Pool for authentication
- User Pool Client for web application
- Identity Pool for AWS resource access
- Custom attributes for user types and builder information

### S3 Storage
- File storage bucket for documents and images
- Versioning and encryption enabled
- Secure access controls

## Environment Variables

Required environment variables (see `.env.local.example`):

```bash
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=eu-west-2
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=your-user-pool-client-id
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=your-identity-pool-id

# DynamoDB Tables (set after CDK deployment)
NEXT_PUBLIC_DYNAMODB_USERS_TABLE=uk-home-improvement-users
NEXT_PUBLIC_DYNAMODB_PROJECTS_TABLE=uk-home-improvement-projects
# ... other table names

# External Services
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key
STRIPE_SECRET_KEY=your-stripe-secret
CLAUDE_API_KEY=your-claude-api-key
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Infrastructure Commands

```bash
cd infrastructure
npx cdk diff      # Compare deployed stack with current state
npx cdk deploy    # Deploy stack to AWS
npx cdk destroy   # Remove stack from AWS
npx cdk synth     # Generate CloudFormation template
```

## Architecture

The platform follows a serverless microservices architecture:

1. **Frontend**: React SPA with Next.js
2. **Authentication**: AWS Cognito
3. **API**: AWS API Gateway + Lambda
4. **Database**: DynamoDB with GSIs
5. **Storage**: S3 for files
6. **AI**: Multi-agent system with Claude Sonnet 4
7. **Payments**: Stripe integration
8. **Contracts**: DocuSign integration

## Security

- All data encrypted at rest and in transit
- AWS Cognito for secure authentication
- Role-based access control (RBAC)
- PCI DSS compliance via Stripe
- GDPR compliance measures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.