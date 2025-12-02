# ============================================
# WRITEFLOW E2E TEST: Delete Post Flow
# ============================================
# Tests delete operation:
# 1. Create a post
# 2. Delete the post
# 3. Verify post is no longer accessible
# ============================================

# Step 1: Get Presigned URL for Upload
POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "slug": "e2e-delete-test-{{timestamp}}"
}

HTTP 200
[Captures]
upload_url: jsonpath "$.data.uploadUrl"
content_key: jsonpath "$.data.contentKey"


# Step 2: Upload Content
PUT {{upload_url}}
Content-Type: text/html
```
<h1>Delete Test Content</h1>
<p>This content will be deleted.</p>
```

HTTP 200


# Step 3: Create Published Post
POST {{base_url}}/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "title": "Post To Delete {{timestamp}}",
  "contentKey": "{{content_key}}",
  "status": "published"
}

HTTP 201
[Captures]
post_slug: jsonpath "$.data.slug"


# Step 4: Verify Post Exists
GET {{base_url}}/posts/{{post_slug}}
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true


# Step 5: Delete the Post
DELETE {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true


# Step 6: Verify Post No Longer Exists (Public)
GET {{base_url}}/posts/{{post_slug}}
Content-Type: application/json

HTTP 404
[Asserts]
jsonpath "$.success" == false


# Step 7: Verify Post No Longer Exists (Authenticated)
GET {{base_url}}/my/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 404
[Asserts]
jsonpath "$.success" == false
