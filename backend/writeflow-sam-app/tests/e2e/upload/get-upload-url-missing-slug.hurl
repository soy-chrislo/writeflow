# Test: Get Upload URL Missing Slug (Should Return 400)
# Slug is required when requesting upload URL

POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
{}

HTTP 400
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" exists
