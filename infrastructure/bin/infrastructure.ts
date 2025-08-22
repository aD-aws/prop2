#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';

const app = new cdk.App();

// Get environment from context or environment variables
const environment = app.node.tryGetContext('environment') || process.env.ENVIRONMENT || 'dev';
const account = process.env.CDK_DEFAULT_ACCOUNT || app.node.tryGetContext('account');
const region = process.env.CDK_DEFAULT_REGION || app.node.tryGetContext('region') || 'eu-west-2';

// Environment-specific configuration
const envConfig = {
  dev: {
    stackName: 'UKHomeImprovementDev',
    description: 'UK Home Improvement Platform - Development Environment',
  },
  staging: {
    stackName: 'UKHomeImprovementStaging', 
    description: 'UK Home Improvement Platform - Staging Environment',
  },
  prod: {
    stackName: 'UKHomeImprovementProd',
    description: 'UK Home Improvement Platform - Production Environment',
  },
};

const config = envConfig[environment as keyof typeof envConfig] || envConfig.dev;

// Create the stack with environment-specific configuration
new InfrastructureStack(app, config.stackName, {
  env: { 
    account: account, 
    region: region 
  },
  description: config.description,
  tags: {
    Environment: environment,
    Project: 'UKHomeImprovement',
    ManagedBy: 'CDK',
  },
});

// Add stack-level tags
cdk.Tags.of(app).add('Project', 'UKHomeImprovement');
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('ManagedBy', 'CDK');