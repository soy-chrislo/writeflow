# Test: List My Posts with Invalid Pagination Token
# Invalid nextToken should return 400

GET {{base_url}}/my/posts?nextToken=invalid-not-base64-json
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 400
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" exists
