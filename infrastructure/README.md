# UK Home Improvement Platform - Infrastructure

This directory contains the AWS CDK infrastructure code for the UK Home Improvement Platform.

## Overview

The infrastructure is designed with production-ready features including:

- **Security**: KMS encryption, WAF protection, CloudTrail auditing
- **Monitoring**: CloudWatch dashboards, alarms, and SNS notifications
- **Backup & DR**: AWS Backup with automated schedules and cross-region replication
- **Scalability**: Auto-scaling DynamoDB tables and Lambda functions
- **Compliance**: GDPR-ready data handling and audit trails

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │   Lambda        │
│   (Next.js)     │◄──►│   + WAF          │◄──►│   Functions     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   Cognito        │    │   DynamoDB      │
│   + WAF         │    │   (Auth)         │    │   (Encrypted)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                        ┌──────────────────────────────────────────┐
                        │                                          │
                        ▼                                          ▼
                ┌───────────────┐    ┌─────────────────┐    ┌───────────────┐
                │   S3 Bucket   │    │   Step Functions│    │   EventBridge │
                │   (Encrypted) │    │   (AI Workflow) │    │   (Events)    │
                └───────────────┘    └─────────────────┘    └───────────────┘
                        │                                          │
                        ▼                                          ▼
                ┌───────────────┐    ┌─────────────────┐    ┌───────────────┐
                │   AWS Backup  │    │   CloudWatch    │    │   Secrets     │
                │   (DR)        │    │   (Monitoring)  │    │   Manager     │
                └───────────────┘    └─────────────────┘    └───────────────┘
```

## Prerequisites

- AWS CLI v2.x configured with appropriate permissions
- AWS CDK v2.x installed globally (`npm install -g aws-cdk`)
- Node.js 18.x or later
- Appropriate AWS permissions (see PRODUCTION-DEPLOYMENT.md)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Bootstrap CDK (First Time Only)

```bash
npx cdk bootstrap --context environment=prod
```

### 3. Deploy Infrastructure

```bash
# Deploy to development
npx cdk deploy --context environment=dev

# Deploy to staging
npx cdk deploy --context environment=staging

# Deploy to production
npx cdk deploy --context environment=prod
```

## Environment Configuration

The infrastructure supports multiple environments through CDK context:

- `dev` - Development environment with minimal resources
- `staging` - Staging environment with production-like configuration
- `prod` - Production environment with full security and monitoring

### Environment-Specific Features

| Feature | Dev | Staging | Prod |
|---------|-----|---------|------|
| KMS Encryption | ✓ | ✓ | ✓ |
| WAF Protection | ✗ | ✓ | ✓ |
| CloudTrail | ✗ | ✓ | ✓ |
| Backup & DR | ✗ | ✓ | ✓ |
| Multi-AZ | ✗ | ✓ | ✓ |
| Monitoring | Basic | Full | Full |

## Infrastructure Components

### Core Services

- **DynamoDB Tables**: User data, projects, quotes, contracts
- **Cognito**: User authentication and authorization
- **S3**: File storage with encryption
- **Lambda**: Serverless compute for AI agents
- **API Gateway**: RESTful API endpoints
- **Step Functions**: AI workflow orchestration

### Security

- **KMS**: Encryption key management with automatic rotation
- **WAF**: Web application firewall with managed rules
- **CloudTrail**: API audit logging
- **Secrets Manager**: Secure storage for API keys and credentials
- **IAM**: Least-privilege access controls

### Monitoring & Alerting

- **CloudWatch**: Metrics, logs, and dashboards
- **SNS**: Alert notifications (email, SMS, Slack)
- **EventBridge**: System event routing
- **Custom Alarms**: Performance and error monitoring

### Backup & Disaster Recovery

- **AWS Backup**: Automated backup schedules
- **Point-in-Time Recovery**: DynamoDB PITR enabled
- **Cross-Region Replication**: Critical data backup
- **Backup Validation**: Automated integrity checks

## Deployment Scripts

The platform includes several deployment and management scripts:

```bash
# Deploy infrastructure
../scripts/deploy.sh [environment]

# Health check
../scripts/health-check.sh [environment]

# Setup monitoring
../scripts/setup-monitoring.sh [environment] [email]

# Disaster recovery
../scripts/disaster-recovery.sh [action] [environment]

# Validate deployment
../scripts/validate-deployment.sh [environment]
```

## CDK Commands

```bash
# Synthesize CloudFormation template
npx cdk synth --context environment=prod

# Show differences between deployed and local
npx cdk diff --context environment=prod

# Deploy with approval
npx cdk deploy --context environment=prod

# Destroy infrastructure (use with caution!)
npx cdk destroy --context environment=prod
```

## Stack Outputs

After deployment, the stack provides important outputs:

- **UserPoolId**: Cognito User Pool ID
- **UserPoolClientId**: Cognito Client ID
- **FileStorageBucketName**: S3 bucket for file storage
- **MonitoringDashboardUrl**: CloudWatch dashboard URL
- **CriticalAlertsTopicArn**: SNS topic for critical alerts
- **BackupVaultName**: AWS Backup vault name

## Security Configuration

### Secrets Management

The infrastructure creates placeholder secrets that must be updated with actual values:

```bash
# Update Stripe configuration
aws secretsmanager update-secret \
  --secret-id uk-home-improvement/stripe \
  --secret-string '{"secretKey":"sk_live_...","publishableKey":"pk_live_...","webhookSecret":"whsec_..."}'

# Update DocuSign configuration
aws secretsmanager update-secret \
  --secret-id uk-home-improvement/docusign \
  --secret-string '{"integrationKey":"...","userId":"...","accountId":"...","privateKey":"-----BEGIN RSA PRIVATE KEY-----\n..."}'

# Update Claude AI configuration
aws secretsmanager update-secret \
  --secret-id uk-home-improvement/claude \
  --secret-string '{"apiKey":"...","model":"claude-3-sonnet-20240229","maxTokens":4096}'
```

### WAF Configuration

The WAF includes:
- AWS Managed Rules for common attacks
- Rate limiting (2000 requests per 5 minutes per IP)
- Known bad inputs protection
- Custom rules for application-specific threats

### Encryption

- **At Rest**: All DynamoDB tables and S3 buckets use KMS encryption
- **In Transit**: TLS 1.3 for all communications
- **Key Rotation**: Automatic KMS key rotation enabled

## Monitoring Setup

### CloudWatch Dashboards

The infrastructure creates comprehensive dashboards showing:
- DynamoDB read/write capacity and throttling
- API Gateway request rates and errors
- Lambda function performance and errors
- Custom business metrics

### Alerting

Two SNS topics are created:
- **Critical Alerts**: System failures, security incidents
- **Warning Alerts**: Performance degradation, capacity issues

### Custom Metrics

The platform tracks:
- Application response times
- Error rates by service
- Business KPIs (user registrations, project creations)
- AI agent performance metrics

## Backup Strategy

### Automated Backups

- **Daily**: All critical DynamoDB tables
- **Weekly**: Long-term retention backups
- **Retention**: 30 days for daily, 365 days for weekly
- **Cold Storage**: Move to cold storage after 7 days

### Point-in-Time Recovery

- Enabled for all DynamoDB tables
- 5-minute RPO (Recovery Point Objective)
- 35-day retention window

### Disaster Recovery

- **RTO**: 30 minutes (Recovery Time Objective)
- **RPO**: 5 minutes (Recovery Point Objective)
- **Testing**: Monthly DR tests automated
- **Documentation**: Detailed runbooks provided

## Cost Optimization

### DynamoDB

- On-demand billing for variable workloads
- Auto-scaling for predictable workloads
- Global secondary indexes optimized for query patterns

### Lambda

- Right-sized memory allocation
- Provisioned concurrency for critical functions
- Dead letter queues for error handling

### S3

- Intelligent tiering for cost optimization
- Lifecycle policies for old data
- CloudFront caching to reduce data transfer

## Troubleshooting

### Common Issues

1. **Stack Deployment Fails**
   - Check AWS service limits
   - Verify IAM permissions
   - Review CloudFormation events

2. **DynamoDB Throttling**
   - Check read/write capacity settings
   - Review query patterns
   - Consider auto-scaling configuration

3. **Lambda Timeouts**
   - Increase memory allocation
   - Optimize code performance
   - Check external service dependencies

### Debugging Commands

```bash
# Check stack events
aws cloudformation describe-stack-events --stack-name UKHomeImprovementProd

# View CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix "/uk-home-improvement"

# Check DynamoDB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=uk-home-improvement-users \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

## Compliance & Governance

### GDPR Compliance

- Data encryption at rest and in transit
- Right to be forgotten implementation
- Data processing audit trails
- Consent management system

### Security Standards

- Regular security assessments
- Penetration testing procedures
- Vulnerability management
- Security training requirements

### Change Management

- Infrastructure as Code (CDK)
- Version control for all changes
- Automated testing and validation
- Rollback procedures documented

## Support & Maintenance

### Regular Tasks

- **Weekly**: Review monitoring dashboards
- **Monthly**: Security patches and updates
- **Quarterly**: Disaster recovery testing
- **Annually**: Security audit and compliance review

### Emergency Procedures

1. **System Outage**: Follow incident response plan
2. **Security Incident**: Isolate and assess impact
3. **Data Breach**: Notify security team and legal
4. **Performance Issues**: Scale resources and investigate

### Contact Information

- **DevOps Team**: [Add contact details]
- **Security Team**: [Add contact details]
- **AWS Support**: [Add support plan details]

## Contributing

1. Make changes in a feature branch
2. Test in development environment
3. Create pull request with detailed description
4. Deploy to staging for validation
5. Deploy to production after approval

## License

This infrastructure code is proprietary to the UK Home Improvement Platform project.

---

For detailed deployment instructions, see [PRODUCTION-DEPLOYMENT.md](../PRODUCTION-DEPLOYMENT.md).