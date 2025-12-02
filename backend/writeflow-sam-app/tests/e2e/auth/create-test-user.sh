#!/bin/bash
# Script to create a test user in Cognito
# Usage: ./create-test-user.sh [email] [password]

set -e

# Load from env file if exists
if [ -f "$(dirname "$0")/../vars/dev.env" ]; then
  source "$(dirname "$0")/../vars/dev.env"
fi

EMAIL="${1:-$test_email}"
PASSWORD="${2:-$test_password}"
USER_POOL_ID="${user_pool_id}"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ] || [ -z "$USER_POOL_ID" ]; then
  echo "Error: Missing required parameters"
  echo "Usage: ./create-test-user.sh [email] [password]"
  exit 1
fi

echo "Creating test user: $EMAIL"

# Create user
aws cognito-idp admin-create-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$EMAIL" \
  --user-attributes Name=email,Value="$EMAIL" Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --temporary-password "$PASSWORD" \
  2>/dev/null || echo "User might already exist, continuing..."

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id "$USER_POOL_ID" \
  --username "$EMAIL" \
  --password "$PASSWORD" \
  --permanent

echo "Test user created/updated successfully: $EMAIL"
echo ""
echo "You can now run: ./get-token.sh to get an access token"
