#!/bin/bash
# ============================================
# Writeflow E2E Test Runner
# ============================================
# Usage:
#   ./run-tests.sh                    # Run all tests
#   ./run-tests.sh --no-auth          # Run only tests that don't require auth
#   ./run-tests.sh --flows            # Run only flow tests
#   ./run-tests.sh --quick            # Run quick smoke tests
#   ./run-tests.sh --report           # Generate HTML report
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARS_FILE="$SCRIPT_DIR/vars/dev.env"
REPORTS_DIR="$SCRIPT_DIR/reports"
TIMESTAMP=$(date +%s)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Filter libcurl warnings from hurl output
run_hurl() {
    hurl "$@" 2>&1 | grep -v "boolean setopt(81)"
}

# Check if hurl is installed
if ! command -v hurl &> /dev/null; then
    echo -e "${RED}Error: hurl is not installed${NC}"
    echo "Install with: cargo install hurl"
    echo "Or visit: https://hurl.dev/docs/installation.html"
    exit 1
fi

# Check if vars file exists
if [ ! -f "$VARS_FILE" ]; then
    echo -e "${RED}Error: Variables file not found: $VARS_FILE${NC}"
    echo "Copy vars/dev.env.example to vars/dev.env and configure it"
    exit 1
fi

# Load variables
source "$VARS_FILE"

# Parse arguments
RUN_AUTH_TESTS=true
RUN_FLOWS=true
RUN_INDIVIDUAL=true
GENERATE_REPORT=false
QUICK_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-auth)
            RUN_AUTH_TESTS=false
            shift
            ;;
        --flows)
            RUN_INDIVIDUAL=false
            shift
            ;;
        --quick)
            QUICK_MODE=true
            RUN_FLOWS=false
            shift
            ;;
        --report)
            GENERATE_REPORT=true
            shift
            ;;
        --help)
            echo "Usage: ./run-tests.sh [options]"
            echo ""
            echo "Options:"
            echo "  --no-auth    Run only tests that don't require authentication"
            echo "  --flows      Run only flow tests (skip individual endpoint tests)"
            echo "  --quick      Quick smoke test (no flows, no auth tests)"
            echo "  --report     Generate HTML report in reports/ directory"
            echo "  --help       Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Writeflow E2E Test Suite${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "API URL: ${GREEN}$base_url${NC}"
echo -e "Timestamp: ${YELLOW}$TIMESTAMP${NC}"
echo ""

# Get access token if running auth tests
if [ "$RUN_AUTH_TESTS" = true ]; then
    echo -e "${YELLOW}Obtaining tokens for user 1...${NC}"

    # Get full authentication result (ID Token + Refresh Token)
    AUTH_RESULT=$(aws cognito-idp initiate-auth \
        --auth-flow USER_PASSWORD_AUTH \
        --client-id "$client_id" \
        --auth-parameters USERNAME="$test_email",PASSWORD="$test_password" \
        --query 'AuthenticationResult' \
        --output json 2>/dev/null)

    if [ -z "$AUTH_RESULT" ] || [ "$AUTH_RESULT" == "null" ]; then
        echo -e "${RED}Failed to obtain tokens for user 1${NC}"
        echo "Make sure the test user exists. Run: ./auth/create-test-user.sh"
        exit 1
    fi

    # Note: Cognito User Pool Authorizer requires ID Token, not Access Token
    ACCESS_TOKEN=$(echo "$AUTH_RESULT" | jq -r '.IdToken')
    REFRESH_TOKEN=$(echo "$AUTH_RESULT" | jq -r '.RefreshToken')
    echo -e "${GREEN}Tokens for user 1 obtained successfully${NC}"

    # Get second user token for cross-user security tests
    if [ -n "$test_email_2" ] && [ -n "$test_password_2" ]; then
        echo -e "${YELLOW}Obtaining access token for user 2...${NC}"

        TOKEN_RESPONSE_2=$(aws cognito-idp initiate-auth \
            --auth-flow USER_PASSWORD_AUTH \
            --client-id "$client_id" \
            --auth-parameters USERNAME="$test_email_2",PASSWORD="$test_password_2" \
            --query 'AuthenticationResult.IdToken' \
            --output text 2>/dev/null)

        if [ -z "$TOKEN_RESPONSE_2" ] || [ "$TOKEN_RESPONSE_2" == "None" ]; then
            echo -e "${YELLOW}Warning: Failed to obtain token for user 2${NC}"
            echo "Cross-user security tests will be skipped."
            echo "To enable, run: ./auth/create-test-user-2.sh"
            ACCESS_TOKEN_2=""
        else
            ACCESS_TOKEN_2="$TOKEN_RESPONSE_2"
            echo -e "${GREEN}Access token for user 2 obtained successfully${NC}"
        fi
    else
        echo -e "${YELLOW}Warning: Second test user not configured${NC}"
        echo "Cross-user security tests will be skipped."
        ACCESS_TOKEN_2=""
    fi
    echo ""
fi

# Build hurl options as an array to handle special characters in tokens
HURL_OPTS=(--test --variables-file "$VARS_FILE" --variable "timestamp=$TIMESTAMP")

if [ "$RUN_AUTH_TESTS" = true ]; then
    HURL_OPTS+=(--variable "access_token=$ACCESS_TOKEN")
    HURL_OPTS+=(--variable "refresh_token=$REFRESH_TOKEN")
    if [ -n "$ACCESS_TOKEN_2" ]; then
        HURL_OPTS+=(--variable "access_token_2=$ACCESS_TOKEN_2")
    fi
fi

if [ "$GENERATE_REPORT" = true ]; then
    mkdir -p "$REPORTS_DIR"
    HURL_OPTS+=(--report-html "$REPORTS_DIR" --report-junit "$REPORTS_DIR/junit.xml")
fi

# Run tests
echo -e "${BLUE}Running tests...${NC}"
echo ""

if [ "$QUICK_MODE" = true ]; then
    echo -e "${YELLOW}Quick mode: Running smoke tests only${NC}"
    run_hurl "${HURL_OPTS[@]}" \
        "$SCRIPT_DIR/posts/list-public-posts.hurl" \
        "$SCRIPT_DIR/posts/get-post-not-found.hurl"
elif [ "$RUN_AUTH_TESTS" = false ]; then
    echo -e "${YELLOW}No-auth mode: Running public endpoint tests only${NC}"
    run_hurl "${HURL_OPTS[@]}" \
        "$SCRIPT_DIR/posts/list-public-posts.hurl" \
        "$SCRIPT_DIR/posts/list-public-posts-with-limit.hurl" \
        "$SCRIPT_DIR/posts/get-post-not-found.hurl" \
        "$SCRIPT_DIR/posts/list-my-posts-unauthorized.hurl" \
        "$SCRIPT_DIR/posts/create-post-unauthorized.hurl" \
        "$SCRIPT_DIR/posts/update-post-unauthorized.hurl" \
        "$SCRIPT_DIR/posts/delete-post-unauthorized.hurl" \
        "$SCRIPT_DIR/upload/get-upload-url-unauthorized.hurl"
elif [ "$RUN_INDIVIDUAL" = false ]; then
    echo -e "${YELLOW}Flows mode: Running flow tests only${NC}"
    run_hurl "${HURL_OPTS[@]}" --jobs 1 "$SCRIPT_DIR/flows/"*.hurl
else
    echo -e "${YELLOW}Full mode: Running all tests${NC}"

    # Run individual tests first (can run in parallel)
    echo ""
    echo -e "${BLUE}Individual endpoint tests:${NC}"
    run_hurl "${HURL_OPTS[@]}" \
        "$SCRIPT_DIR/posts/"*.hurl \
        "$SCRIPT_DIR/upload/"*.hurl

    # Run auth tests
    echo ""
    echo -e "${BLUE}Auth endpoint tests:${NC}"
    run_hurl "${HURL_OPTS[@]}" "$SCRIPT_DIR/auth/"*.hurl

    # Run flow tests sequentially
    echo ""
    echo -e "${BLUE}Flow tests:${NC}"
    run_hurl "${HURL_OPTS[@]}" --jobs 1 "$SCRIPT_DIR/flows/"*.hurl

    # Run security tests if second user token is available
    if [ -n "$ACCESS_TOKEN_2" ]; then
        echo ""
        echo -e "${BLUE}Cross-user security tests:${NC}"
        run_hurl "${HURL_OPTS[@]}" --jobs 1 "$SCRIPT_DIR/security/"*.hurl
    fi
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  All tests passed!${NC}"
echo -e "${GREEN}============================================${NC}"

if [ "$GENERATE_REPORT" = true ]; then
    echo ""
    echo -e "HTML Report: ${BLUE}$REPORTS_DIR/index.html${NC}"
    echo -e "JUnit Report: ${BLUE}$REPORTS_DIR/junit.xml${NC}"
fi
