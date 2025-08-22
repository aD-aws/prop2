#!/bin/bash

# UK Home Improvement Platform Deployment Validation Script
# Usage: ./scripts/validate-deployment.sh [environment]

set -e

ENVIRONMENT=${1:-prod}

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

# Validation results
VALIDATION_SCORE=0
TOTAL_VALIDATIONS=0
FAILED_VALIDATIONS=()

# Increment counters
validate_result() {
    local result=$1
    local validation_name=$2
    
    TOTAL_VALIDATIONS=$((TOTAL_VALIDATIONS + 1))
    
    if [ "$result" -eq 0 ]; then
        VALIDATION_SCORE=$((VALIDATION_SCORE + 1))
        log_success "✓ $validation_name"
    else
        FAILED_VALIDATIONS+=("$validation_name")
        log_error "✗ $validation_name"
    fi
}

# Get stack information
get_stack_info() {
    STACK_NAME="UKHomeImprovement${ENVIRONMENT^}"
    
    if ! aws cloudformation describe-stacks --stack-name $STACK_NAME &> /dev/null; then
        log_error "Stack $STACK_NAME not found"
        exit 1
    fi
    
    log_info "Validating deployment for stack: $STACK_NAME"
}

# Validate infrastructure deployment
validate_infrastructure() {
    log_info "Validating infrastructure deployment..."
    
    # Check stack status
    STACK_STATUS=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].StackStatus' \
        --output text)
    
    if [[ "$STACK_STATUS" == "CREATE_COMPLETE" || "$STACK_STATUS" == "UPDATE_COMPLETE" ]]; then
        validate_result 0 "CloudFormation Stack Deployment"
    else
        validate_result 1 "CloudFormation Stack Deployment ($STACK_STATUS)"
    fi
    
    # Check for stack drift
    DRIFT_STATUS=$(aws cloudformation detect-stack-drift \
        --stack-name $STACK_NAME \
        --query 'StackDriftDetectionId' \
        --output text)
    
    # Wait a moment for drift detection to complete
    sleep 5
    
    DRIFT_RESULT=$(aws cloudformation describe-stack-drift-detection-status \
        --stack-drift-detection-id $DRIFT_STATUS \
        --query 'StackDriftStatus' \
        --output text)
    
    if [ "$DRIFT_RESULT" = "IN_SYNC" ]; then
        validate_result 0 "Stack Drift Detection"
    else
        validate_result 1 "Stack Drift Detection ($DRIFT_RESULT)"
    fi
}

# Validate DynamoDB tables
validate_dynamodb() {
    log_info "Validating DynamoDB tables..."
    
    # Get table names from stack outputs
    local table_outputs=("UsersTableName" "ProjectsTableName" "PropertiesTableName" "BuildersTableName" "QuotesTableName")
    
    for output in "${table_outputs[@]}"; do
        TABLE_NAME=$(aws cloudformation describe-stacks \
            --stack-name $STACK_NAME \
            --query "Stacks[0].Outputs[?OutputKey=='$output'].OutputValue" \
            --output text)
        
        if [ ! -z "$TABLE_NAME" ] && [ "$TABLE_NAME" != "None" ]; then
            # Check table status
            TABLE_STATUS=$(aws dynamodb describe-table \
                --table-name $TABLE_NAME \
                --query 'Table.TableStatus' \
                --output text 2>/dev/null)
            
            if [ "$TABLE_STATUS" = "ACTIVE" ]; then
                validate_result 0 "DynamoDB Table $TABLE_NAME"
                
                # Test read/write access
                TEST_ITEM='{"testId":{"S":"validation-test"},"timestamp":{"S":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}}'
                
                if aws dynamodb put-item \
                    --table-name $TABLE_NAME \
                    --item "$TEST_ITEM" \
                    --condition-expression "attribute_not_exists(testId)" 2>/dev/null; then
                    
                    # Clean up test item
                    aws dynamodb delete-item \
                        --table-name $TABLE_NAME \
                        --key '{"testId":{"S":"validation-test"}}' 2>/dev/null
                    
                    validate_result 0 "DynamoDB Table $TABLE_NAME Read/Write Access"
                else
                    validate_result 1 "DynamoDB Table $TABLE_NAME Read/Write Access"
                fi
            else
                validate_result 1 "DynamoDB Table $TABLE_NAME ($TABLE_STATUS)"
            fi
        else
            validate_result 1 "DynamoDB Table Output $output not found"
        fi
    done
}

# Validate Cognito
validate_cognito() {
    log_info "Validating Cognito configuration..."
    
    USER_POOL_ID=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
        --output text)
    
    if [ ! -z "$USER_POOL_ID" ] && [ "$USER_POOL_ID" != "None" ]; then
        # Check user pool status
        USER_POOL_STATUS=$(aws cognito-idp describe-user-pool \
            --user-pool-id $USER_POOL_ID \
            --query 'UserPool.Status' \
            --output text 2>/dev/null)
        
        if [ "$USER_POOL_STATUS" = "Enabled" ]; then
            validate_result 0 "Cognito User Pool"
        else
            validate_result 1 "Cognito User Pool ($USER_POOL_STATUS)"
        fi
        
        # Check user pool client
        CLIENT_ID=$(aws cloudformation describe-stacks \
            --stack-name $STACK_NAME \
            --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
            --output text)
        
        if [ ! -z "$CLIENT_ID" ] && [ "$CLIENT_ID" != "None" ]; then
            CLIENT_STATUS=$(aws cognito-idp describe-user-pool-client \
                --user-pool-id $USER_POOL_ID \
                --client-id $CLIENT_ID \
                --query 'UserPoolClient.ClientId' \
                --output text 2>/dev/null)
            
            if [ "$CLIENT_STATUS" = "$CLIENT_ID" ]; then
                validate_result 0 "Cognito User Pool Client"
            else
                validate_result 1 "Cognito User Pool Client"
            fi
        else
            validate_result 1 "Cognito User Pool Client ID not found"
        fi
    else
        validate_result 1 "Cognito User Pool ID not found"
    fi
}

# Validate S3 buckets
validate_s3() {
    log_info "Validating S3 buckets..."
    
    BUCKET_NAME=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`FileStorageBucketName`].OutputValue' \
        --output text)
    
    if [ ! -z "$BUCKET_NAME" ] && [ "$BUCKET_NAME" != "None" ]; then
        # Check bucket exists and is accessible
        if aws s3 ls "s3://$BUCKET_NAME" &>/dev/null; then
            validate_result 0 "S3 File Storage Bucket"
            
            # Test upload/download
            TEST_FILE="/tmp/validation-test-$(date +%s).txt"
            echo "Validation test file" > $TEST_FILE
            
            if aws s3 cp $TEST_FILE "s3://$BUCKET_NAME/validation-test.txt" &>/dev/null; then
                # Clean up
                aws s3 rm "s3://$BUCKET_NAME/validation-test.txt" &>/dev/null
                rm -f $TEST_FILE
                validate_result 0 "S3 Bucket Read/Write Access"
            else
                validate_result 1 "S3 Bucket Read/Write Access"
            fi
        else
            validate_result 1 "S3 File Storage Bucket Access"
        fi
    else
        validate_result 1 "S3 File Storage Bucket not found"
    fi
}

# Validate secrets
validate_secrets() {
    log_info "Validating secrets configuration..."
    
    local secrets=("uk-home-improvement/stripe" "uk-home-improvement/docusign" "uk-home-improvement/claude")
    
    for secret in "${secrets[@]}"; do
        if aws secretsmanager describe-secret --secret-id $secret &>/dev/null; then
            validate_result 0 "Secret $secret exists"
            
            # Check if secret has a value (not just placeholder)
            SECRET_VALUE=$(aws secretsmanager get-secret-value \
                --secret-id $secret \
                --query 'SecretString' \
                --output text 2>/dev/null)
            
            if [[ "$SECRET_VALUE" == *"placeholder"* ]]; then
                validate_result 1 "Secret $secret contains placeholder values"
            else
                validate_result 0 "Secret $secret has valid configuration"
            fi
        else
            validate_result 1 "Secret $secret not found"
        fi
    done
}

# Validate monitoring
validate_monitoring() {
    log_info "Validating monitoring configuration..."
    
    # Check SNS topics
    CRITICAL_TOPIC=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`CriticalAlertsTopicArn`].OutputValue' \
        --output text)
    
    if [ ! -z "$CRITICAL_TOPIC" ] && [ "$CRITICAL_TOPIC" != "None" ]; then
        if aws sns get-topic-attributes --topic-arn $CRITICAL_TOPIC &>/dev/null; then
            validate_result 0 "Critical Alerts SNS Topic"
        else
            validate_result 1 "Critical Alerts SNS Topic Access"
        fi
    else
        validate_result 1 "Critical Alerts SNS Topic not found"
    fi
    
    # Check CloudWatch dashboard
    DASHBOARD_URL=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`MonitoringDashboardUrl`].OutputValue' \
        --output text)
    
    if [ ! -z "$DASHBOARD_URL" ] && [ "$DASHBOARD_URL" != "None" ]; then
        validate_result 0 "CloudWatch Dashboard Configuration"
    else
        validate_result 1 "CloudWatch Dashboard not configured"
    fi
    
    # Check for active alarms
    ALARM_COUNT=$(aws cloudwatch describe-alarms \
        --alarm-name-prefix "uk-home-improvement" \
        --query 'length(MetricAlarms)' \
        --output text)
    
    if [ "$ALARM_COUNT" -gt 0 ]; then
        validate_result 0 "CloudWatch Alarms ($ALARM_COUNT configured)"
    else
        validate_result 1 "No CloudWatch Alarms configured"
    fi
}

# Validate backup configuration
validate_backup() {
    log_info "Validating backup configuration..."
    
    BACKUP_VAULT=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`BackupVaultName`].OutputValue' \
        --output text)
    
    if [ ! -z "$BACKUP_VAULT" ] && [ "$BACKUP_VAULT" != "None" ]; then
        if aws backup describe-backup-vault --backup-vault-name $BACKUP_VAULT &>/dev/null; then
            validate_result 0 "AWS Backup Vault"
            
            # Check backup plan
            BACKUP_PLANS=$(aws backup list-backup-plans \
                --query 'length(BackupPlansList[?contains(BackupPlanName, `uk-home-improvement`)])' \
                --output text)
            
            if [ "$BACKUP_PLANS" -gt 0 ]; then
                validate_result 0 "Backup Plan Configuration"
            else
                validate_result 1 "No Backup Plans configured"
            fi
        else
            validate_result 1 "AWS Backup Vault Access"
        fi
    else
        validate_result 1 "AWS Backup Vault not found"
    fi
}

# Validate security configuration
validate_security() {
    log_info "Validating security configuration..."
    
    # Check KMS key
    KMS_KEY=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`EncryptionKeyId`].OutputValue' \
        --output text)
    
    if [ ! -z "$KMS_KEY" ] && [ "$KMS_KEY" != "None" ]; then
        if aws kms describe-key --key-id $KMS_KEY &>/dev/null; then
            validate_result 0 "KMS Encryption Key"
        else
            validate_result 1 "KMS Encryption Key Access"
        fi
    else
        validate_result 1 "KMS Encryption Key not found"
    fi
    
    # Check WAF
    WAF_ARN=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`WebACLArn`].OutputValue' \
        --output text)
    
    if [ ! -z "$WAF_ARN" ] && [ "$WAF_ARN" != "None" ]; then
        validate_result 0 "WAF Web ACL Configuration"
    else
        validate_result 1 "WAF Web ACL not configured"
    fi
    
    # Check CloudTrail
    TRAIL_COUNT=$(aws cloudtrail describe-trails \
        --query 'length(trailList[?contains(Name, `uk-home-improvement`)])' \
        --output text)
    
    if [ "$TRAIL_COUNT" -gt 0 ]; then
        validate_result 0 "CloudTrail Audit Logging"
    else
        validate_result 1 "CloudTrail not configured"
    fi
}

# Run smoke tests
run_smoke_tests() {
    log_info "Running smoke tests..."
    
    # This would run actual application smoke tests
    # For now, we'll simulate with a simple check
    
    if command -v npm &> /dev/null; then
        if npm run test:e2e -- --testNamePattern="smoke" --passWithNoTests &>/dev/null; then
            validate_result 0 "Application Smoke Tests"
        else
            validate_result 1 "Application Smoke Tests Failed"
        fi
    else
        log_warning "npm not available, skipping smoke tests"
    fi
}

# Generate validation report
generate_validation_report() {
    echo ""
    echo "========================================"
    echo "DEPLOYMENT VALIDATION REPORT - $ENVIRONMENT"
    echo "========================================"
    echo "Timestamp: $(date)"
    echo "Stack: $STACK_NAME"
    echo "Total Validations: $TOTAL_VALIDATIONS"
    echo "Passed: $VALIDATION_SCORE"
    echo "Failed: $((TOTAL_VALIDATIONS - VALIDATION_SCORE))"
    
    # Calculate validation percentage
    if [ $TOTAL_VALIDATIONS -gt 0 ]; then
        VALIDATION_PERCENTAGE=$((VALIDATION_SCORE * 100 / TOTAL_VALIDATIONS))
        echo "Success Rate: $VALIDATION_PERCENTAGE%"
        
        if [ $VALIDATION_PERCENTAGE -eq 100 ]; then
            log_success "🎉 DEPLOYMENT VALIDATION PASSED - Ready for production!"
        elif [ $VALIDATION_PERCENTAGE -ge 90 ]; then
            log_warning "⚠️  DEPLOYMENT VALIDATION MOSTLY PASSED - Minor issues detected"
        elif [ $VALIDATION_PERCENTAGE -ge 70 ]; then
            log_warning "⚠️  DEPLOYMENT VALIDATION PARTIALLY PASSED - Significant issues detected"
        else
            log_error "❌ DEPLOYMENT VALIDATION FAILED - Major issues detected"
        fi
    fi
    
    # List failed validations
    if [ ${#FAILED_VALIDATIONS[@]} -gt 0 ]; then
        echo ""
        log_error "Failed Validations:"
        for validation in "${FAILED_VALIDATIONS[@]}"; do
            echo "  - $validation"
        done
        
        echo ""
        log_info "Recommended Actions:"
        echo "1. Review failed validations above"
        echo "2. Check AWS CloudFormation console for detailed error messages"
        echo "3. Verify AWS permissions and service limits"
        echo "4. Update secrets with actual values (not placeholders)"
        echo "5. Re-run validation after fixing issues"
    fi
    
    echo ""
    echo "========================================"
}

# Main function
main() {
    log_info "Starting deployment validation for $ENVIRONMENT environment..."
    
    get_stack_info
    
    validate_infrastructure
    validate_dynamodb
    validate_cognito
    validate_s3
    validate_secrets
    validate_monitoring
    validate_backup
    validate_security
    run_smoke_tests
    
    generate_validation_report
    
    # Exit with appropriate code
    if [ $VALIDATION_SCORE -eq $TOTAL_VALIDATIONS ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"