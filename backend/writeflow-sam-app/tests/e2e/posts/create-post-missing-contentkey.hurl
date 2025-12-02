# Test: Create Post Missing ContentKey (Should Return 400)
# ContentKey is required when creating a post

POST {{base_url}}/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "title": "Post Without Content Key"
}

HTTP 400
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" exists
