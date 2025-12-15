#!/bin/bash
# Lists all API Keys associated with the Writeflow Usage Plan
#
# Usage: ./list-api-keys.sh [environment]
# Example: ./list-api-keys.sh prod
#
# Requires: AWS CLI configured with appropriate permissions

set -e

ENVIRONMENT="${1:-dev}"

echo "Listing API Keys for environment: $ENVIRONMENT"
echo ""

# Find the Usage Plan
USAGE_PLAN_ID=$(aws apigateway get-usage-plans \
  --query "items[?name=='writeflow-usage-plan-${ENVIRONMENT}'].id" \
  --output text)

if [ -z "$USAGE_PLAN_ID" ]; then
  echo "Error: Could not find Usage Plan for environment '$ENVIRONMENT'"
  exit 1
fi

echo "Usage Plan: $USAGE_PLAN_ID"
echo ""

# Get all keys associated with the usage plan
KEY_IDS=$(aws apigateway get-usage-plan-keys \
  --usage-plan-id "$USAGE_PLAN_ID" \
  --query "items[].id" \
  --output text)

if [ -z "$KEY_IDS" ]; then
  echo "No API Keys found."
  exit 0
fi

echo "=========================================="
echo "API Keys"
echo "=========================================="
echo ""

for KEY_ID in $KEY_IDS; do
  KEY_INFO=$(aws apigateway get-api-key \
    --api-key "$KEY_ID" \
    --include-value \
    --output json)

  NAME=$(echo "$KEY_INFO" | jq -r '.name')
  VALUE=$(echo "$KEY_INFO" | jq -r '.value')
  ENABLED=$(echo "$KEY_INFO" | jq -r '.enabled')
  CREATED=$(echo "$KEY_INFO" | jq -r '.createdDate')

  echo "ID:      $KEY_ID"
  echo "Name:    $NAME"
  echo "Value:   $VALUE"
  echo "Enabled: $ENABLED"
  echo "Created: $CREATED"
  echo "------------------------------------------"
done
