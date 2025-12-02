#!/bin/bash
# Script to get Cognito access token for testing
# Usage: ./get-token.sh [email] [password]
# Or set TEST_EMAIL and TEST_PASSWORD environment variables

set -e

# Load from env file if exists
if [ -f "$(dirname "$0")/../vars/dev.env" ]; then
  source "$(dirname "$0")/../vars/dev.env"
fi

EMAIL="${1:-$test_email}"
PASSWORD="${2:-$test_password}"
CLIENT_ID="${client_id}"
USER_POOL_ID="${user_pool_id}"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ] || [ -z "$CLIENT_ID" ]; then
  echo "Error: Missing required parameters"
  echo "Usage: ./get-token.sh [email] [password]"
  echo "Or set test_email, test_password, client_id in vars/dev.env"
  exit 1
fi

# Authenticate with Cognito using USER_PASSWORD_AUTH flow
RESPONSE=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id "$CLIENT_ID" \
  --auth-parameters USERNAME="$EMAIL",PASSWORD="$PASSWORD" \
  --query 'AuthenticationResult' \
  --output json 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$RESPONSE" ] || [ "$RESPONSE" == "null" ]; then
  echo "Error: Authentication failed. Make sure the user exists and credentials are correct."
  echo "To create a test user, run: ./create-test-user.sh"
  exit 1
fi

ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.AccessToken')
ID_TOKEN=$(echo "$RESPONSE" | jq -r '.IdToken')
EXPIRES_IN=$(echo "$RESPONSE" | jq -r '.ExpiresIn')

echo "# Cognito Tokens (valid for $EXPIRES_IN seconds)"
echo "access_token=$ACCESS_TOKEN"
echo ""
echo "# For use in hurl files:"
echo "# Authorization: Bearer {{access_token}}"
