# Test: Create Post with Missing Request Body
# POST without JSON body should return 400

POST {{base_url}}/posts
Authorization: Bearer {{access_token}}
Content-Type: application/json

HTTP 400
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" exists
