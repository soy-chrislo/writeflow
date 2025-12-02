# Test: Create Post without Auth (Should Fail)
# This endpoint requires authentication

POST {{base_url}}/posts
Content-Type: application/json
{
  "title": "Unauthorized Post",
  "contentKey": "posts/user123/content.html"
}

HTTP 401
