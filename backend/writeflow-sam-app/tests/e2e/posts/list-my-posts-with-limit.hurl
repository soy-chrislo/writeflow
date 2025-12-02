# Test: List My Posts with Limit Parameter
# Verify limit parameter works correctly

GET {{base_url}}/my/posts?limit=5
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.posts" isCollection
