# Deployment Guide

This guide covers deploying Writeflow to AWS.

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account** with sufficient permissions
2. **AWS CLI** installed and configured
3. **AWS SAM CLI** installed
4. **Docker** installed and running

### Required IAM Permissions

Your AWS user/role needs permissions to create:

- CloudFormation stacks
- Lambda functions
- API Gateway APIs
- DynamoDB tables
- S3 buckets
- Cognito User Pools
- IAM roles and policies

For simplicity, you can use the `AdministratorAccess` policy during development. For production, create a more restrictive policy.

## Backend Deployment

### Step 1: Configure SAM

```bash
cd backend/writeflow-sam-app

# Create your config file from the example
cp samconfig.toml.example samconfig.toml
```

Edit `samconfig.toml` to customize:
- `stack_name` - Unique name for your CloudFormation stack
- `region` - AWS region (e.g., `us-east-1`)
- `parameter_overrides` - Environment (`dev`, `staging`, `prod`)

### Step 2: Build

```bash
sam build
```

This compiles TypeScript handlers with esbuild and prepares deployment artifacts.

### Step 3: Deploy

**First time (interactive):**
```bash
sam deploy --guided
```

You'll be prompted for:
- Stack Name: `writeflow-sam-app` (or your custom name)
- AWS Region: `us-east-1` (or your preferred region)
- Parameter Environment: `dev`
- Confirm changes before deploy: `Y`
- Allow SAM CLI IAM role creation: `Y`
- Disable rollback: `N`
- Save arguments to configuration file: `Y`

**Subsequent deploys:**
```bash
sam deploy
```

### Step 4: Note the Outputs

After successful deployment, SAM outputs important values:

```
Outputs
-----------------------------------------
Key                 ApiUrl
Description         API Gateway endpoint URL
Value               https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev

Key                 UserPoolId
Description         Cognito User Pool ID
Value               us-east-1_AbCdEfGhI

Key                 UserPoolClientId
Description         Cognito User Pool Client ID
Value               1abc2def3ghi4jkl5mno6pqr

Key                 ContentBucketName
Description         S3 Content Bucket Name
Value               writeflow-content-dev-123456789012
```

**Save these values** - you'll need them for frontend configuration and E2E tests.

## Frontend Deployment

### Option A: Local Development

```bash
cd app

# Configure environment
cp .env.example .env
```

Edit `.env`:
```bash
VITE_API_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev
```

Run:
```bash
pnpm install
pnpm dev
```

### Option B: Production Build

```bash
cd app
pnpm build
```

The `dist/` folder contains static files ready for deployment to:
- **S3 + CloudFront** (recommended for AWS)
- **Vercel**
- **Netlify**
- **Any static hosting**

#### S3 + CloudFront Deployment

```bash
# Create S3 bucket for frontend
aws s3 mb s3://writeflow-frontend-YOUR_ACCOUNT_ID

# Enable static website hosting
aws s3 website s3://writeflow-frontend-YOUR_ACCOUNT_ID \
  --index-document index.html \
  --error-document index.html

# Upload build
aws s3 sync dist/ s3://writeflow-frontend-YOUR_ACCOUNT_ID --delete

# Make public (or use CloudFront OAI)
aws s3api put-bucket-policy --bucket writeflow-frontend-YOUR_ACCOUNT_ID \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::writeflow-frontend-YOUR_ACCOUNT_ID/*"
    }]
  }'
```

For CloudFront setup (recommended for HTTPS and caching), see [AWS CloudFront documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/GettingStarted.SimpleDistribution.html).

## E2E Test Setup

After deploying the backend, configure E2E tests:

```bash
cd backend/writeflow-sam-app/tests/e2e

# Create config from example
cp vars/dev.env.example vars/dev.env
```

Edit `vars/dev.env` with your deployment outputs:

```bash
# API Configuration
base_url=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev

# Cognito Configuration (from sam deploy outputs)
user_pool_id=us-east-1_XXXXXXXXX
client_id=XXXXXXXXXXXXXXXXXXXXXXXXXX

# Test User (you'll create this)
test_email=test@yourdomain.com
test_password=YourSecurePassword123!
```

### Create Test User

```bash
./auth/create-test-user.sh
```

This creates a pre-confirmed user in Cognito for testing.

### Run Tests

```bash
./run-tests.sh          # All tests
./run-tests.sh --quick  # Smoke tests only
```

## Multi-Environment Setup

### Staging Environment

```bash
# Deploy to staging
sam deploy --config-env staging --parameter-overrides Environment=staging
```

Add to `samconfig.toml`:
```toml
[staging.deploy.parameters]
capabilities = "CAPABILITY_IAM"
confirm_changeset = true
resolve_s3 = true
s3_prefix = "writeflow-sam-app-staging"
region = "us-east-1"
parameter_overrides = "Environment=\"staging\""
```

### Production Environment

```bash
# Deploy to production
sam deploy --config-env prod --parameter-overrides Environment=prod
```

## Updating Cognito Callback URLs

For production, update Cognito callback URLs:

```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-id YOUR_CLIENT_ID \
  --callback-urls "https://yourdomain.com/callback" \
  --logout-urls "https://yourdomain.com/logout"
```

Or modify `template.yaml` before deployment:

```yaml
WriteflowUserPoolClient:
  Properties:
    CallbackURLs:
      - https://yourdomain.com/callback
      - http://localhost:5173/callback  # Keep for local dev
    LogoutURLs:
      - https://yourdomain.com/logout
      - http://localhost:5173/logout
```

## Monitoring

### CloudWatch Logs

View Lambda logs:
```bash
sam logs -n CreatePostFunction --stack-name writeflow-sam-app --tail
```

### AWS Console

- **CloudFormation**: Stack status and resources
- **Lambda**: Function metrics and logs
- **API Gateway**: Request metrics
- **DynamoDB**: Table metrics
- **Cognito**: User management

## Cleanup

To delete all resources:

```bash
# Delete the CloudFormation stack
sam delete --stack-name writeflow-sam-app

# Or via AWS CLI
aws cloudformation delete-stack --stack-name writeflow-sam-app
```

**Note**: S3 buckets with content must be emptied before deletion:
```bash
aws s3 rm s3://writeflow-content-dev-YOUR_ACCOUNT_ID --recursive
```

## Troubleshooting

### Deployment Fails with "S3 bucket already exists"

The content bucket name includes your account ID to be unique. If you still get conflicts:
1. Change the stack name
2. Or manually delete the existing bucket

### API Returns 401 Unauthorized

- Check that the frontend is sending the correct `Authorization: Bearer <idToken>` header
- Verify the token hasn't expired
- Ensure you're using the ID token, not the access token

### CORS Errors

The API Gateway is configured to allow all origins (`*`). If you need to restrict:
1. Modify `template.yaml` GatewayResponses
2. Update the `Access-Control-Allow-Origin` header

### Lambda Timeout

Default timeout is 30 seconds. For longer operations, modify in `template.yaml`:
```yaml
Globals:
  Function:
    Timeout: 60  # seconds
```

## Cost Estimation

For a low-traffic blog (~1000 requests/month):

| Service | Estimated Cost |
|---------|---------------|
| Lambda | ~$0.00 (free tier) |
| API Gateway | ~$0.00 (free tier) |
| DynamoDB | ~$0.00 (on-demand, free tier) |
| S3 | ~$0.01 |
| Cognito | ~$0.00 (free tier: 50K MAU) |
| **Total** | **< $1/month** |

Costs scale with usage. Enable AWS Cost Explorer for monitoring.
