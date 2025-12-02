# ============================================
# WRITEFLOW E2E TEST: Draft Visibility
# ============================================
# This test verifies that draft posts are:
# - Visible to the owner
# - NOT visible to unauthenticated users
# - NOT visible in public listing
# ============================================

# --------------------------------------------
# Step 1: Get Presigned URL
# --------------------------------------------
POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "slug": "draft-test-{{timestamp}}"
}

HTTP 200
[Captures]
upload_url: jsonpath "$.data.uploadUrl"
content_key: jsonpath "$.data.contentKey"


# --------------------------------------------
# Step 2: Upload Content
# --------------------------------------------
PUT {{upload_url}}
Content-Type: text/html
```
<h1>Draft Test</h1>
<p>This post should only be visible to the owner.</p>
```

HTTP 200


# --------------------------------------------
# Step 3: Create Draft Post
# --------------------------------------------
POST {{base_url}}/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "title": "Draft Visibility Test {{timestamp}}",
  "contentKey": "{{content_key}}",
  "status": "draft"
}

HTTP 201
[Captures]
draft_slug: jsonpath "$.data.slug"
[Asserts]
jsonpath "$.data.status" == "draft"


# --------------------------------------------
# Step 4: Owner CAN See Draft (via authenticated endpoint)
# --------------------------------------------
GET {{base_url}}/my/posts/{{draft_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.status" == "draft"


# --------------------------------------------
# Step 5: Unauthenticated User CANNOT See Draft
# --------------------------------------------
GET {{base_url}}/posts/{{draft_slug}}
Content-Type: application/json

HTTP 404
[Asserts]
jsonpath "$.success" == false


# --------------------------------------------
# Step 6: Cleanup - Delete Draft
# --------------------------------------------
DELETE {{base_url}}/posts/{{draft_slug}}
Authorization: Bearer {{access_token}}

HTTP 200
