# ============================================
# SECURITY TEST: Cross-User Update Forbidden
# ============================================
# User 1 creates a post, User 2 tries to update it
# Expected: 403 Forbidden
# ============================================

# Step 1: User 1 gets upload URL
POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "slug": "security-test-update-{{timestamp}}"
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
<p>This post belongs to user 1.</p>
```

HTTP 200


# Step 3: User 1 creates post
POST {{base_url}}/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "title": "User 1 Post {{timestamp}}",
  "contentKey": "{{content_key}}",
  "status": "draft"
}

HTTP 201
[Captures]
post_slug: jsonpath "$.data.slug"


# Step 4: User 2 tries to update User 1's post (SHOULD FAIL)
PUT {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token_2}}
Content-Type: application/json
{
  "title": "Hacked by User 2"
}

HTTP 403
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" contains "permission"


# Step 5: Cleanup - User 1 deletes the post
DELETE {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
