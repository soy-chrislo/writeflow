# ============================================
# WRITEFLOW E2E TEST: Full CRUD Flow
# ============================================
# This test covers the complete lifecycle of a post:
# 1. Get presigned URL for content upload
# 2. Upload content to S3
# 3. Create post with contentKey
# 4. Get the created post
# 5. Update the post (title and status)
# 6. List my posts (verify it appears)
# 7. List public posts (verify published post appears)
# 8. Delete the post
# 9. Verify post is deleted
# ============================================

# --------------------------------------------
# Step 1: Get Presigned URL for Upload
# --------------------------------------------
POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "slug": "e2e-test-post-{{timestamp}}"
}

HTTP 200
[Captures]
upload_url: jsonpath "$.data.uploadUrl"
content_key: jsonpath "$.data.contentKey"
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.uploadUrl" exists
jsonpath "$.data.contentKey" contains "posts/"


# --------------------------------------------
# Step 2: Upload HTML Content to S3
# --------------------------------------------
PUT {{upload_url}}
Content-Type: text/html
```
<h1>E2E Test Post</h1>
<p>This is a test post created by the e2e test suite.</p>
<p>Timestamp: {{timestamp}}</p>
```

HTTP 200


# --------------------------------------------
# Step 3: Create Post with ContentKey
# --------------------------------------------
POST {{base_url}}/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "title": "E2E Test Post {{timestamp}}",
  "contentKey": "{{content_key}}",
  "status": "draft"
}

HTTP 201
[Captures]
post_slug: jsonpath "$.data.slug"
author_id: jsonpath "$.data.authorId"
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.slug" exists
jsonpath "$.data.title" contains "E2E Test Post"
jsonpath "$.data.status" == "draft"
jsonpath "$.data.contentKey" == {{content_key}}
jsonpath "$.data.createdAt" exists
jsonpath "$.data.updatedAt" exists


# --------------------------------------------
# Step 4: Get the Created Post (via authenticated endpoint)
# --------------------------------------------
GET {{base_url}}/my/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.slug" == {{post_slug}}
jsonpath "$.data.title" contains "E2E Test Post"
jsonpath "$.data.content" contains "E2E Test Post"
jsonpath "$.data.status" == "draft"


# --------------------------------------------
# Step 5: Update Post (Change Title and Publish)
# --------------------------------------------
PUT {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "title": "E2E Test Post Updated {{timestamp}}",
  "status": "published"
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.title" contains "Updated"
jsonpath "$.data.status" == "published"
jsonpath "$.data.publishedAt" exists


# --------------------------------------------
# Step 6: List My Posts (Verify Post Appears)
# --------------------------------------------
GET {{base_url}}/my/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.posts" isCollection


# --------------------------------------------
# Step 7: List Public Posts (Verify Published Post)
# --------------------------------------------
GET {{base_url}}/posts
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.posts" isCollection


# --------------------------------------------
# Step 8: Delete the Post
# --------------------------------------------
DELETE {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true


# --------------------------------------------
# Step 9: Verify Post is Deleted
# --------------------------------------------
GET {{base_url}}/posts/{{post_slug}}
Content-Type: application/json

HTTP 404
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" == "Post not found"
