# Test: Update Post without Auth (Should Fail)
# This endpoint requires authentication

PUT {{base_url}}/posts/any-post-slug
Content-Type: application/json
{
  "title": "Unauthorized Update"
}

HTTP 401
