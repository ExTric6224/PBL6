#!/usr/bin/env bash

# Test Script: Verify Posts Permission Logic Fix
# Run this after starting the API server

API_BASE="http://localhost:3000/api"

echo "=========================================="
echo "🧪 Testing Posts Permission Logic Fix"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Login as mentee (may not have post:view_any permission)
echo "📝 Test 1: Login as mentee user"
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mentee1@example.com",
    "password": "123456"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Test 2: View all posts (should work even without post:view_any permission)
echo "📝 Test 2: GET /api/posts (View public posts)"
POSTS_RESPONSE=$(curl -s -X GET "${API_BASE}/posts" \
  -H "Authorization: Bearer $TOKEN")

if echo "$POSTS_RESPONSE" | grep -q '"success":true'; then
  POSTS_COUNT=$(echo "$POSTS_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
  echo -e "${GREEN}✅ Can view posts without post:view_any permission${NC}"
  echo "Total posts found: $POSTS_COUNT"
else
  echo -e "${RED}❌ Cannot view posts${NC}"
  echo "Response: $POSTS_RESPONSE"
fi
echo ""

# Test 3: View specific post
echo "📝 Test 3: GET /api/posts/:id (View specific post)"
POST_ID=$(echo "$POSTS_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$POST_ID" ]; then
  POST_DETAIL=$(curl -s -X GET "${API_BASE}/posts/${POST_ID}" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$POST_DETAIL" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Can view specific post${NC}"
    POST_TITLE=$(echo "$POST_DETAIL" | grep -o '"title":"[^"]*' | cut -d'"' -f4)
    echo "Post title: $POST_TITLE"
  else
    echo -e "${RED}❌ Cannot view specific post${NC}"
    echo "Response: $POST_DETAIL"
  fi
else
  echo -e "${YELLOW}⚠️  No posts available to test${NC}"
fi
echo ""

# Test 4: View post likes (should work)
echo "📝 Test 4: GET /api/posts/:id/likes (View likes)"
if [ ! -z "$POST_ID" ]; then
  LIKES_RESPONSE=$(curl -s -X GET "${API_BASE}/posts/${POST_ID}/likes" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$LIKES_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Can view post likes${NC}"
  else
    echo -e "${RED}❌ Cannot view post likes${NC}"
    echo "Response: $LIKES_RESPONSE"
  fi
else
  echo -e "${YELLOW}⚠️  No posts available to test${NC}"
fi
echo ""

# Test 5: Create post (requires permission)
echo "📝 Test 5: POST /api/posts (Create post - requires permission)"
CREATE_RESPONSE=$(curl -s -X POST "${API_BASE}/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post from Script",
    "content": "Testing posts permission fix",
    "isPublic": true
  }')

if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Can create post (has post:create permission)${NC}"
elif echo "$CREATE_RESPONSE" | grep -q 'Insufficient permissions'; then
  echo -e "${YELLOW}⚠️  Cannot create post (no post:create permission) - Expected${NC}"
else
  echo -e "${RED}❌ Unexpected error${NC}"
  echo "Response: $CREATE_RESPONSE"
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo -e "${GREEN}Expected Results:${NC}"
echo "  1. ✅ Login successful"
echo "  2. ✅ Can view public posts without permission"
echo "  3. ✅ Can view specific post without permission"
echo "  4. ✅ Can view post likes without permission"
echo "  5. ⚠️  Create requires permission (may fail if user lacks permission)"
echo ""
echo -e "${YELLOW}Key Point:${NC} Viewing posts no longer requires post:view_any permission"
echo "Authentication is still required, but permission check is removed for viewing"
echo ""
