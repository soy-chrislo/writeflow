# ============================================
# SECURITY TEST: Cross-User Delete Forbidden
# ============================================
# User 1 creates a post, User 2 tries to delete it
# Expected: 403 Forbidden
# ============================================

# Step 1: User 1 gets upload URL
POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "slug": "security-test-delete-{{timestamp}}"
}

HTTP 200
[Captures]
upload_url: jsonpath "$.data.uploadUrl"
content_key: jsonpath "$.data.contentKey"


# Step 2: Upload content
PUT {{upload_url}}
Content-Type: text/html
```
<h1>User 1's Post</h1>
<p>User 2 should not be able to delete this.</p>
```

HTTP 200


# Step 3: User 1 creates post
POST {{base_url}}/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "title": "User 1 Protected Post {{timestamp}}",
  "contentKey": "{{content_key}}",
  "status": "published"
}

HTTP 201
[Captures]
post_slug: jsonpath "$.data.slug"


# Step 4: User 2 tries to delete User 1's post (SHOULD FAIL)
DELETE {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token_2}}
Content-Type: application/json

HTTP 403
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" contains "permission"


# Step 5: Verify post still exists
GET {{base_url}}/posts/{{post_slug}}
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true


# Step 6: Cleanup - User 1 deletes the post
DELETE {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
