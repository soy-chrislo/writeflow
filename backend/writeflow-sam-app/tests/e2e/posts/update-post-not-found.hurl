# Test: Update Non-Existent Post (Should Return 404)
# Attempt to update a post that doesn't exist

PUT {{base_url}}/posts/non-existent-post-slug-12345
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "title": "This Should Fail"
}

HTTP 404
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" exists
