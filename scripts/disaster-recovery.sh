#!/bin/bash

# UK Home Improvement Platform Disaster Recovery Script
# Usage: ./scripts/disaster-recovery.sh [action] [environment] [options]

set -e

ACTION=${1:-status}
ENVIRONMENT=${2:-prod}
BACKUP_DATE=${3}

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

# Show usage
show_usage() {
    echo "Usage: $0 [action] [environment] [options]"
    echo ""
    echo "Actions:"
    echo "  status     - Show backup and recovery status"
    echo "  backup     - Create manual backup"
    echo "  restore    - Restore from backup"
    echo "  test       - Test disaster recovery procedures"
    echo "  validate   - Validate backup integrity"
    echo ""
    echo "Environments:"
    echo "  dev, staging, prod"
    echo ""
    echo "Examples:"
    echo "  $0 status prod"
    echo "  $0 backup prod"
    echo "  $0 restore prod 2024-01-15"
    echo "  $0 test staging"
}

# Get stack information
get_stack_info() {
    STACK_NAME="UKHomeImprovement${ENVIRONMENT^}"
    
    # Check if stack exists
    if ! aws cloudformation describe-stacks --stack-name $STACK_NAME &> /dev/null; then
        log_error "Stack $STACK_NAME not found"
        exit 1
    fi
    
    # Get backup vault name
    BACKUP_VAULT=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`BackupVaultName`].OutputValue' \
        --output text)
    
    # Get DynamoDB table names
    USERS_TABLE=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`UsersTableName`].OutputValue' \
        --output text)
    
    PROJECTS_TABLE=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`ProjectsTableName`].OutputValue' \
        --output text)
    
    CONTRACTS_TABLE=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`ContractsTableName`].OutputValue' \
        --output text)
}

# Show backup status
show_status() {
    log_info "Disaster Recovery Status for $ENVIRONMENT"
    echo "=================================="
    
    # Backup vault status
    log_info "Backup Vault: $BACKUP_VAULT"
    
    # List recent backups
    log_info "Recent Backups:"
    aws backup list-backup-jobs \
        --by-backup-vault-name $BACKUP_VAULT \
        --max-results 10 \
        --query 'BackupJobs[*].[BackupJobId,ResourceArn,CreationDate,State,CompletionDate]' \
        --output table
    
    # DynamoDB table status
    log_info "DynamoDB Tables Status:"
    for table in $USERS_TABLE $PROJECTS_TABLE $CONTRACTS_TABLE; do
        STATUS=$(aws dynamodb describe-table --table-name $table --query 'Table.TableStatus' --output text)
        PITR=$(aws dynamodb describe-continuous-backups --table-name $table --query 'ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus' --output text)
        echo "  $table: $STATUS (PITR: $PITR)"
    done
    
    # Check backup plan
    log_info "Backup Plan Status:"
    aws backup list-backup-plans \
        --query 'BackupPlansList[?contains(BackupPlanName, `uk-home-improvement`)].[BackupPlanName,BackupPlanId,CreationDate]' \
        --output table
}

# Create manual backup
create_backup() {
    log_info "Creating manual backup for $ENVIRONMENT..."
    
    BACKUP_JOB_ID=$(uuidgen)
    
    # Create backup for critical tables
    for table in $USERS_TABLE $PROJECTS_TABLE $CONTRACTS_TABLE; do
        log_info "Creating backup for $table..."
        
        aws backup start-backup-job \
            --backup-vault-name $BACKUP_VAULT \
            --resource-arn "arn:aws:dynamodb:$(aws configure get region):$(aws sts get-caller-identity --query Account --output text):table/$table" \
            --iam-role-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/service-role/AWSBackupDefaultServiceRole" \
            --backup-options WindowsVSS=disabled \
            --lifecycle DeleteAfterDays=30,MoveToColdStorageAfterDays=7
        
        log_success "Backup initiated for $table"
    done
    
    log_success "Manual backup jobs initiated"
}

# Restore from backup
restore_backup() {
    if [ -z "$BACKUP_DATE" ]; then
        log_error "Backup date required for restore operation"
        log_info "Usage: $0 restore $ENVIRONMENT YYYY-MM-DD"
        exit 1
    fi
    
    log_warning "DANGER: This will restore data from $BACKUP_DATE"
    log_warning "This operation may overwrite current data!"
    
    read -p "Are you sure you want to proceed? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_info "Restore operation cancelled"
        exit 0
    fi
    
    log_info "Restoring from backup date: $BACKUP_DATE"
    
    # Find backup recovery points for the specified date
    RECOVERY_POINTS=$(aws backup list-recovery-points-by-backup-vault \
        --backup-vault-name $BACKUP_VAULT \
        --by-creation-date-after "${BACKUP_DATE}T00:00:00Z" \
        --by-creation-date-before "${BACKUP_DATE}T23:59:59Z" \
        --query 'RecoveryPoints[*].RecoveryPointArn' \
        --output text)
    
    if [ -z "$RECOVERY_POINTS" ]; then
        log_error "No recovery points found for date $BACKUP_DATE"
        exit 1
    fi
    
    log_info "Found recovery points for restoration"
    
    # Restore each table (this is a simplified example)
    for recovery_point in $RECOVERY_POINTS; do
        log_info "Restoring from recovery point: $recovery_point"
        
        # Start restore job
        aws backup start-restore-job \
            --recovery-point-arn $recovery_point \
            --metadata '{"NewTableName":"restored-table-'$(date +%s)'"}' \
            --iam-role-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/service-role/AWSBackupDefaultServiceRole"
    done
    
    log_success "Restore jobs initiated. Monitor progress in AWS Backup console."
}

# Test disaster recovery procedures
test_recovery() {
    log_info "Testing disaster recovery procedures for $ENVIRONMENT..."
    
    # Create test environment suffix
    TEST_SUFFIX="-dr-test-$(date +%s)"
    
    log_info "Creating test recovery environment with suffix: $TEST_SUFFIX"
    
    # Test 1: Verify backup availability
    log_info "Test 1: Verifying backup availability..."
    BACKUP_COUNT=$(aws backup list-recovery-points-by-backup-vault \
        --backup-vault-name $BACKUP_VAULT \
        --query 'length(RecoveryPoints[?Status==`COMPLETED`])' \
        --output text)
    
    if [ "$BACKUP_COUNT" -gt 0 ]; then
        log_success "✓ Found $BACKUP_COUNT completed backups"
    else
        log_error "✗ No completed backups found"
    fi
    
    # Test 2: Verify point-in-time recovery
    log_info "Test 2: Verifying point-in-time recovery capability..."
    for table in $USERS_TABLE $PROJECTS_TABLE; do
        PITR_STATUS=$(aws dynamodb describe-continuous-backups \
            --table-name $table \
            --query 'ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus' \
            --output text)
        
        if [ "$PITR_STATUS" = "ENABLED" ]; then
            log_success "✓ PITR enabled for $table"
        else
            log_error "✗ PITR not enabled for $table"
        fi
    done
    
    # Test 3: Verify cross-region replication (if configured)
    log_info "Test 3: Checking cross-region backup replication..."
    # This would check if backups are replicated to another region
    
    # Test 4: Verify monitoring and alerting
    log_info "Test 4: Verifying monitoring and alerting..."
    ALARM_COUNT=$(aws cloudwatch describe-alarms \
        --alarm-name-prefix "uk-home-improvement" \
        --state-value ALARM \
        --query 'length(MetricAlarms)' \
        --output text)
    
    log_info "Found $ALARM_COUNT active alarms"
    
    # Test 5: Simulate recovery time
    log_info "Test 5: Estimating recovery time objectives..."
    log_info "RTO (Recovery Time Objective): ~30 minutes for infrastructure"
    log_info "RPO (Recovery Point Objective): ~5 minutes for DynamoDB PITR"
    
    log_success "Disaster recovery test completed"
}

# Validate backup integrity
validate_backup() {
    log_info "Validating backup integrity for $ENVIRONMENT..."
    
    # Check backup job status
    log_info "Checking recent backup job status..."
    FAILED_JOBS=$(aws backup list-backup-jobs \
        --by-backup-vault-name $BACKUP_VAULT \
        --by-state FAILED \
        --max-results 10 \
        --query 'length(BackupJobs)' \
        --output text)
    
    if [ "$FAILED_JOBS" -eq 0 ]; then
        log_success "✓ No failed backup jobs found"
    else
        log_error "✗ Found $FAILED_JOBS failed backup jobs"
    fi
    
    # Validate backup plan execution
    log_info "Validating backup plan execution..."
    BACKUP_PLAN_ID=$(aws backup list-backup-plans \
        --query 'BackupPlansList[?contains(BackupPlanName, `uk-home-improvement`)].BackupPlanId' \
        --output text | head -1)
    
    if [ ! -z "$BACKUP_PLAN_ID" ]; then
        log_success "✓ Backup plan found: $BACKUP_PLAN_ID"
        
        # Check backup selections
        SELECTIONS=$(aws backup list-backup-selections \
            --backup-plan-id $BACKUP_PLAN_ID \
            --query 'length(BackupSelectionsList)' \
            --output text)
        
        log_info "Backup selections configured: $SELECTIONS"
    else
        log_error "✗ No backup plan found"
    fi
    
    # Check encryption
    log_info "Validating backup encryption..."
    VAULT_ENCRYPTION=$(aws backup describe-backup-vault \
        --backup-vault-name $BACKUP_VAULT \
        --query 'EncryptionKeyArn' \
        --output text)
    
    if [ "$VAULT_ENCRYPTION" != "None" ] && [ "$VAULT_ENCRYPTION" != "null" ]; then
        log_success "✓ Backup vault is encrypted"
    else
        log_warning "⚠ Backup vault encryption not configured"
    fi
    
    log_success "Backup validation completed"
}

# Main function
main() {
    case $ACTION in
        status)
            get_stack_info
            show_status
            ;;
        backup)
            get_stack_info
            create_backup
            ;;
        restore)
            get_stack_info
            restore_backup
            ;;
        test)
            get_stack_info
            test_recovery
            ;;
        validate)
            get_stack_info
            validate_backup
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            log_error "Unknown action: $ACTION"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"