# Test: Get Published Post Success
# This flow creates a published post and retrieves it via public endpoint
# Note: This is a mini-flow that creates and cleans up its own test data

# Step 1: Get Presigned URL for Upload
POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "slug": "e2e-get-post-test-{{timestamp}}"
}

HTTP 200
[Captures]
upload_url: jsonpath "$.data.uploadUrl"
content_key: jsonpath "$.data.contentKey"


# Step 2: Upload HTML Content to S3
PUT {{upload_url}}
Content-Type: text/html
```
<h1>Test Published Post</h1>
<p>Content for get-post-published test.</p>
```

HTTP 200


# Step 3: Create Published Post
POST {{base_url}}/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "title": "E2E Get Post Test {{timestamp}}",
  "contentKey": "{{content_key}}",
  "status": "published"
}

HTTP 201
[Captures]
post_slug: jsonpath "$.data.slug"
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.status" == "published"


# Step 4: Get Published Post via Public Endpoint
GET {{base_url}}/posts/{{post_slug}}
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.slug" == {{post_slug}}
jsonpath "$.data.title" contains "E2E Get Post Test"
jsonpath "$.data.status" == "published"
jsonpath "$.data.content" contains "Test Published Post"
jsonpath "$.data.publishedAt" exists


# Step 5: Cleanup - Delete the post
DELETE {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
