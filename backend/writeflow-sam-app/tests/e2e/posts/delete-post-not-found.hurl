# Test: Delete Non-Existent Post (Should Return 404)
# Attempt to delete a post that doesn't exist

DELETE {{base_url}}/posts/non-existent-post-slug-12345
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 404
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" exists
