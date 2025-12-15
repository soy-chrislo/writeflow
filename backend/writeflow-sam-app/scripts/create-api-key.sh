#!/bin/bash
# Creates a new API Key and associates it with the Writeflow Usage Plan
#
# Usage: ./create-api-key.sh [key-name] [environment]
# Example: ./create-api-key.sh "frontend-prod" prod
#          ./create-api-key.sh "test-key"
#
# Requires: AWS CLI configured with appropriate permissions

set -e

KEY_NAME="${1:-writeflow-key-$(date +%s)}"
ENVIRONMENT="${2:-dev}"
STACK_NAME="writeflow-sam-app"

echo "Creating API Key: $KEY_NAME"
echo "Environment: $ENVIRONMENT"
echo ""

# Get the Usage Plan ID from CloudFormation outputs
echo "Fetching Usage Plan ID from stack..."
USAGE_PLAN_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?starts_with(OutputKey, 'WriteflowApiUsagePlan')].OutputValue" \
  --output text 2>/dev/null || echo "")

# If not found in outputs, try to find it by name
if [ -z "$USAGE_PLAN_ID" ]; then
  echo "Usage Plan not found in stack outputs, searching by name..."
  USAGE_PLAN_ID=$(aws apigateway get-usage-plans \
    --query "items[?name=='writeflow-usage-plan-${ENVIRONMENT}'].id" \
    --output text)
fi

if [ -z "$USAGE_PLAN_ID" ]; then
  echo "Error: Could not find Usage Plan. Make sure the stack is deployed."
  exit 1
fi

echo "Found Usage Plan: $USAGE_PLAN_ID"
echo ""

# Create the API Key
echo "Creating API Key..."
API_KEY_RESPONSE=$(aws apigateway create-api-key \
  --name "$KEY_NAME" \
  --description "API Key for Writeflow - created $(date -I)" \
  --enabled \
  --output json)

API_KEY_ID=$(echo "$API_KEY_RESPONSE" | jq -r '.id')
API_KEY_VALUE=$(echo "$API_KEY_RESPONSE" | jq -r '.value')

echo "API Key created: $API_KEY_ID"
echo ""

# Associate the API Key with the Usage Plan
echo "Associating with Usage Plan..."
aws apigateway create-usage-plan-key \
  --usage-plan-id "$USAGE_PLAN_ID" \
  --key-id "$API_KEY_ID" \
  --key-type "API_KEY" \
  --output json > /dev/null

echo ""
echo "=========================================="
echo "API Key created successfully!"
echo "=========================================="
echo ""
echo "Key ID:    $API_KEY_ID"
echo "Key Name:  $KEY_NAME"
echo "Key Value: $API_KEY_VALUE"
echo ""
echo "Add this to your .env file:"
echo "VITE_API_KEY=$API_KEY_VALUE"
echo ""
echo "To delete this key later:"
echo "aws apigateway delete-api-key --api-key $API_KEY_ID"
