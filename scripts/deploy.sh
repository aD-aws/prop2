#!/bin/bash

# UK Home Improvement Platform Deployment Script
# Usage: ./scripts/deploy.sh [environment] [options]

set -e

# Default values
ENVIRONMENT=${1:-dev}
SKIP_TESTS=${2:-false}
FORCE_DEPLOY=${3:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        dev|staging|prod)
            log_info "Deploying to $ENVIRONMENT environment"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT. Must be dev, staging, or prod"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if AWS CLI is installed and configured
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check if CDK is installed
    if ! command -v cdk &> /dev/null; then
        log_error "AWS CDK is not installed"
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Install main application dependencies
    npm ci
    
    # Install infrastructure dependencies
    cd infrastructure
    npm ci
    cd ..
    
    log_success "Dependencies installed"
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        log_warning "Skipping tests as requested"
        return
    fi
    
    log_info "Running tests..."
    
    # Run linting
    npm run lint
    
    # Run unit tests
    npm run test:unit
    
    # Run integration tests
    npm run test:integration
    
    # Run AI tests
    npm run test:ai
    
    # Run component tests
    npm run test:components
    
    log_success "All tests passed"
}

# Build application
build_application() {
    log_info "Building application..."
    
    npm run build
    
    log_success "Application built successfully"
}

# Deploy infrastructure
deploy_infrastructure() {
    log_info "Deploying infrastructure to $ENVIRONMENT..."
    
    cd infrastructure
    
    # Bootstrap CDK if needed
    if [ "$ENVIRONMENT" = "prod" ] || [ "$FORCE_DEPLOY" = "true" ]; then
        log_info "Bootstrapping CDK..."
        npx cdk bootstrap --context environment=$ENVIRONMENT
    fi
    
    # Deploy the stack
    npx cdk deploy --context environment=$ENVIRONMENT --require-approval never
    
    cd ..
    
    log_success "Infrastructure deployed successfully"
}

# Configure secrets
configure_secrets() {
    log_info "Configuring secrets for $ENVIRONMENT..."
    
    # Get the secret ARNs from CDK outputs
    STRIPE_SECRET_ARN=$(aws cloudformation describe-stacks \
        --stack-name UKHomeImprovement${ENVIRONMENT^} \
        --query 'Stacks[0].Outputs[?OutputKey==`StripeSecretArn`].OutputValue' \
        --output text)
    
    DOCUSIGN_SECRET_ARN=$(aws cloudformation describe-stacks \
        --stack-name UKHomeImprovement${ENVIRONMENT^} \
        --query 'Stacks[0].Outputs[?OutputKey==`DocuSignSecretArn`].OutputValue' \
        --output text)
    
    CLAUDE_SECRET_ARN=$(aws cloudformation describe-stacks \
        --stack-name UKHomeImprovement${ENVIRONMENT^} \
        --query 'Stacks[0].Outputs[?OutputKey==`ClaudeSecretArn`].OutputValue' \
        --output text)
    
    log_warning "Please update the following secrets manually in AWS Secrets Manager:"
    log_warning "- Stripe Secret: $STRIPE_SECRET_ARN"
    log_warning "- DocuSign Secret: $DOCUSIGN_SECRET_ARN"
    log_warning "- Claude Secret: $CLAUDE_SECRET_ARN"
}

# Setup monitoring
setup_monitoring() {
    log_info "Setting up monitoring and alerting..."
    
    # Get SNS topic ARNs
    CRITICAL_ALERTS_TOPIC=$(aws cloudformation describe-stacks \
        --stack-name UKHomeImprovement${ENVIRONMENT^} \
        --query 'Stacks[0].Outputs[?OutputKey==`CriticalAlertsTopicArn`].OutputValue' \
        --output text)
    
    WARNING_ALERTS_TOPIC=$(aws cloudformation describe-stacks \
        --stack-name UKHomeImprovement${ENVIRONMENT^} \
        --query 'Stacks[0].Outputs[?OutputKey==`WarningAlertsTopicArn`].OutputValue' \
        --output text)
    
    log_info "Critical alerts topic: $CRITICAL_ALERTS_TOPIC"
    log_info "Warning alerts topic: $WARNING_ALERTS_TOPIC"
    
    # Subscribe email to critical alerts (if email provided)
    if [ ! -z "$ALERT_EMAIL" ]; then
        aws sns subscribe \
            --topic-arn $CRITICAL_ALERTS_TOPIC \
            --protocol email \
            --notification-endpoint $ALERT_EMAIL
        
        log_success "Email subscription added to critical alerts"
    fi
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check if stack exists and is in good state
    STACK_STATUS=$(aws cloudformation describe-stacks \
        --stack-name UKHomeImprovement${ENVIRONMENT^} \
        --query 'Stacks[0].StackStatus' \
        --output text)
    
    if [ "$STACK_STATUS" = "CREATE_COMPLETE" ] || [ "$STACK_STATUS" = "UPDATE_COMPLETE" ]; then
        log_success "Stack deployment verified: $STACK_STATUS"
    else
        log_error "Stack deployment failed: $STACK_STATUS"
        exit 1
    fi
    
    # Run smoke tests for production
    if [ "$ENVIRONMENT" = "prod" ]; then
        log_info "Running smoke tests..."
        npm run test:e2e -- --testNamePattern="smoke"
        log_success "Smoke tests passed"
    fi
}

# Main deployment function
main() {
    log_info "Starting deployment process..."
    
    validate_environment
    check_prerequisites
    install_dependencies
    run_tests
    build_application
    deploy_infrastructure
    configure_secrets
    setup_monitoring
    verify_deployment
    
    log_success "Deployment completed successfully! 🚀"
    
    # Display useful information
    echo ""
    log_info "Deployment Summary:"
    log_info "Environment: $ENVIRONMENT"
    log_info "Stack Name: UKHomeImprovement${ENVIRONMENT^}"
    
    # Get dashboard URL
    DASHBOARD_URL=$(aws cloudformation describe-stacks \
        --stack-name UKHomeImprovement${ENVIRONMENT^} \
        --query 'Stacks[0].Outputs[?OutputKey==`MonitoringDashboardUrl`].OutputValue' \
        --output text)
    
    log_info "Monitoring Dashboard: $DASHBOARD_URL"
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"