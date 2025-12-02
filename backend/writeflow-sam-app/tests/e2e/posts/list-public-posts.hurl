# Test: List Public Posts (No Auth Required)
# This endpoint returns only published posts

GET {{base_url}}/posts
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.posts" isCollection
