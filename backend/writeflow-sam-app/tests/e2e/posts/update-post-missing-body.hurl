# Test: Update Post with Missing Request Body
# PUT without JSON body should return 400

# First create a post to update
POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
{
  "slug": "update-missing-body-test-{{timestamp}}"
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
  "title": "Update Missing Body Test {{timestamp}}",
  "contentKey": "{{content_key}}",
  "status": "draft"
}

HTTP 201
[Captures]
post_slug: jsonpath "$.data.slug"


# Try to update without body
PUT {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 400
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" exists


# Cleanup
DELETE {{base_url}}/posts/{{post_slug}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
