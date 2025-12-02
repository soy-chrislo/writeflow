# Test: Get Upload URL without Auth (Should Fail)
# This endpoint requires authentication

POST {{base_url}}/upload-url
Content-Type: application/json
{
  "slug": "test-upload"
}

HTTP 401
