# Test: Refresh Token Invalid Token
# POST with invalid refresh token should return 401

POST {{base_url}}/auth/refresh
Content-Type: application/json
{
  "refreshToken": "invalid-refresh-token-here"
}

HTTP 401
[Asserts]
jsonpath "$.success" == false
jsonpath "$.error" contains "Invalid"
