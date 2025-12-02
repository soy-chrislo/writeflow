# ============================================
# WRITEFLOW E2E TEST: Update Post Flow
# ============================================
# Tests various update scenarios:
# 1. Update title only
# 2. Update status (draft -> published)
# 3. Verify publishedAt is set on first publish
# ============================================

# Step 1: Get Presigned URL for Upload
POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "slug": "e2e-update-test-{{timestamp}}"
}

HTTP 200
[Captures]
upload_url: jsonpath "$.data.uploadUrl"
content_key: jsonpath "$.data.contentKey"


# Step 2: Upload Content
PUT {{upload_url}}
Content-Type: text/html
```
<h1>Update Test Content</h1>
<p>Original content for update test.</p>
```

HTTP 200


# Step 3: Create Draft Post
POST {{base_url}}/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "title": "Original Title {{timestamp}}",
  "contentKey": "{{content_key}}",
  "status": "draft"
}

HTTP 201
[Captures]
post_slug: jsonpath "$.data.slug"
[Asserts]
jsonpath "$.data.status" == "draft"
jsonpath "$.data.publishedAt" not exists


# Step 4: Update Title Only
PUT {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "title": "Updated Title {{timestamp}}"
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.title" contains "Updated Title"
jsonpath "$.data.status" == "draft"
jsonpath "$.data.publishedAt" not exists


# Step 5: Publish the Post
PUT {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "status": "published"
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.status" == "published"
jsonpath "$.data.publishedAt" exists


# Step 6: Verify Post is Publicly Accessible
GET {{base_url}}/posts/{{post_slug}}
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.status" == "published"


# Step 7: Cleanup
DELETE {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
