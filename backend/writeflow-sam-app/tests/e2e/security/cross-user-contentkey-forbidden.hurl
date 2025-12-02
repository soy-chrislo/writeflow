# ============================================
# SECURITY TEST: Cross-User ContentKey Forbidden
# ============================================
# User 1 uploads content, User 2 tries to use User 1's contentKey
# Expected: 403 Forbidden
# ============================================

# Step 1: User 1 gets upload URL and contentKey
POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "slug": "security-test-contentkey-{{timestamp}}"
}

HTTP 200
[Captures]
upload_url: jsonpath "$.data.uploadUrl"
user1_content_key: jsonpath "$.data.contentKey"


# Step 2: User 1 uploads content
PUT {{upload_url}}
Content-Type: text/html
```
<h1>User 1's Content</h1>
<p>This content belongs to user 1.</p>
```

HTTP 200


# Step 3: User 2 tries to create post with User 1's contentKey (SHOULD FAIL)
POST {{base_url}}/posts
Authorization: Bearer {{access_token_2}}
Content-Type: application/json
{
  "title": "Stolen Content Post {{timestamp}}",
  "contentKey": "{{user1_content_key}}",
  "status": "draft"
}

HTTP 403
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" contains "Invalid content key"
