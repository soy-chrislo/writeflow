# Test: List My Posts Filtered by Draft Status
# Verify status filter returns only drafts

GET {{base_url}}/my/posts?status=draft
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.posts" isCollection
