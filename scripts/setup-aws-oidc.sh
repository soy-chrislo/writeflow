#!/bin/bash
# Setup AWS OIDC for GitHub Actions
# Usage: ./setup-aws-oidc.sh <aws-account-id> <github-repo>
# Example: ./setup-aws-oidc.sh 123456789012 my-org/my-repo

set -e

AWS_ACCOUNT_ID="${1:-}"
GITHUB_REPO="${2:-}"
ROLE_NAME="GitHubActions-${GITHUB_REPO//\//-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
  echo -e "${GREEN}==>${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}Warning:${NC} $1"
}

print_error() {
  echo -e "${RED}Error:${NC} $1"
}

# Validate inputs
if [ -z "$AWS_ACCOUNT_ID" ] || [ -z "$GITHUB_REPO" ]; then
  echo "Usage: $0 <aws-account-id> <github-repo>"
  echo "Example: $0 123456789012 my-org/my-repo"
  exit 1
fi

# Check AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
  print_error "AWS CLI is not configured. Please run 'aws configure' first."
  exit 1
fi

print_step "Setting up AWS OIDC for GitHub Actions"
echo "  Account ID: $AWS_ACCOUNT_ID"
echo "  Repository: $GITHUB_REPO"
echo "  Role Name:  $ROLE_NAME"
echo ""

# Step 1: Create OIDC Provider (if not exists)
print_step "Creating OIDC Identity Provider..."
OIDC_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"

if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$OIDC_ARN" &> /dev/null; then
  print_warning "OIDC Provider already exists, skipping..."
else
  aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 1d80d741f1a02a4dabe1bfb6a8d1ec5d29b35a44
  echo "  OIDC Provider created successfully"
fi

# Step 2: Create Trust Policy
print_step "Creating IAM Role trust policy..."
TRUST_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${GITHUB_REPO}:*"
        }
      }
    }
  ]
}
EOF
)

# Step 3: Create IAM Role (if not exists)
print_step "Creating IAM Role..."
if aws iam get-role --role-name "$ROLE_NAME" &> /dev/null; then
  print_warning "Role already exists, updating trust policy..."
  aws iam update-assume-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-document "$TRUST_POLICY"
else
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --description "GitHub Actions role for ${GITHUB_REPO}"
  echo "  Role created successfully"
fi

# Step 4: Attach permissions
print_step "Attaching permissions to role..."

# SAM/CloudFormation permissions
POLICIES=(
  "arn:aws:iam::aws:policy/AWSCloudFormationFullAccess"
  "arn:aws:iam::aws:policy/AmazonS3FullAccess"
  "arn:aws:iam::aws:policy/AWSLambda_FullAccess"
  "arn:aws:iam::aws:policy/AmazonAPIGatewayAdministrator"
  "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
  "arn:aws:iam::aws:policy/AmazonCognitoPowerUser"
  "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
  "arn:aws:iam::aws:policy/IAMFullAccess"
)

for POLICY in "${POLICIES[@]}"; do
  POLICY_NAME=$(basename "$POLICY")
  if aws iam list-attached-role-policies --role-name "$ROLE_NAME" --query "AttachedPolicies[?PolicyArn=='$POLICY']" --output text | grep -q "$POLICY"; then
    echo "  $POLICY_NAME already attached"
  else
    aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "$POLICY"
    echo "  Attached: $POLICY_NAME"
  fi
done

# Get Role ARN
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Role ARN: $ROLE_ARN"
echo ""
echo "Next steps:"
echo "1. Go to your GitHub repository: https://github.com/${GITHUB_REPO}/settings/secrets/actions"
echo "2. Add a new repository secret:"
echo "   Name:  AWS_ROLE_ARN"
echo "   Value: $ROLE_ARN"
echo ""
echo "The GitHub Actions workflow will now use OIDC to authenticate with AWS."
