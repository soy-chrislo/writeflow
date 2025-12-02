#!/bin/bash
set -e

cd "$(dirname "$0")"
source vars/dev.env

ID_TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id "$client_id" \
  --auth-parameters USERNAME="$test_email",PASSWORD="$test_password" \
  --query 'AuthenticationResult.IdToken' \
  --output text)

TIMESTAMP=$(date +%s)

echo "=== Step 1: Get Upload URL ==="
UPLOAD_RESP=$(curl -s -X POST "$base_url/upload-url" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"slug\": \"e2e-test-$TIMESTAMP\"}")
echo "$UPLOAD_RESP" | jq .

UPLOAD_URL=$(echo "$UPLOAD_RESP" | jq -r '.data.uploadUrl')
CONTENT_KEY=$(echo "$UPLOAD_RESP" | jq -r '.data.contentKey')
echo "Content Key: $CONTENT_KEY"

echo ""
echo "=== Step 2: Upload to S3 ==="
UPLOAD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$UPLOAD_URL" \
  -H "Content-Type: text/html" \
  -d "<h1>Test Post</h1><p>Content for $TIMESTAMP</p>")
echo "Upload HTTP Status: $UPLOAD_STATUS"

echo ""
echo "=== Step 3: Create Post ==="
CREATE_RESP=$(curl -s -X POST "$base_url/posts" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"E2E Test Post $TIMESTAMP\", \"contentKey\": \"$CONTENT_KEY\", \"status\": \"draft\"}")
echo "$CREATE_RESP" | jq .

POST_SLUG=$(echo "$CREATE_RESP" | jq -r '.data.slug')
echo "Post Slug: $POST_SLUG"

echo ""
echo "=== Step 4: Get Post via /my/posts (with auth - should work for draft) ==="
curl -s -X GET "$base_url/my/posts/$POST_SLUG" \
  -H "Authorization: Bearer $ID_TOKEN" | jq .

echo ""
echo "=== Step 5: Get Post via /posts (without auth - should fail for draft) ==="
curl -s -X GET "$base_url/posts/$POST_SLUG" | jq .

echo ""
echo "=== Cleanup: Delete Post ==="
curl -s -X DELETE "$base_url/posts/$POST_SLUG" \
  -H "Authorization: Bearer $ID_TOKEN" | jq .
