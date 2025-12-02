# Test: Create Post with Empty Title (Should Return 400)
# Title cannot be empty

POST {{base_url}}/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "title": "",
  "contentKey": "posts/user123/some-content-key.html"
}

HTTP 400
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" exists
