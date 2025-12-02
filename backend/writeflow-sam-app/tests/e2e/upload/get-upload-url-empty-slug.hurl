# Test: Get Upload URL with Empty Slug (Should Return 400)
# Slug cannot be empty

POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "slug": ""
}

HTTP 400
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" exists
