# Test: List Public Posts with Limit Parameter
# Verify limit parameter works correctly on public endpoint

GET {{base_url}}/posts?limit=5
Content-Type: application/json

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.posts" isCollection
