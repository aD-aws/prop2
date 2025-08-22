# Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the UK Home Improvement Platform to production with proper security, monitoring, and disaster recovery configurations.

## Prerequisites

### Required Tools
- AWS CLI v2.x configured with appropriate permissions
- AWS CDK v2.x
- Node.js 18.x or later
- Docker (for local testing)
- Git

### AWS Permissions Required
- CloudFormation full access
- DynamoDB full access
- Cognito full access
- S3 full access
- Lambda full access
- API Gateway full access
- CloudWatch full access
- SNS full access
- Secrets Manager full access
- Backup full access
- KMS full access

## Pre-Deployment Checklist

### Security Configuration
- [ ] Review and update IAM roles and policies
- [ ] Configure KMS encryption keys
- [ ] Set up AWS Secrets Manager secrets
- [ ] Configure WAF rules for CloudFront
- [ ] Enable CloudTrail for audit logging
- [ ] Review VPC and security group configurations

### Monitoring and Alerting
- [ ] Configure SNS topics for alerts
- [ ] Set up CloudWatch alarms
- [ ] Create monitoring dashboard
- [ ] Configure log retention policies
- [ ] Set up synthetic monitoring (optional)

### Backup and Disaster Recovery
- [ ] Configure AWS Backup vault
- [ ] Set up backup plans for DynamoDB tables
- [ ] Enable point-in-time recovery for critical tables
- [ ] Test backup and restore procedures
- [ ] Document recovery procedures

### Application Configuration
- [ ] Update environment variables
- [ ] Configure external service integrations (Stripe, DocuSign, Claude)
- [ ] Set up domain and SSL certificates
- [ ] Configure CDN and caching policies
- [ ] Review and update CORS policies

## Deployment Steps

### 1. Environment Setup

```bash
# Set environment variables
export ENVIRONMENT=prod
export AWS_REGION=eu-west-2
export ALERT_EMAIL=alerts@yourcompany.com

# Verify AWS credentials
aws sts get-caller-identity
```

### 2. Deploy Infrastructure

```bash
# Run the deployment script
./scripts/deploy.sh prod

# Or deploy manually
cd infrastructure
npx cdk deploy --context environment=prod --require-approval never
```

### 3. Configure Secrets

Update the following secrets in AWS Secrets Manager:

#### Stripe Configuration
```json
{
  "secretKey": "sk_live_...",
  "publishableKey": "pk_live_...",
  "webhookSecret": "whsec_..."
}
```

#### DocuSign Configuration
```json
{
  "integrationKey": "your-integration-key",
  "userId": "your-user-id",
  "accountId": "your-account-id",
  "privateKey": "-----BEGIN RSA PRIVATE KEY-----\n...",
  "baseUrl": "https://na3.docusign.net/restapi"
}
```

#### Claude AI Configuration
```json
{
  "apiKey": "your-claude-api-key",
  "model": "claude-3-sonnet-20240229",
  "maxTokens": 4096
}
```

### 4. Set Up Monitoring

```bash
# Configure monitoring and alerting
./scripts/setup-monitoring.sh prod $ALERT_EMAIL
```

### 5. Verify Deployment

```bash
# Check deployment status
./scripts/disaster-recovery.sh status prod

# Run smoke tests
npm run test:e2e -- --testNamePattern="smoke"
```

## Post-Deployment Configuration

### Domain and SSL Setup

1. **Purchase/Configure Domain**
   - Register domain or configure DNS
   - Create Route 53 hosted zone
   - Configure domain validation

2. **SSL Certificate**
   - Request ACM certificate
   - Validate domain ownership
   - Associate with CloudFront distribution

3. **CloudFront Configuration**
   - Configure custom domain
   - Set up caching policies
   - Configure WAF association

### External Service Configuration

#### Stripe Setup
1. Configure webhook endpoints
2. Set up payment methods
3. Configure subscription products
4. Test payment flows

#### DocuSign Setup
1. Configure integration
2. Set up templates
3. Configure webhook notifications
4. Test contract signing flow

#### Claude AI Setup
1. Configure API access
2. Set up usage monitoring
3. Configure rate limiting
4. Test AI agent responses

### Monitoring Configuration

#### CloudWatch Dashboards
- Application performance metrics
- Business KPI tracking
- Infrastructure health monitoring
- Cost optimization metrics

#### Alerting Rules
- **Critical Alerts**: System failures, security incidents
- **Warning Alerts**: Performance degradation, capacity issues
- **Info Alerts**: Deployment notifications, scheduled maintenance

#### Log Management
- Centralized logging configuration
- Log retention policies
- Log analysis and alerting
- Performance monitoring

## Security Hardening

### Network Security
- Configure VPC with private subnets
- Set up NAT gateways for outbound traffic
- Configure security groups with least privilege
- Enable VPC Flow Logs

### Application Security
- Enable WAF with appropriate rules
- Configure rate limiting
- Set up DDoS protection
- Enable security headers

### Data Security
- Enable encryption at rest for all data stores
- Configure encryption in transit
- Set up key rotation policies
- Implement data classification

### Access Control
- Configure IAM roles with least privilege
- Enable MFA for administrative access
- Set up cross-account access controls
- Regular access reviews

## Disaster Recovery

### Backup Strategy
- **Daily Backups**: All critical DynamoDB tables
- **Weekly Backups**: Long-term retention
- **Point-in-Time Recovery**: Enabled for all tables
- **Cross-Region Replication**: For critical data

### Recovery Procedures
1. **RTO (Recovery Time Objective)**: 30 minutes
2. **RPO (Recovery Point Objective)**: 5 minutes
3. **Backup Validation**: Weekly automated tests
4. **DR Testing**: Monthly full recovery tests

### Incident Response
1. **Detection**: Automated monitoring and alerting
2. **Assessment**: Incident severity classification
3. **Response**: Escalation procedures and communication
4. **Recovery**: Step-by-step recovery procedures
5. **Post-Incident**: Root cause analysis and improvements

## Performance Optimization

### Application Performance
- Enable CloudFront caching
- Optimize DynamoDB queries
- Configure Lambda memory and timeout
- Implement connection pooling

### Cost Optimization
- Use DynamoDB on-demand billing
- Configure S3 lifecycle policies
- Optimize Lambda function sizing
- Monitor and optimize data transfer costs

### Scalability
- Configure auto-scaling for DynamoDB
- Use Lambda concurrency controls
- Implement circuit breaker patterns
- Monitor and plan for growth

## Maintenance Procedures

### Regular Maintenance
- **Weekly**: Review monitoring dashboards and alerts
- **Monthly**: Security patches and updates
- **Quarterly**: Disaster recovery testing
- **Annually**: Security audit and compliance review

### Update Procedures
1. Test changes in staging environment
2. Create deployment plan with rollback procedures
3. Schedule maintenance window
4. Deploy with monitoring
5. Verify functionality
6. Update documentation

### Backup Procedures
- Automated daily backups via AWS Backup
- Manual backups before major changes
- Regular backup validation and testing
- Cross-region backup replication

## Troubleshooting

### Common Issues

#### High Error Rates
1. Check CloudWatch logs for error patterns
2. Verify external service availability
3. Check DynamoDB throttling
4. Review recent deployments

#### Performance Issues
1. Monitor Lambda function metrics
2. Check DynamoDB performance
3. Review API Gateway latency
4. Analyze CloudFront cache hit rates

#### Security Incidents
1. Review CloudTrail logs
2. Check WAF blocked requests
3. Monitor authentication failures
4. Verify access patterns

### Emergency Procedures

#### System Outage
1. Activate incident response team
2. Assess impact and severity
3. Implement immediate fixes or rollback
4. Communicate with stakeholders
5. Document incident and lessons learned

#### Data Breach
1. Isolate affected systems
2. Assess data exposure
3. Notify security team and legal
4. Implement containment measures
5. Follow regulatory notification requirements

## Compliance and Governance

### Data Protection
- GDPR compliance for EU users
- Data retention policies
- Right to be forgotten implementation
- Data processing agreements

### Security Standards
- Regular security assessments
- Penetration testing
- Vulnerability management
- Security training for team

### Audit and Compliance
- Regular compliance audits
- Documentation maintenance
- Change management processes
- Risk assessment procedures

## Support and Escalation

### Support Tiers
- **Tier 1**: Basic application support
- **Tier 2**: Technical infrastructure support
- **Tier 3**: Senior engineering escalation
- **Tier 4**: Vendor and external support

### Contact Information
- **DevOps Team**: [Add contact details]
- **Security Team**: [Add contact details]
- **Business Owner**: [Add contact details]
- **Emergency Hotline**: [Add contact details]

### Escalation Matrix
| Severity | Response Time | Escalation Time | Contact |
|----------|---------------|-----------------|---------|
| Critical | 15 minutes | 30 minutes | On-call engineer |
| High | 1 hour | 2 hours | Team lead |
| Medium | 4 hours | 8 hours | Product owner |
| Low | 24 hours | 48 hours | Backlog |

## Documentation and Resources

### Technical Documentation
- [API Documentation](./docs/api.md)
- [Architecture Overview](./docs/architecture.md)
- [Security Guidelines](./docs/security.md)
- [Monitoring Runbook](./monitoring-runbook-prod.md)

### External Resources
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Security Best Practices](https://aws.amazon.com/security/security-resources/)
- [CDK Best Practices](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html)

---

**Note**: This deployment guide should be reviewed and updated regularly to reflect changes in the application, infrastructure, and security requirements.