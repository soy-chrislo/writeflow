# Test: Get Presigned Upload URL (Auth Required)
# This endpoint returns a presigned S3 URL for content upload

POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "slug": "test-upload-{{timestamp}}"
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.uploadUrl" exists
jsonpath "$.data.contentKey" exists
jsonpath "$.data.expiresIn" exists
jsonpath "$.data.expiresIn" == 300
