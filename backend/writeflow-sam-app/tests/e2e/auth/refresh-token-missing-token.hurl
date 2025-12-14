# Test: Refresh Token Missing Token Field
# POST with empty object should return 400

POST {{base_url}}/auth/refresh
Content-Type: application/json
{}

HTTP 400
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" contains "Refresh token is required"
