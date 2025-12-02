# ============================================
# SECURITY TEST: Cross-User Update ContentKey Forbidden
# ============================================
# User 2 creates post, then tries to update with User 1's contentKey
# Expected: 403 Forbidden
# ============================================

# Step 1: User 1 gets upload URL (to get a valid contentKey for user 1)
POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "slug": "user1-content-{{timestamp}}"
}

HTTP 200
[Captures]
user1_content_key: jsonpath "$.data.contentKey"


# Step 2: User 2 gets their own upload URL
POST {{base_url}}/upload-url
Authorization: Bearer {{access_token_2}}
Content-Type: application/json
{
  "slug": "user2-post-{{timestamp}}"
}

HTTP 200
[Captures]
upload_url_2: jsonpath "$.data.uploadUrl"
user2_content_key: jsonpath "$.data.contentKey"


# Step 3: User 2 uploads their content
PUT {{upload_url_2}}
Content-Type: text/html
```
<h1>User 2's Content</h1>
```

HTTP 200


# Step 4: User 2 creates their own post
POST {{base_url}}/posts
Authorization: Bearer {{access_token_2}}
Content-Type: application/json
{
  "title": "User 2 Own Post {{timestamp}}",
  "contentKey": "{{user2_content_key}}",
  "status": "draft"
}

HTTP 201
[Captures]
post_slug: jsonpath "$.data.slug"


# Step 5: User 2 tries to update their post with User 1's contentKey (SHOULD FAIL)
PUT {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token_2}}
Content-Type: application/json
{
  "contentKey": "{{user1_content_key}}"
}

HTTP 403
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" contains "Invalid content key"


# Step 6: Cleanup - User 2 deletes their post
DELETE {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token_2}}
Content-Type: application/json

HTTP 200
