# Test: Create Post with Invalid JSON
# Malformed JSON should return 400

POST {{base_url}}/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json
```
{invalid json here
```

HTTP 400
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" contains "Invalid JSON"
