# Test: Delete Post without Auth (Should Fail)
# This endpoint requires authentication

DELETE {{base_url}}/posts/any-post-slug
Content-Type: application/json

HTTP 401
