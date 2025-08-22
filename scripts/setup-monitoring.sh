#!/bin/bash

# UK Home Improvement Platform Monitoring Setup Script
# Usage: ./scripts/setup-monitoring.sh [environment] [email]

set -e

ENVIRONMENT=${1:-prod}
ALERT_EMAIL=${2}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get stack outputs
get_stack_outputs() {
    log_info "Getting stack outputs for $ENVIRONMENT..."
    
    STACK_NAME="UKHomeImprovement${ENVIRONMENT^}"
    
    CRITICAL_ALERTS_TOPIC=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`CriticalAlertsTopicArn`].OutputValue' \
        --output text)
    
    WARNING_ALERTS_TOPIC=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`WarningAlertsTopicArn`].OutputValue' \
        --output text)
    
    DASHBOARD_URL=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`MonitoringDashboardUrl`].OutputValue' \
        --output text)
    
    log_success "Stack outputs retrieved"
}

# Setup email notifications
setup_email_notifications() {
    if [ -z "$ALERT_EMAIL" ]; then
        log_warning "No email provided, skipping email notifications setup"
        return
    fi
    
    log_info "Setting up email notifications for $ALERT_EMAIL..."
    
    # Subscribe to critical alerts
    aws sns subscribe \
        --topic-arn $CRITICAL_ALERTS_TOPIC \
        --protocol email \
        --notification-endpoint $ALERT_EMAIL
    
    # Subscribe to warning alerts
    aws sns subscribe \
        --topic-arn $WARNING_ALERTS_TOPIC \
        --protocol email \
        --notification-endpoint $ALERT_EMAIL
    
    log_success "Email subscriptions created. Please check your email and confirm subscriptions."
}

# Create custom CloudWatch alarms
create_custom_alarms() {
    log_info "Creating custom CloudWatch alarms..."
    
    # API Gateway 5XX errors alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "uk-home-improvement-api-5xx-errors-$ENVIRONMENT" \
        --alarm-description "High 5XX error rate in API Gateway" \
        --metric-name 5XXError \
        --namespace AWS/ApiGateway \
        --statistic Sum \
        --period 300 \
        --threshold 10 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions $CRITICAL_ALERTS_TOPIC \
        --dimensions Name=ApiName,Value=uk-home-improvement-api
    
    # Lambda errors alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "uk-home-improvement-lambda-errors-$ENVIRONMENT" \
        --alarm-description "High Lambda error rate" \
        --metric-name Errors \
        --namespace AWS/Lambda \
        --statistic Sum \
        --period 300 \
        --threshold 5 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions $CRITICAL_ALERTS_TOPIC
    
    # Lambda duration alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "uk-home-improvement-lambda-duration-$ENVIRONMENT" \
        --alarm-description "High Lambda duration" \
        --metric-name Duration \
        --namespace AWS/Lambda \
        --statistic Average \
        --period 300 \
        --threshold 30000 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 3 \
        --alarm-actions $WARNING_ALERTS_TOPIC
    
    log_success "Custom alarms created"
}

# Setup log insights queries
setup_log_insights() {
    log_info "Setting up CloudWatch Logs Insights queries..."
    
    # Create saved queries for common investigations
    cat > /tmp/error-analysis-query.json << EOF
{
    "queryString": "fields @timestamp, @message, @logStream\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 100",
    "logGroupNames": [
        "/uk-home-improvement/application",
        "/aws/lambda/uk-home-improvement"
    ],
    "queryName": "Error Analysis - $ENVIRONMENT"
}
EOF
    
    cat > /tmp/performance-analysis-query.json << EOF
{
    "queryString": "fields @timestamp, @duration, @requestId, @message\n| filter @type = \"REPORT\"\n| stats avg(@duration), max(@duration), min(@duration) by bin(5m)",
    "logGroupNames": [
        "/aws/lambda/uk-home-improvement"
    ],
    "queryName": "Performance Analysis - $ENVIRONMENT"
}
EOF
    
    log_success "Log Insights queries prepared"
}

# Create monitoring runbook
create_runbook() {
    log_info "Creating monitoring runbook..."
    
    cat > monitoring-runbook-$ENVIRONMENT.md << EOF
# UK Home Improvement Platform - Monitoring Runbook ($ENVIRONMENT)

## Dashboard
- **CloudWatch Dashboard**: $DASHBOARD_URL

## Alert Channels
- **Critical Alerts**: $CRITICAL_ALERTS_TOPIC
- **Warning Alerts**: $WARNING_ALERTS_TOPIC

## Key Metrics to Monitor

### Application Performance
- API Gateway response times
- Lambda function duration and errors
- DynamoDB read/write capacity and throttling

### Business Metrics
- User registrations
- Project creations
- Quote submissions
- Payment processing

### Infrastructure Health
- DynamoDB table health
- S3 bucket access patterns
- Cognito authentication success rates

## Troubleshooting Procedures

### High Error Rate
1. Check CloudWatch Dashboard for error patterns
2. Review application logs in CloudWatch Logs
3. Check DynamoDB throttling metrics
4. Verify external service availability (Stripe, DocuSign, Claude)

### Performance Issues
1. Check Lambda function duration metrics
2. Review DynamoDB performance metrics
3. Check API Gateway latency
4. Monitor memory and CPU utilization

### Security Incidents
1. Review CloudTrail logs for suspicious activity
2. Check WAF logs for blocked requests
3. Monitor failed authentication attempts
4. Review access patterns to sensitive resources

## Emergency Contacts
- DevOps Team: [Add contact information]
- Security Team: [Add contact information]
- Business Owner: [Add contact information]

## Escalation Procedures
1. **Level 1**: Automated alerts to on-call engineer
2. **Level 2**: Escalate to senior engineer after 15 minutes
3. **Level 3**: Escalate to team lead after 30 minutes
4. **Level 4**: Escalate to management after 1 hour

## Recovery Procedures

### Database Recovery
- Point-in-time recovery available for DynamoDB tables
- Backup vault: $(aws cloudformation describe-stacks --stack-name UKHomeImprovement${ENVIRONMENT^} --query 'Stacks[0].Outputs[?OutputKey==`BackupVaultName`].OutputValue' --output text)

### Application Recovery
- Blue/green deployment capability
- Rollback procedures via CDK
- Circuit breaker patterns implemented

EOF
    
    log_success "Monitoring runbook created: monitoring-runbook-$ENVIRONMENT.md"
}

# Setup synthetic monitoring
setup_synthetic_monitoring() {
    log_info "Setting up synthetic monitoring..."
    
    # Create CloudWatch Synthetics canary for health checks
    cat > /tmp/canary-script.js << 'EOF'
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const healthCheck = async function () {
    const page = await synthetics.getPage();
    
    // Navigate to the application
    const response = await page.goto(synthetics.getConfiguration().url, {
        waitUntil: 'networkidle0',
        timeout: 30000
    });
    
    if (response.status() !== 200) {
        throw new Error(`Page returned status ${response.status()}`);
    }
    
    // Check for critical elements
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Take screenshot
    await synthetics.takeScreenshot('homepage', 'loaded');
    
    log.info('Health check completed successfully');
};

exports.handler = async () => {
    return await synthetics.executeStep('healthCheck', healthCheck);
};
EOF
    
    log_success "Synthetic monitoring script prepared"
}

# Main function
main() {
    log_info "Setting up monitoring for $ENVIRONMENT environment..."
    
    get_stack_outputs
    setup_email_notifications
    create_custom_alarms
    setup_log_insights
    create_runbook
    setup_synthetic_monitoring
    
    log_success "Monitoring setup completed! 📊"
    
    echo ""
    log_info "Next Steps:"
    log_info "1. Confirm email subscriptions if email was provided"
    log_info "2. Review the monitoring runbook: monitoring-runbook-$ENVIRONMENT.md"
    log_info "3. Set up additional integrations (Slack, PagerDuty, etc.)"
    log_info "4. Configure synthetic monitoring canaries"
    log_info "5. Test alert notifications"
}

# Run main function
main "$@"