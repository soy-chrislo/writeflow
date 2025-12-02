# Test: List My Posts (Auth Required)
# This endpoint returns all posts for the authenticated user

GET {{base_url}}/my/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.posts" isCollection
