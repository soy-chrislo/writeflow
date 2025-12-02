# Test: List My Posts Filtered by Published Status
# Verify status filter returns only published posts

GET {{base_url}}/my/posts?status=published
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.posts" isCollection
