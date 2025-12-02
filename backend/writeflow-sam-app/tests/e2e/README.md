# Writeflow E2E Tests

End-to-end tests for the Writeflow API using [Hurl](https://hurl.dev/).

## Prerequisites

1. **Install Hurl**
   ```bash
   # Arch/Manjaro
   yay -S hurl-bin

   # Or via cargo
   cargo install hurl

   # Or via npm
   npm install -g @orangeopensource/hurl
   ```

2. **AWS CLI configured** with appropriate credentials

3. **Create test user in Cognito**
   ```bash
   ./auth/create-test-user.sh
   ```

## Configuration

1. Copy the example environment file:
   ```bash
   cp vars/dev.env.example vars/dev.env
   ```

2. Edit `vars/dev.env` with your actual values (already configured for dev environment)

## Running Tests

### Full Test Suite
```bash
./run-tests.sh
```

### Quick Smoke Tests (no auth required)
```bash
./run-tests.sh --quick
```

### Only Public Endpoints (no auth)
```bash
./run-tests.sh --no-auth
```

### Only Flow Tests
```bash
./run-tests.sh --flows
```

### Generate HTML Report
```bash
./run-tests.sh --report
# Open reports/index.html in browser
```

## Test Structure

```
tests/e2e/
├── vars/
│   ├── dev.env           # Development environment variables
│   └── dev.env.example   # Template for environment file
├── auth/
│   ├── get-token.sh      # Get Cognito access token
│   └── create-test-user.sh # Create test user in Cognito
├── posts/
│   ├── list-public-posts.hurl
│   ├── list-my-posts.hurl
│   ├── list-my-posts-unauthorized.hurl
│   └── get-post-not-found.hurl
├── upload/
│   ├── get-upload-url.hurl
│   └── get-upload-url-unauthorized.hurl
├── flows/
│   ├── full-crud-flow.hurl      # Complete CRUD lifecycle
│   └── draft-visibility.hurl    # Draft post visibility rules
├── reports/                      # Generated test reports
├── run-tests.sh                  # Test orchestrator
└── README.md
```

## Writing New Tests

### Individual Endpoint Test
```hurl
# Test: Description of what this tests
GET {{base_url}}/endpoint
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true
```

### Flow Test (chained requests)
```hurl
# Step 1: Create something
POST {{base_url}}/resource
Authorization: Bearer {{access_token}}
Content-Type: application/json
{ "name": "test" }

HTTP 201
[Captures]
resource_id: jsonpath "$.data.id"

# Step 2: Use captured value
GET {{base_url}}/resource/{{resource_id}}
HTTP 200
```

## Available Variables

| Variable | Description |
|----------|-------------|
| `base_url` | API Gateway endpoint URL |
| `access_token` | Cognito access token (injected by run-tests.sh) |
| `timestamp` | Unix timestamp for unique test data |
| `user_pool_id` | Cognito User Pool ID |
| `client_id` | Cognito App Client ID |

## CI/CD Integration

### GitHub Actions
```yaml
- name: Install Hurl
  run: |
    curl -LO https://github.com/Orange-OpenSource/hurl/releases/download/4.2.0/hurl_4.2.0_amd64.deb
    sudo dpkg -i hurl_4.2.0_amd64.deb

- name: Run E2E Tests
  run: ./tests/e2e/run-tests.sh --report
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```
