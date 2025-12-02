# Test: Update Post with Invalid JSON
# Malformed JSON should return 400

PUT {{base_url}}/posts/any-slug
Authorization: Bearer {{access_token}}
Content-Type: application/json
```
{invalid json
```

HTTP 400
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" contains "Invalid JSON"
