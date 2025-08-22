#!/bin/bash

# UK Home Improvement Platform Health Check Script
# Usage: ./scripts/health-check.sh [environment] [--detailed]

set -e

ENVIRONMENT=${1:-prod}
DETAILED=${2:-false}

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

# Health check results
HEALTH_SCORE=0
TOTAL_CHECKS=0
FAILED_CHECKS=()

# Increment counters
check_result() {
    local result=$1
    local check_name=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ "$result" -eq 0 ]; then
        HEALTH_SCORE=$((HEALTH_SCORE + 1))
        log_success "✓ $check_name"
    else
        FAILED_CHECKS+=("$check_name")
        log_error "✗ $check_name"
    fi
}

# Get stack information
get_stack_info() {
    STACK_NAME="UKHomeImprovement${ENVIRONMENT^}"
    
    if ! aws cloudformation describe-stacks --stack-name $STACK_NAME &> /dev/null; then
        log_error "Stack $STACK_NAME not found"
        exit 1
    fi
    
    # Get outputs
    USER_POOL_ID=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
        --output text)
    
    USERS_TABLE=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`UsersTableName`].OutputValue' \
        --output text)
    
    PROJECTS_TABLE=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`ProjectsTableName`].OutputValue' \
        --output text)
}

# Check CloudFormation stack health
check_stack_health() {
    log_info "Checking CloudFormation stack health..."
    
    STACK_STATUS=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].StackStatus' \
        --output text)
    
    if [[ "$STACK_STATUS" == "CREATE_COMPLETE" || "$STACK_STATUS" == "UPDATE_COMPLETE" ]]; then
        check_result 0 "CloudFormation Stack Status ($STACK_STATUS)"
    else
        check_result 1 "CloudFormation Stack Status ($STACK_STATUS)"
    fi
}

# Check DynamoDB tables health
check_dynamodb_health() {
    log_info "Checking DynamoDB tables health..."
    
    local tables=($USERS_TABLE $PROJECTS_TABLE)
    
    for table in "${tables[@]}"; do
        if [ -z "$table" ]; then
            continue
        fi
        
        # Check table status
        TABLE_STATUS=$(aws dynamodb describe-table \
            --table-name $table \
            --query 'Table.TableStatus' \
            --output text 2>/dev/null)
        
        if [ "$TABLE_STATUS" = "ACTIVE" ]; then
            check_result 0 "DynamoDB Table $table Status"
        else
            check_result 1 "DynamoDB Table $table Status ($TABLE_STATUS)"
        fi
        
        # Check point-in-time recovery
        PITR_STATUS=$(aws dynamodb describe-continuous-backups \
            --table-name $table \
            --query 'ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus' \
            --output text 2>/dev/null)
        
        if [ "$PITR_STATUS" = "ENABLED" ]; then
            check_result 0 "DynamoDB Table $table PITR"
        else
            check_result 1 "DynamoDB Table $table PITR ($PITR_STATUS)"
        fi
        
        if [ "$DETAILED" = "--detailed" ]; then
            # Check table metrics
            CONSUMED_READ=$(aws cloudwatch get-metric-statistics \
                --namespace AWS/DynamoDB \
                --metric-name ConsumedReadCapacityUnits \
                --dimensions Name=TableName,Value=$table \
                --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
                --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
                --period 300 \
                --statistics Average \
                --query 'Datapoints[0].Average' \
                --output text 2>/dev/null)
            
            if [ "$CONSUMED_READ" != "None" ] && [ ! -z "$CONSUMED_READ" ]; then
                log_info "  Read capacity: $CONSUMED_READ units"
            fi
        fi
    done
}

# Check Cognito health
check_cognito_health() {
    log_info "Checking Cognito health..."
    
    if [ -z "$USER_POOL_ID" ]; then
        check_result 1 "Cognito User Pool ID not found"
        return
    fi
    
    # Check user pool status
    USER_POOL_STATUS=$(aws cognito-idp describe-user-pool \
        --user-pool-id $USER_POOL_ID \
        --query 'UserPool.Status' \
        --output text 2>/dev/null)
    
    if [ "$USER_POOL_STATUS" = "Enabled" ]; then
        check_result 0 "Cognito User Pool Status"
    else
        check_result 1 "Cognito User Pool Status ($USER_POOL_STATUS)"
    fi
    
    if [ "$DETAILED" = "--detailed" ]; then
        # Get user pool metrics
        USER_COUNT=$(aws cognito-idp list-users \
            --user-pool-id $USER_POOL_ID \
            --query 'length(Users)' \
            --output text 2>/dev/null)
        
        log_info "  Total users: $USER_COUNT"
    fi
}

# Check CloudWatch alarms
check_cloudwatch_alarms() {
    log_info "Checking CloudWatch alarms..."
    
    # Check for any alarms in ALARM state
    ALARM_COUNT=$(aws cloudwatch describe-alarms \
        --alarm-name-prefix "uk-home-improvement" \
        --state-value ALARM \
        --query 'length(MetricAlarms)' \
        --output text)
    
    if [ "$ALARM_COUNT" -eq 0 ]; then
        check_result 0 "CloudWatch Alarms (No active alarms)"
    else
        check_result 1 "CloudWatch Alarms ($ALARM_COUNT active alarms)"
        
        if [ "$DETAILED" = "--detailed" ]; then
            log_warning "Active alarms:"
            aws cloudwatch describe-alarms \
                --alarm-name-prefix "uk-home-improvement" \
                --state-value ALARM \
                --query 'MetricAlarms[*].[AlarmName,StateReason]' \
                --output table
        fi
    fi
}

# Check backup health
check_backup_health() {
    log_info "Checking backup health..."
    
    # Get backup vault name
    BACKUP_VAULT=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`BackupVaultName`].OutputValue' \
        --output text 2>/dev/null)
    
    if [ -z "$BACKUP_VAULT" ]; then
        check_result 1 "Backup Vault not found"
        return
    fi
    
    # Check recent backup jobs
    FAILED_BACKUPS=$(aws backup list-backup-jobs \
        --by-backup-vault-name $BACKUP_VAULT \
        --by-state FAILED \
        --created-after $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
        --query 'length(BackupJobs)' \
        --output text 2>/dev/null)
    
    if [ "$FAILED_BACKUPS" -eq 0 ]; then
        check_result 0 "Backup Jobs (No failed backups in 24h)"
    else
        check_result 1 "Backup Jobs ($FAILED_BACKUPS failed in 24h)"
    fi
    
    # Check completed backups
    COMPLETED_BACKUPS=$(aws backup list-backup-jobs \
        --by-backup-vault-name $BACKUP_VAULT \
        --by-state COMPLETED \
        --created-after $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
        --query 'length(BackupJobs)' \
        --output text 2>/dev/null)
    
    if [ "$COMPLETED_BACKUPS" -gt 0 ]; then
        check_result 0 "Recent Backups ($COMPLETED_BACKUPS completed in 24h)"
    else
        check_result 1 "Recent Backups (No completed backups in 24h)"
    fi
}

# Check secrets health
check_secrets_health() {
    log_info "Checking secrets health..."
    
    local secrets=("uk-home-improvement/stripe" "uk-home-improvement/docusign" "uk-home-improvement/claude")
    
    for secret in "${secrets[@]}"; do
        SECRET_STATUS=$(aws secretsmanager describe-secret \
            --secret-id $secret \
            --query 'Name' \
            --output text 2>/dev/null)
        
        if [ ! -z "$SECRET_STATUS" ]; then
            check_result 0 "Secret $secret exists"
        else
            check_result 1 "Secret $secret not found"
        fi
    done
}

# Check API Gateway health (if configured)
check_api_health() {
    log_info "Checking API Gateway health..."
    
    # This is a placeholder - would need actual API Gateway ID
    # For now, we'll check if there are any APIs
    API_COUNT=$(aws apigateway get-rest-apis \
        --query 'length(items[?name==`uk-home-improvement-api`])' \
        --output text 2>/dev/null)
    
    if [ "$API_COUNT" -gt 0 ]; then
        check_result 0 "API Gateway Configuration"
    else
        check_result 1 "API Gateway not found"
    fi
}

# Check Lambda functions health
check_lambda_health() {
    log_info "Checking Lambda functions health..."
    
    # Get Lambda functions with our prefix
    LAMBDA_FUNCTIONS=$(aws lambda list-functions \
        --query 'Functions[?contains(FunctionName, `uk-home-improvement`)].FunctionName' \
        --output text 2>/dev/null)
    
    if [ ! -z "$LAMBDA_FUNCTIONS" ]; then
        for func in $LAMBDA_FUNCTIONS; do
            FUNC_STATE=$(aws lambda get-function \
                --function-name $func \
                --query 'Configuration.State' \
                --output text 2>/dev/null)
            
            if [ "$FUNC_STATE" = "Active" ]; then
                check_result 0 "Lambda Function $func"
            else
                check_result 1 "Lambda Function $func ($FUNC_STATE)"
            fi
        done
    else
        log_warning "No Lambda functions found with uk-home-improvement prefix"
    fi
}

# Check Step Functions health
check_stepfunctions_health() {
    log_info "Checking Step Functions health..."
    
    # Get Step Functions state machines
    STATE_MACHINES=$(aws stepfunctions list-state-machines \
        --query 'stateMachines[?contains(name, `uk-home-improvement`)].stateMachineArn' \
        --output text 2>/dev/null)
    
    if [ ! -z "$STATE_MACHINES" ]; then
        for sm in $STATE_MACHINES; do
            SM_STATUS=$(aws stepfunctions describe-state-machine \
                --state-machine-arn $sm \
                --query 'status' \
                --output text 2>/dev/null)
            
            if [ "$SM_STATUS" = "ACTIVE" ]; then
                check_result 0 "Step Functions State Machine"
            else
                check_result 1 "Step Functions State Machine ($SM_STATUS)"
            fi
        done
    else
        log_warning "No Step Functions state machines found"
    fi
}

# Generate health report
generate_report() {
    echo ""
    echo "========================================"
    echo "HEALTH CHECK REPORT - $ENVIRONMENT"
    echo "========================================"
    echo "Timestamp: $(date)"
    echo "Total Checks: $TOTAL_CHECKS"
    echo "Passed: $HEALTH_SCORE"
    echo "Failed: $((TOTAL_CHECKS - HEALTH_SCORE))"
    
    # Calculate health percentage
    if [ $TOTAL_CHECKS -gt 0 ]; then
        HEALTH_PERCENTAGE=$((HEALTH_SCORE * 100 / TOTAL_CHECKS))
        echo "Health Score: $HEALTH_PERCENTAGE%"
        
        if [ $HEALTH_PERCENTAGE -ge 95 ]; then
            log_success "System health is EXCELLENT"
        elif [ $HEALTH_PERCENTAGE -ge 85 ]; then
            log_warning "System health is GOOD"
        elif [ $HEALTH_PERCENTAGE -ge 70 ]; then
            log_warning "System health is FAIR - attention needed"
        else
            log_error "System health is POOR - immediate attention required"
        fi
    fi
    
    # List failed checks
    if [ ${#FAILED_CHECKS[@]} -gt 0 ]; then
        echo ""
        log_error "Failed Checks:"
        for check in "${FAILED_CHECKS[@]}"; do
            echo "  - $check"
        done
    fi
    
    echo ""
    echo "========================================"
}

# Main function
main() {
    log_info "Starting health check for $ENVIRONMENT environment..."
    
    get_stack_info
    
    check_stack_health
    check_dynamodb_health
    check_cognito_health
    check_cloudwatch_alarms
    check_backup_health
    check_secrets_health
    check_api_health
    check_lambda_health
    check_stepfunctions_health
    
    generate_report
    
    # Exit with appropriate code
    if [ $HEALTH_SCORE -eq $TOTAL_CHECKS ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"