# Test: Refresh Token Missing Body
# POST without body should return 400

POST {{base_url}}/auth/refresh
Content-Type: application/json

HTTP 400
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" exists
