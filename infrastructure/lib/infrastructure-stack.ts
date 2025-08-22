import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as eventbridge from 'aws-cdk-lib/aws-events';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class InfrastructureStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for file storage
    const fileStorageBucket = new s3.Bucket(this, 'FileStorageBucket', {
      bucketName: `uk-home-improvement-files-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Cognito User Pool for authentication
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'uk-home-improvement-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        userType: new cognito.StringAttribute({ mutable: true }),
        companyName: new cognito.StringAttribute({ mutable: true }),
        companiesHouseNumber: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // User Pool Client
    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
    });

    // Identity Pool for AWS resource access
    this.identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: 'uk-home-improvement-identity',
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: this.userPoolClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
      ],
    });

    // DynamoDB Tables

    // Users Table
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'uk-home-improvement-users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for email lookup
    usersTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
    });

    // Projects Table
    const projectsTable = new dynamodb.Table(this, 'ProjectsTable', {
      tableName: 'uk-home-improvement-projects',
      partitionKey: { name: 'projectId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for homeowner lookup
    projectsTable.addGlobalSecondaryIndex({
      indexName: 'HomeownerIndex',
      partitionKey: { name: 'homeownerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for status lookup
    projectsTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.STRING },
    });

    // Properties Table
    const propertiesTable = new dynamodb.Table(this, 'PropertiesTable', {
      tableName: 'uk-home-improvement-properties',
      partitionKey: { name: 'propertyId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for postcode lookup
    propertiesTable.addGlobalSecondaryIndex({
      indexName: 'PostcodeIndex',
      partitionKey: { name: 'postcode', type: dynamodb.AttributeType.STRING },
    });

    // Builders Table
    const buildersTable = new dynamodb.Table(this, 'BuildersTable', {
      tableName: 'uk-home-improvement-builders',
      partitionKey: { name: 'builderId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for postcode and specialization lookup
    buildersTable.addGlobalSecondaryIndex({
      indexName: 'PostcodeSpecializationIndex',
      partitionKey: { name: 'postcode', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'specialization', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for postcode and project type (for lead management)
    buildersTable.addGlobalSecondaryIndex({
      indexName: 'PostcodeProjectTypeIndex',
      partitionKey: { name: 'postcode', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'projectType', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for vetting status
    buildersTable.addGlobalSecondaryIndex({
      indexName: 'VettingStatusIndex',
      partitionKey: { name: 'vettingStatus', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Quotes Table
    const quotesTable = new dynamodb.Table(this, 'QuotesTable', {
      tableName: 'uk-home-improvement-quotes',
      partitionKey: { name: 'quoteId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for project lookup
    quotesTable.addGlobalSecondaryIndex({
      indexName: 'ProjectIndex',
      partitionKey: { name: 'projectId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submittedAt', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for builder lookup
    quotesTable.addGlobalSecondaryIndex({
      indexName: 'BuilderIndex',
      partitionKey: { name: 'builderId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submittedAt', type: dynamodb.AttributeType.STRING },
    });

    // AI Agents Table
    const aiAgentsTable = new dynamodb.Table(this, 'AIAgentsTable', {
      tableName: 'uk-home-improvement-ai-agents',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for project type lookup
    aiAgentsTable.addGlobalSecondaryIndex({
      indexName: 'ProjectTypeIndex',
      partitionKey: { name: 'projectType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'specialization', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for orchestrator lookup
    aiAgentsTable.addGlobalSecondaryIndex({
      indexName: 'OrchestratorIndex',
      partitionKey: { name: 'isOrchestrator', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'specialization', type: dynamodb.AttributeType.STRING },
    });

    // AI Prompts Table
    const aiPromptsTable = new dynamodb.Table(this, 'AIPromptsTable', {
      tableName: 'uk-home-improvement-ai-prompts',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for agent lookup
    aiPromptsTable.addGlobalSecondaryIndex({
      indexName: 'AgentIndex',
      partitionKey: { name: 'agentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'version', type: dynamodb.AttributeType.NUMBER },
    });

    // Add GSI for active prompts
    aiPromptsTable.addGlobalSecondaryIndex({
      indexName: 'AgentActivePromptIndex',
      partitionKey: { name: 'agentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'isActive', type: dynamodb.AttributeType.STRING },
    });

    // AI Prompt Versions Table
    const aiPromptVersionsTable = new dynamodb.Table(this, 'AIPromptVersionsTable', {
      tableName: 'uk-home-improvement-ai-prompt-versions',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for prompt lookup
    aiPromptVersionsTable.addGlobalSecondaryIndex({
      indexName: 'PromptIdIndex',
      partitionKey: { name: 'promptId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'version', type: dynamodb.AttributeType.NUMBER },
    });

    // Add GSI for active versions
    aiPromptVersionsTable.addGlobalSecondaryIndex({
      indexName: 'PromptIdActiveIndex',
      partitionKey: { name: 'promptId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'isActive', type: dynamodb.AttributeType.STRING },
    });

    // AI Prompt Metrics Table
    const aiPromptMetricsTable = new dynamodb.Table(this, 'AIPromptMetricsTable', {
      tableName: 'uk-home-improvement-ai-prompt-metrics',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for prompt lookup
    aiPromptMetricsTable.addGlobalSecondaryIndex({
      indexName: 'PromptVersionIndex',
      partitionKey: { name: 'promptId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'version', type: dynamodb.AttributeType.NUMBER },
    });

    // AI Prompt Tests Table
    const aiPromptTestsTable = new dynamodb.Table(this, 'AIPromptTestsTable', {
      tableName: 'uk-home-improvement-ai-prompt-tests',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for prompt lookup
    aiPromptTestsTable.addGlobalSecondaryIndex({
      indexName: 'PromptVersionIndex',
      partitionKey: { name: 'promptId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'executedAt', type: dynamodb.AttributeType.STRING },
    });

    // Contracts Table
    const contractsTable = new dynamodb.Table(this, 'ContractsTable', {
      tableName: 'uk-home-improvement-contracts',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for project lookup
    contractsTable.addGlobalSecondaryIndex({
      indexName: 'ProjectIdIndex',
      partitionKey: { name: 'projectId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for homeowner lookup
    contractsTable.addGlobalSecondaryIndex({
      indexName: 'HomeownerIndex',
      partitionKey: { name: 'homeownerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for builder lookup
    contractsTable.addGlobalSecondaryIndex({
      indexName: 'BuilderIndex',
      partitionKey: { name: 'builderId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Contract Templates Table
    const contractTemplatesTable = new dynamodb.Table(this, 'ContractTemplatesTable', {
      tableName: 'uk-home-improvement-contract-templates',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for project type lookup
    contractTemplatesTable.addGlobalSecondaryIndex({
      indexName: 'ProjectTypeIndex',
      partitionKey: { name: 'projectType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'version', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for active templates
    contractTemplatesTable.addGlobalSecondaryIndex({
      indexName: 'ActiveTemplatesIndex',
      partitionKey: { name: 'isActive', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.STRING },
    });

    // Project Contracts Table (for quick project-contract lookups)
    const projectContractsTable = new dynamodb.Table(this, 'ProjectContractsTable', {
      tableName: 'uk-home-improvement-project-contracts',
      partitionKey: { name: 'projectId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'contractId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Payments Table
    const paymentsTable = new dynamodb.Table(this, 'PaymentsTable', {
      tableName: 'uk-home-improvement-payments',
      partitionKey: { name: 'paymentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for user lookup
    paymentsTable.addGlobalSecondaryIndex({
      indexName: 'UserIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Invitations Table
    const invitationsTable = new dynamodb.Table(this, 'InvitationsTable', {
      tableName: 'uk-home-improvement-invitations',
      partitionKey: { name: 'invitationCode', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for project lookup
    invitationsTable.addGlobalSecondaryIndex({
      indexName: 'ProjectIndex',
      partitionKey: { name: 'projectId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for homeowner lookup
    invitationsTable.addGlobalSecondaryIndex({
      indexName: 'HomeownerIndex',
      partitionKey: { name: 'homeownerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Vetting Records Table
    const vettingRecordsTable = new dynamodb.Table(this, 'VettingRecordsTable', {
      tableName: 'uk-home-improvement-vetting-records',
      partitionKey: { name: 'builderId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for status lookup
    vettingRecordsTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for reviewer lookup
    vettingRecordsTable.addGlobalSecondaryIndex({
      indexName: 'ReviewerIndex',
      partitionKey: { name: 'reviewerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.STRING },
    });

    // Leads Table for lead management system
    const leadsTable = new dynamodb.Table(this, 'LeadsTable', {
      tableName: 'uk-home-improvement-leads',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for leads by homeowner
    leadsTable.addGlobalSecondaryIndex({
      indexName: 'HomeownerIndex',
      partitionKey: { name: 'homeownerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for leads by status and postcode (for builder search)
    leadsTable.addGlobalSecondaryIndex({
      indexName: 'StatusPostcodeIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'postcode', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for leads by project type and postcode
    leadsTable.addGlobalSecondaryIndex({
      indexName: 'ProjectTypePostcodeIndex',
      partitionKey: { name: 'projectType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'postcode', type: dynamodb.AttributeType.STRING },
    });

    // Lead Offers Table
    const leadOffersTable = new dynamodb.Table(this, 'LeadOffersTable', {
      tableName: 'uk-home-improvement-lead-offers',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for offers by lead
    leadOffersTable.addGlobalSecondaryIndex({
      indexName: 'LeadIndex',
      partitionKey: { name: 'leadId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'offeredAt', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for offers by builder and status
    leadOffersTable.addGlobalSecondaryIndex({
      indexName: 'BuilderStatusIndex',
      partitionKey: { name: 'builderId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for offers by payment intent ID
    leadOffersTable.addGlobalSecondaryIndex({
      indexName: 'PaymentIntentIndex',
      partitionKey: { name: 'paymentIntentId', type: dynamodb.AttributeType.STRING },
    });

    // ========================================
    // PRODUCTION INFRASTRUCTURE ENHANCEMENTS
    // ========================================

    // KMS Key for encryption
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      description: 'KMS key for UK Home Improvement Platform encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // CloudWatch Log Groups with retention
    const apiLogGroup = new logs.LogGroup(this, 'APILogGroup', {
      logGroupName: '/aws/apigateway/uk-home-improvement-api',
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: encryptionKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: '/aws/lambda/uk-home-improvement',
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: encryptionKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: '/uk-home-improvement/application',
      retention: logs.RetentionDays.THREE_MONTHS,
      encryptionKey: encryptionKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // SNS Topics for alerting
    const criticalAlertsTopic = new sns.Topic(this, 'CriticalAlertsTopic', {
      topicName: 'uk-home-improvement-critical-alerts',
      displayName: 'UK Home Improvement Critical Alerts',
      masterKey: encryptionKey,
    });

    const warningAlertsTopic = new sns.Topic(this, 'WarningAlertsTopic', {
      topicName: 'uk-home-improvement-warning-alerts',
      displayName: 'UK Home Improvement Warning Alerts',
      masterKey: encryptionKey,
    });

    // CloudWatch Alarms for DynamoDB
    const dynamoDbTables = [
      usersTable, projectsTable, propertiesTable, buildersTable, quotesTable,
      aiAgentsTable, aiPromptsTable, contractsTable, paymentsTable, invitationsTable
    ];

    dynamoDbTables.forEach((table, index) => {
      // Read throttle alarm
      new cloudwatch.Alarm(this, `${table.node.id}ReadThrottleAlarm`, {
        alarmName: `${table.tableName}-read-throttle`,
        metric: table.metricUserErrors({
          dimensionsMap: {
            TableName: table.tableName,
          },
        }),
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(criticalAlertsTopic));

      // Write throttle alarm
      new cloudwatch.Alarm(this, `${table.node.id}WriteThrottleAlarm`, {
        alarmName: `${table.tableName}-write-throttle`,
        metric: table.metricSystemErrors({
          dimensionsMap: {
            TableName: table.tableName,
          },
        }),
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(criticalAlertsTopic));
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'MonitoringDashboard', {
      dashboardName: 'UK-Home-Improvement-Platform',
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Capacity',
        left: dynamoDbTables.map(table => table.metricConsumedReadCapacityUnits()),
        right: dynamoDbTables.map(table => table.metricConsumedWriteCapacityUnits()),
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: {
              ApiName: 'uk-home-improvement-api',
            },
            statistic: 'Sum',
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            dimensionsMap: {
              ApiName: 'uk-home-improvement-api',
            },
            statistic: 'Sum',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            dimensionsMap: {
              ApiName: 'uk-home-improvement-api',
            },
            statistic: 'Sum',
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // CloudTrail for audit logging
    const cloudTrail = new cloudtrail.Trail(this, 'AuditTrail', {
      trailName: 'uk-home-improvement-audit-trail',
      bucket: new s3.Bucket(this, 'AuditLogsBucket', {
        bucketName: `uk-home-improvement-audit-logs-${this.account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: encryptionKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        lifecycleRules: [
          {
            id: 'audit-logs-lifecycle',
            enabled: true,
            transitions: [
              {
                storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                transitionAfter: cdk.Duration.days(30),
              },
              {
                storageClass: s3.StorageClass.GLACIER,
                transitionAfter: cdk.Duration.days(90),
              },
            ],
            expiration: cdk.Duration.days(2555), // 7 years for compliance
          },
        ],
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }),
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
    });

    // AWS Backup for disaster recovery
    const backupVault = new backup.BackupVault(this, 'BackupVault', {
      backupVaultName: 'uk-home-improvement-backup-vault',
      encryptionKey: encryptionKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Backup plan for DynamoDB tables
    const backupPlan = new backup.BackupPlan(this, 'BackupPlan', {
      backupPlanName: 'uk-home-improvement-backup-plan',
      backupVault: backupVault,
    });

    // Note: Backup rules can be configured later via AWS Console or separate CDK stack
    // This simplifies the initial deployment

    // Secrets Manager for sensitive configuration
    const stripeSecret = new secretsmanager.Secret(this, 'StripeSecret', {
      secretName: 'uk-home-improvement/stripe',
      description: 'Stripe API keys and configuration',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ 
          publishableKey: 'pk_live_placeholder',
          webhookSecret: 'whsec_placeholder'
        }),
        generateStringKey: 'secretKey',
        excludeCharacters: '"@/\\',
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const docusignSecret = new secretsmanager.Secret(this, 'DocuSignSecret', {
      secretName: 'uk-home-improvement/docusign',
      description: 'DocuSign API configuration',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          integrationKey: 'placeholder',
          userId: 'placeholder',
          accountId: 'placeholder',
          baseUrl: 'https://demo.docusign.net/restapi'
        }),
        generateStringKey: 'privateKey',
        excludeCharacters: '"@/\\',
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const claudeSecret = new secretsmanager.Secret(this, 'ClaudeSecret', {
      secretName: 'uk-home-improvement/claude',
      description: 'Claude AI API configuration',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          maxTokens: 4096
        }),
        generateStringKey: 'apiKey',
        excludeCharacters: '"@/\\',
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // WAF Web ACL for security
    const webAcl = new wafv2.CfnWebACL(this, 'WebACL', {
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputsRuleSetMetric',
          },
        },
        {
          name: 'RateLimitRule',
          priority: 3,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRuleMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'WebACLMetric',
      },
    });

    // EventBridge for system events
    const systemEventBus = new events.EventBus(this, 'SystemEventBus', {
      eventBusName: 'uk-home-improvement-system-events',
    });

    // Event rules for monitoring
    const errorEventRule = new events.Rule(this, 'ErrorEventRule', {
      eventBus: systemEventBus,
      eventPattern: {
        source: ['uk-home-improvement'],
        detailType: ['Error Event'],
      },
      targets: [new targets.SnsTopic(criticalAlertsTopic)],
    });

    const userActivityRule = new events.Rule(this, 'UserActivityRule', {
      eventBus: systemEventBus,
      eventPattern: {
        source: ['uk-home-improvement'],
        detailType: ['User Activity'],
      },
    });

    // Step Functions for AI workflow orchestration
    const aiWorkflowRole = new iam.Role(this, 'AIWorkflowRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaRole'),
      ],
    });

    // Lambda function for AI agent coordination
    const aiCoordinatorFunction = new lambda.Function(this, 'AICoordinatorFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('AI Coordinator Event:', JSON.stringify(event, null, 2));
          // Placeholder for AI coordination logic
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'AI coordination completed' })
          };
        };
      `),
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      logGroup: lambdaLogGroup,
      environment: {
        CLAUDE_SECRET_ARN: claudeSecret.secretArn,
        SYSTEM_EVENT_BUS_NAME: systemEventBus.eventBusName,
      },
    });

    // Grant permissions to AI coordinator
    claudeSecret.grantRead(aiCoordinatorFunction);
    systemEventBus.grantPutEventsTo(aiCoordinatorFunction);

    // Step Functions state machine for AI workflows
    const aiWorkflowStateMachine = new stepfunctions.StateMachine(this, 'AIWorkflowStateMachine', {
      stateMachineName: 'uk-home-improvement-ai-workflow',
      definition: new sfnTasks.LambdaInvoke(this, 'InvokeAICoordinator', {
        lambdaFunction: aiCoordinatorFunction,
        outputPath: '$.Payload',
      }),
      role: aiWorkflowRole,
      logs: {
        destination: new logs.LogGroup(this, 'AIWorkflowLogGroup', {
          logGroupName: '/aws/stepfunctions/uk-home-improvement-ai-workflow',
          retention: logs.RetentionDays.ONE_MONTH,
          encryptionKey: encryptionKey,
        }),
        level: stepfunctions.LogLevel.ALL,
      },
    });

    // Performance monitoring
    const performanceMetricFilter = new logs.MetricFilter(this, 'PerformanceMetricFilter', {
      logGroup: applicationLogGroup,
      metricNamespace: 'UKHomeImprovement/Performance',
      metricName: 'ResponseTime',
      filterPattern: logs.FilterPattern.exists('$.responseTime'),
      metricValue: '$.responseTime',
    });

    // High response time alarm
    new cloudwatch.Alarm(this, 'HighResponseTimeAlarm', {
      alarmName: 'uk-home-improvement-high-response-time',
      metric: performanceMetricFilter.metric({
        statistic: 'Average',
      }),
      threshold: 5000, // 5 seconds
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(warningAlertsTopic));

    // Error rate monitoring
    const errorMetricFilter = new logs.MetricFilter(this, 'ErrorMetricFilter', {
      logGroup: applicationLogGroup,
      metricNamespace: 'UKHomeImprovement/Errors',
      metricName: 'ErrorCount',
      filterPattern: logs.FilterPattern.stringValue('$.level', '=', 'ERROR'),
    });

    // High error rate alarm
    new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      alarmName: 'uk-home-improvement-high-error-rate',
      metric: errorMetricFilter.metric({
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(criticalAlertsTopic));

    // Output important values
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: this.identityPool.ref,
      description: 'Cognito Identity Pool ID',
    });

    new cdk.CfnOutput(this, 'FileStorageBucketName', {
      value: fileStorageBucket.bucketName,
      description: 'S3 Bucket for file storage',
    });

    // Output DynamoDB table names
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
      description: 'DynamoDB Users Table Name',
    });

    new cdk.CfnOutput(this, 'ProjectsTableName', {
      value: projectsTable.tableName,
      description: 'DynamoDB Projects Table Name',
    });

    new cdk.CfnOutput(this, 'PropertiesTableName', {
      value: propertiesTable.tableName,
      description: 'DynamoDB Properties Table Name',
    });

    new cdk.CfnOutput(this, 'BuildersTableName', {
      value: buildersTable.tableName,
      description: 'DynamoDB Builders Table Name',
    });

    new cdk.CfnOutput(this, 'QuotesTableName', {
      value: quotesTable.tableName,
      description: 'DynamoDB Quotes Table Name',
    });

    new cdk.CfnOutput(this, 'AIAgentsTableName', {
      value: aiAgentsTable.tableName,
      description: 'DynamoDB AI Agents Table Name',
    });

    new cdk.CfnOutput(this, 'AIPromptsTableName', {
      value: aiPromptsTable.tableName,
      description: 'DynamoDB AI Prompts Table Name',
    });

    new cdk.CfnOutput(this, 'AIPromptVersionsTableName', {
      value: aiPromptVersionsTable.tableName,
      description: 'DynamoDB AI Prompt Versions Table Name',
    });

    new cdk.CfnOutput(this, 'AIPromptMetricsTableName', {
      value: aiPromptMetricsTable.tableName,
      description: 'DynamoDB AI Prompt Metrics Table Name',
    });

    new cdk.CfnOutput(this, 'AIPromptTestsTableName', {
      value: aiPromptTestsTable.tableName,
      description: 'DynamoDB AI Prompt Tests Table Name',
    });

    new cdk.CfnOutput(this, 'ContractsTableName', {
      value: contractsTable.tableName,
      description: 'DynamoDB Contracts Table Name',
    });

    new cdk.CfnOutput(this, 'ContractTemplatesTableName', {
      value: contractTemplatesTable.tableName,
      description: 'DynamoDB Contract Templates Table Name',
    });

    new cdk.CfnOutput(this, 'ProjectContractsTableName', {
      value: projectContractsTable.tableName,
      description: 'DynamoDB Project Contracts Table Name',
    });

    new cdk.CfnOutput(this, 'PaymentsTableName', {
      value: paymentsTable.tableName,
      description: 'DynamoDB Payments Table Name',
    });

    new cdk.CfnOutput(this, 'InvitationsTableName', {
      value: invitationsTable.tableName,
      description: 'DynamoDB Invitations Table Name',
    });

    new cdk.CfnOutput(this, 'VettingRecordsTableName', {
      value: vettingRecordsTable.tableName,
      description: 'DynamoDB Vetting Records Table Name',
    });

    new cdk.CfnOutput(this, 'LeadsTableName', {
      value: leadsTable.tableName,
      description: 'DynamoDB Leads Table Name',
    });

    new cdk.CfnOutput(this, 'LeadOffersTableName', {
      value: leadOffersTable.tableName,
      description: 'DynamoDB Lead Offers Table Name',
    });

    // Production Infrastructure Outputs
    new cdk.CfnOutput(this, 'EncryptionKeyId', {
      value: encryptionKey.keyId,
      description: 'KMS Encryption Key ID',
    });

    new cdk.CfnOutput(this, 'CriticalAlertsTopicArn', {
      value: criticalAlertsTopic.topicArn,
      description: 'SNS Topic ARN for Critical Alerts',
    });

    new cdk.CfnOutput(this, 'WarningAlertsTopicArn', {
      value: warningAlertsTopic.topicArn,
      description: 'SNS Topic ARN for Warning Alerts',
    });

    new cdk.CfnOutput(this, 'MonitoringDashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'BackupVaultName', {
      value: backupVault.backupVaultName,
      description: 'AWS Backup Vault Name',
    });

    new cdk.CfnOutput(this, 'SystemEventBusName', {
      value: systemEventBus.eventBusName,
      description: 'EventBridge System Event Bus Name',
    });

    new cdk.CfnOutput(this, 'AIWorkflowStateMachineArn', {
      value: aiWorkflowStateMachine.stateMachineArn,
      description: 'Step Functions AI Workflow State Machine ARN',
    });

    new cdk.CfnOutput(this, 'StripeSecretArn', {
      value: stripeSecret.secretArn,
      description: 'Stripe Configuration Secret ARN',
    });

    new cdk.CfnOutput(this, 'DocuSignSecretArn', {
      value: docusignSecret.secretArn,
      description: 'DocuSign Configuration Secret ARN',
    });

    new cdk.CfnOutput(this, 'ClaudeSecretArn', {
      value: claudeSecret.secretArn,
      description: 'Claude AI Configuration Secret ARN',
    });

    new cdk.CfnOutput(this, 'WebACLArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN for CloudFront',
    });

    // Planning Permission Data Mining Tables
    const planningApplicationsTable = new dynamodb.Table(this, 'PlanningApplicationsTable', {
      tableName: 'uk-home-improvement-planning-applications',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for council area and project type queries
    planningApplicationsTable.addGlobalSecondaryIndex({
      indexName: 'CouncilAreaIndex',
      partitionKey: { name: 'councilArea', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submissionDate', type: dynamodb.AttributeType.STRING },
    });

    planningApplicationsTable.addGlobalSecondaryIndex({
      indexName: 'ProjectTypeIndex',
      partitionKey: { name: 'projectType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submissionDate', type: dynamodb.AttributeType.STRING },
    });

    planningApplicationsTable.addGlobalSecondaryIndex({
      indexName: 'PostcodeIndex',
      partitionKey: { name: 'postcode', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submissionDate', type: dynamodb.AttributeType.STRING },
    });

    planningApplicationsTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'applicantEmail', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'scrapedAt', type: dynamodb.AttributeType.STRING },
    });

    const councilScrapingConfigsTable = new dynamodb.Table(this, 'CouncilScrapingConfigsTable', {
      tableName: 'uk-home-improvement-council-scraping-configs',
      partitionKey: { name: 'councilName', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const marketingCampaignsTable = new dynamodb.Table(this, 'MarketingCampaignsTable', {
      tableName: 'uk-home-improvement-marketing-campaigns',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    marketingCampaignsTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    const campaignTemplatesTable = new dynamodb.Table(this, 'CampaignTemplatesTable', {
      tableName: 'uk-home-improvement-campaign-templates',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    campaignTemplatesTable.addGlobalSecondaryIndex({
      indexName: 'ChannelIndex',
      partitionKey: { name: 'channel', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    const campaignAudiencesTable = new dynamodb.Table(this, 'CampaignAudiencesTable', {
      tableName: 'uk-home-improvement-campaign-audiences',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const campaignMetricsTable = new dynamodb.Table(this, 'CampaignMetricsTable', {
      tableName: 'uk-home-improvement-campaign-metrics',
      partitionKey: { name: 'campaignId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const campaignDeliveriesTable = new dynamodb.Table(this, 'CampaignDeliveriesTable', {
      tableName: 'uk-home-improvement-campaign-deliveries',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    campaignDeliveriesTable.addGlobalSecondaryIndex({
      indexName: 'CampaignIndex',
      partitionKey: { name: 'campaignId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });

    // GDPR Compliance Tables
    const gdprConsentsTable = new dynamodb.Table(this, 'GDPRConsentsTable', {
      tableName: 'uk-home-improvement-gdpr-consents',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    gdprConsentsTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'consentDate', type: dynamodb.AttributeType.STRING },
    });

    const dataProcessingRecordsTable = new dynamodb.Table(this, 'DataProcessingRecordsTable', {
      tableName: 'uk-home-improvement-data-processing-records',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    dataProcessingRecordsTable.addGlobalSecondaryIndex({
      indexName: 'DataSubjectIndex',
      partitionKey: { name: 'dataSubjectId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'processingDate', type: dynamodb.AttributeType.STRING },
    });

    const dataSubjectRequestsTable = new dynamodb.Table(this, 'DataSubjectRequestsTable', {
      tableName: 'uk-home-improvement-data-subject-requests',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    dataSubjectRequestsTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'dataSubjectEmail', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'requestDate', type: dynamodb.AttributeType.STRING },
    });

    const optOutRecordsTable = new dynamodb.Table(this, 'OptOutRecordsTable', {
      tableName: 'uk-home-improvement-opt-out-records',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    optOutRecordsTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'optOutDate', type: dynamodb.AttributeType.STRING },
    });

    const globalOptOutListTable = new dynamodb.Table(this, 'GlobalOptOutListTable', {
      tableName: 'uk-home-improvement-global-opt-out-list',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Supporting tables
    const scrapingRateLimitTable = new dynamodb.Table(this, 'ScrapingRateLimitTable', {
      tableName: 'uk-home-improvement-scraping-rate-limit',
      partitionKey: { name: 'councilName', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const verificationTokensTable = new dynamodb.Table(this, 'VerificationTokensTable', {
      tableName: 'uk-home-improvement-verification-tokens',
      partitionKey: { name: 'token', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'expiresAt',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const campaignInteractionsTable = new dynamodb.Table(this, 'CampaignInteractionsTable', {
      tableName: 'uk-home-improvement-campaign-interactions',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    campaignInteractionsTable.addGlobalSecondaryIndex({
      indexName: 'CampaignIndex',
      partitionKey: { name: 'campaignId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });

    // Output planning permission data mining table names
    new cdk.CfnOutput(this, 'PlanningApplicationsTableName', {
      value: planningApplicationsTable.tableName,
      description: 'DynamoDB Planning Applications Table Name',
    });

    new cdk.CfnOutput(this, 'CouncilScrapingConfigsTableName', {
      value: councilScrapingConfigsTable.tableName,
      description: 'DynamoDB Council Scraping Configs Table Name',
    });

    new cdk.CfnOutput(this, 'MarketingCampaignsTableName', {
      value: marketingCampaignsTable.tableName,
      description: 'DynamoDB Marketing Campaigns Table Name',
    });

    new cdk.CfnOutput(this, 'CampaignTemplatesTableName', {
      value: campaignTemplatesTable.tableName,
      description: 'DynamoDB Campaign Templates Table Name',
    });

    new cdk.CfnOutput(this, 'CampaignAudiencesTableName', {
      value: campaignAudiencesTable.tableName,
      description: 'DynamoDB Campaign Audiences Table Name',
    });

    new cdk.CfnOutput(this, 'CampaignMetricsTableName', {
      value: campaignMetricsTable.tableName,
      description: 'DynamoDB Campaign Metrics Table Name',
    });

    new cdk.CfnOutput(this, 'GDPRConsentsTableName', {
      value: gdprConsentsTable.tableName,
      description: 'DynamoDB GDPR Consents Table Name',
    });

    new cdk.CfnOutput(this, 'DataProcessingRecordsTableName', {
      value: dataProcessingRecordsTable.tableName,
      description: 'DynamoDB Data Processing Records Table Name',
    });

    new cdk.CfnOutput(this, 'DataSubjectRequestsTableName', {
      value: dataSubjectRequestsTable.tableName,
      description: 'DynamoDB Data Subject Requests Table Name',
    });

    new cdk.CfnOutput(this, 'OptOutRecordsTableName', {
      value: optOutRecordsTable.tableName,
      description: 'DynamoDB Opt Out Records Table Name',
    });
  }
}
