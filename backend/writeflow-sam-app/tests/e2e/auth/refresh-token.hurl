# Test: Refresh Token Success
# Exchange a valid refresh token for new access/id tokens

POST {{base_url}}/auth/refresh
Content-Type: application/json
{
  "refreshToken": "{{refresh_token}}"
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.accessToken" exists
jsonpath "$.data.idToken" exists
jsonpath "$.data.expiresIn" exists
jsonpath "$.data.expiresIn" >= 3600
