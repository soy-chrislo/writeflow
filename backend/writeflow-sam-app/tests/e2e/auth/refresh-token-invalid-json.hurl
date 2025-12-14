# Test: Refresh Token Invalid JSON
# Malformed JSON should return 400

POST {{base_url}}/auth/refresh
Content-Type: application/json
```
{invalid json
```

HTTP 400
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" contains "Invalid JSON"
