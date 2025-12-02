# Test: Create Post Missing Title (Should Return 400)
# Title is required when creating a post

POST {{base_url}}/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "contentKey": "posts/user123/some-content-key.html"
}

HTTP 400
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" exists
