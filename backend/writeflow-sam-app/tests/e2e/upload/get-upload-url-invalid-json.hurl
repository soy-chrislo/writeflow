# Test: Get Upload URL with Invalid JSON
# Malformed JSON should return 400

POST {{base_url}}/upload-url
Authorization: Bearer {{access_token}}
Content-Type: application/json
```
{not valid json
```

HTTP 400
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" contains "Invalid JSON"
