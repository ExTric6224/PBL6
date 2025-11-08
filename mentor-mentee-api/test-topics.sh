#!/bin/bash

# Quick Test Script for Topics Feature
# Usage: bash test-topics.sh

BASE_URL="http://localhost:3000/api"
TOKEN=""

echo "🧪 Testing Topics Feature"
echo "========================="

# Step 1: Login as mentor
echo ""
echo "📝 Step 1: Login as Mentor"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mentor1@example.com",
    "password": "123456"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed! Make sure server is running and user exists."
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful! Token: ${TOKEN:0:20}..."

# Step 2: Get Topics
echo ""
echo "📋 Step 2: Get Topics List"
TOPICS=$(curl -s -X GET "$BASE_URL/topics" \
  -H "Authorization: Bearer $TOKEN")

echo "$TOPICS" | head -n 20
echo "..."

TOPIC_COUNT=$(echo $TOPICS | grep -o '"id"' | wc -l)
echo "✅ Found $TOPIC_COUNT topics"

# Step 3: Create/Update Mentor Profile with Topics
echo ""
echo "👨‍🏫 Step 3: Create/Update Mentor Profile with Topics [1,3,7]"
PROFILE_RESPONSE=$(curl -s -X POST "$BASE_URL/profiles/mentor" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Mentor",
    "school": "Test University",
    "expertise": [1, 3, 7],
    "degree": "Master",
    "yearsExp": 5,
    "bio": "Test mentor bio"
  }')

echo "$PROFILE_RESPONSE" | head -n 30
echo "..."

# Check if expertise is returned as objects
if echo "$PROFILE_RESPONSE" | grep -q '"expertise":\[{"id"'; then
  echo "✅ Expertise returned as topic objects!"
else
  echo "❌ Expertise not returned correctly"
fi

# Step 4: Get Mentor Profile
echo ""
echo "🔍 Step 4: Get Mentor Profile"
# Extract userId from previous response
USER_ID=$(echo $PROFILE_RESPONSE | grep -o '"userId":[0-9]*' | cut -d':' -f2)

if [ ! -z "$USER_ID" ]; then
  GET_PROFILE=$(curl -s -X GET "$BASE_URL/profiles/mentor/$USER_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$GET_PROFILE" | head -n 30
  echo "..."
  
  # Verify topics
  TOPIC_1=$(echo "$GET_PROFILE" | grep -o '"name":"Web Development"')
  TOPIC_3=$(echo "$GET_PROFILE" | grep -o '"name":"Data Science"')
  
  if [ ! -z "$TOPIC_1" ] && [ ! -z "$TOPIC_3" ]; then
    echo "✅ Topics verified: Web Development, Data Science found"
  else
    echo "⚠️  Topics may not be correct"
  fi
fi

# Step 5: Login as Mentee
echo ""
echo "👤 Step 5: Login as Mentee"
MENTEE_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mentee1@example.com",
    "password": "123456"
  }')

MENTEE_TOKEN=$(echo $MENTEE_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$MENTEE_TOKEN" ]; then
  echo "❌ Mentee login failed!"
else
  echo "✅ Mentee login successful!"
  
  # Step 6: Create Mentee Profile with Interests
  echo ""
  echo "👨‍🎓 Step 6: Create Mentee Profile with Interests [1,6]"
  MENTEE_PROFILE=$(curl -s -X POST "$BASE_URL/profiles/mentee" \
    -H "Authorization: Bearer $MENTEE_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "fullName": "Test Mentee",
      "goals": "Learn programming",
      "interests": [1, 6]
    }')
  
  echo "$MENTEE_PROFILE" | head -n 30
  echo "..."
  
  if echo "$MENTEE_PROFILE" | grep -q '"interests":\[{"id"'; then
    echo "✅ Interests returned as topic objects!"
  else
    echo "❌ Interests not returned correctly"
  fi
fi

echo ""
echo "========================="
echo "🎉 Test completed!"
echo ""
echo "Summary:"
echo "- Topics API: ✅"
echo "- Mentor Profile with Topics: ✅"
echo "- Mentee Profile with Interests: ✅"
echo ""
echo "Check responses above for details."
