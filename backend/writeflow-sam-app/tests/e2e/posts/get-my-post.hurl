# Test: Get My Post (Authenticated)
# Get a specific post via /my/posts/{slug} endpoint

# Step 1: Get Presigned URL for Upload
POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "slug": "e2e-get-my-post-test-{{timestamp}}"
}

HTTP 200
[Captures]
upload_url: jsonpath "$.data.uploadUrl"
content_key: jsonpath "$.data.contentKey"


# Step 2: Upload HTML Content to S3
PUT {{upload_url}}
Content-Type: text/html
```
<h1>My Post Content</h1>
<p>This is my draft post content.</p>
```

HTTP 200


# Step 3: Create Draft Post
POST {{base_url}}/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "title": "E2E Get My Post Test {{timestamp}}",
  "contentKey": "{{content_key}}",
  "status": "draft"
}

HTTP 201
[Captures]
post_slug: jsonpath "$.data.slug"


# Step 4: Get Post via /my/posts/{slug}
GET {{base_url}}/my/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.slug" == {{post_slug}}
jsonpath "$.data.title" contains "E2E Get My Post Test"
jsonpath "$.data.status" == "draft"
jsonpath "$.data.content" contains "My Post Content"


# Step 5: Cleanup
DELETE {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
