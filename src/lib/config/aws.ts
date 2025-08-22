// AWS Configuration for the UK Home Improvement Platform

export const awsConfig = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'eu-west-2',
  
  // Cognito Configuration
  cognito: {
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
    userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || '',
    identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || '',
  },
  
  // DynamoDB Table Names
  dynamodb: {
    usersTable: process.env.NEXT_PUBLIC_DYNAMODB_USERS_TABLE || 'uk-home-improvement-users',
    projectsTable: process.env.NEXT_PUBLIC_DYNAMODB_PROJECTS_TABLE || 'uk-home-improvement-projects',
    propertiesTable: process.env.NEXT_PUBLIC_DYNAMODB_PROPERTIES_TABLE || 'uk-home-improvement-properties',
    buildersTable: process.env.NEXT_PUBLIC_DYNAMODB_BUILDERS_TABLE || 'uk-home-improvement-builders',
    quotesTable: process.env.NEXT_PUBLIC_DYNAMODB_QUOTES_TABLE || 'uk-home-improvement-quotes',
    aiPromptsTable: process.env.NEXT_PUBLIC_DYNAMODB_AI_PROMPTS_TABLE || 'uk-home-improvement-ai-prompts',
    contractsTable: process.env.NEXT_PUBLIC_DYNAMODB_CONTRACTS_TABLE || 'uk-home-improvement-contracts',
    paymentsTable: process.env.NEXT_PUBLIC_DYNAMODB_PAYMENTS_TABLE || 'uk-home-improvement-payments',
    invitationsTable: process.env.NEXT_PUBLIC_DYNAMODB_INVITATIONS_TABLE || 'uk-home-improvement-invitations',
  },
  
  // S3 Configuration
  s3: {
    fileStorageBucket: process.env.NEXT_PUBLIC_S3_FILE_STORAGE_BUCKET || '',
  },
  
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
  },
};

// Validate required environment variables
export function validateAwsConfig() {
  const requiredVars = [
    'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
    'NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID',
    'NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID',
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn('Missing required AWS environment variables:', missing);
  }
  
  return missing.length === 0;
}