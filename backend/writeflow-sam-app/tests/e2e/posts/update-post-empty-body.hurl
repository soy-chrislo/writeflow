# Test: Update Post with Empty Update Object
# Empty JSON object {} should succeed but only update timestamp

# First create a post to update
POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "slug": "update-empty-body-test-{{timestamp}}"
}

HTTP 200
[Captures]
upload_url: jsonpath "$.data.uploadUrl"
content_key: jsonpath "$.data.contentKey"


PUT {{upload_url}}
Content-Type: text/html
```
<p>Test content</p>
```

HTTP 200


POST {{base_url}}/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "title": "Empty Update Test {{timestamp}}",
  "contentKey": "{{content_key}}",
  "status": "draft"
}

HTTP 201
[Captures]
post_slug: jsonpath "$.data.slug"
original_title: jsonpath "$.data.title"


# Update with empty object - should succeed
PUT {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json
{}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.title" == {{original_title}}
jsonpath "$.data.updatedAt" exists


# Cleanup
DELETE {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
