# ============================================
# SECURITY TEST: Cross-User Draft Visibility
# ============================================
# User 1 creates a draft, User 2 should not be able to see it
# Expected: 404 Not Found (not 403, to avoid leaking existence)
# ============================================

# Step 1: User 1 gets upload URL
POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "slug": "security-test-draft-{{timestamp}}"
}

HTTP 200
[Captures]
upload_url: jsonpath "$.data.uploadUrl"
content_key: jsonpath "$.data.contentKey"


# Step 2: Upload content
PUT {{upload_url}}
Content-Type: text/html
```
<h1>Secret Draft</h1>
<p>This is a private draft.</p>
```

HTTP 200


# Step 3: User 1 creates draft post
POST {{base_url}}/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "title": "Private Draft {{timestamp}}",
  "contentKey": "{{content_key}}",
  "status": "draft"
}

HTTP 201
[Captures]
post_slug: jsonpath "$.data.slug"


# Step 4: User 2 tries to access draft via /my/posts/{slug} (SHOULD FAIL)
# Note: Returns 404 to avoid leaking that the post exists
GET {{base_url}}/my/posts/{{post_slug}}
Authorization: Bearer {{access_token_2}}
Content-Type: application/json

HTTP 404
[Asserts]
jsonpath "$.success" == false


# Step 5: Verify draft is not in public list either
GET {{base_url}}/posts/{{post_slug}}
Content-Type: application/json

HTTP 404


# Step 6: User 1 can still see their own draft
GET {{base_url}}/my/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.status" == "draft"


# Step 7: Cleanup
DELETE {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
