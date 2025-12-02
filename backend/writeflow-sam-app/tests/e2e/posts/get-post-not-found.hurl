# Test: Get Post Not Found
# Request a post that doesn't exist

GET {{base_url}}/posts/non-existent-post-slug-12345
Content-Type: application/json

HTTP 404
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" exists
