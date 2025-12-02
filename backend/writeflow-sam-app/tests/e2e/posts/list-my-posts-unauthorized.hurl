# Test: List My Posts without Auth (Should Fail)
# This endpoint requires authentication

GET {{base_url}}/my/posts
Content-Type: application/json

HTTP 401
