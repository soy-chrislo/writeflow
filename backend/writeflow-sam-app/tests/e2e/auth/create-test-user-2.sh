#!/bin/bash
# Script to create a second test user in Cognito for cross-user security tests
# Usage: ./create-test-user-2.sh [email] [password]

set -e

# Load from env file if exists
if [ -f "$(dirname "$0")/../vars/dev.env" ]; then
  source "$(dirname "$0")/../vars/dev.env"
fi

EMAIL="${1:-$test_email_2}"
PASSWORD="${2:-$test_password_2}"
USER_POOL_ID="${user_pool_id}"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ] || [ -z "$USER_POOL_ID" ]; then
  echo "Error: Missing required parameters"
  echo "Usage: ./create-test-user-2.sh [email] [password]"
  echo "Or set test_email_2 and test_password_2 in vars/dev.env"
  exit 1
fi

echo "Creating second test user: $EMAIL"

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

echo "Second test user created/updated successfully: $EMAIL"
