# 🧪 Test Guide - Topics Feature cho Profile

## Bước 1: Chuẩn bị

### 1.1 Đảm bảo topics đã được seed
```bash
# Kiểm tra topics trong DB
npx ts-node -e "import prisma from './src/db/client'; prisma.topic.findMany().then(console.log).finally(() => prisma.$disconnect())"

# Hoặc chạy seed nếu chưa có
npx ts-node prisma/seed-topics.ts
```

### 1.2 Khởi động server
```bash
npm run dev
```

## Bước 2: Test với Postman/cURL

### 2.1 Login để lấy token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mentor1@example.com",
    "password": "123456"
  }'
```

**Lưu token từ response để dùng cho các requests sau!**

### 2.2 Lấy danh sách topics
```bash
curl -X GET http://localhost:3000/api/topics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Web Development",
      "description": "Frontend, Backend, Full-stack development",
      "createdAt": "...",
      "updatedAt": "..."
    },
    {
      "id": 2,
      "name": "Mobile Development",
      "description": "iOS, Android, React Native, Flutter",
      "createdAt": "...",
      "updatedAt": "..."
    }
    // ... 13 topics nữa
  ]
}
```

### 2.3 Tạo/Update Mentor Profile với Topics

**Với JSON (Content-Type: application/json):**
```bash
curl -X POST http://localhost:3000/api/profiles/mentor \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "school": "MIT",
    "expertise": [1, 3, 7],
    "degree": "Master of Computer Science",
    "yearsExp": 5,
    "bio": "Experienced software engineer"
  }'
```

**Với FormData (khi có avatar):**
```bash
curl -X POST http://localhost:3000/api/profiles/mentor \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "fullName=John Doe" \
  -F "school=MIT" \
  -F "expertise=[1,3,7]" \
  -F "degree=Master" \
  -F "yearsExp=5" \
  -F "bio=Expert developer" \
  -F "avatar=@/path/to/image.jpg"
```

**Response mong đợi:**
```json
{
  "data": {
    "id": 1,
    "userId": 2,
    "fullName": "John Doe",
    "school": "MIT",
    "degree": "Master of Computer Science",
    "yearsExp": 5,
    "bio": "Experienced software engineer",
    "expertise": [
      {
        "id": 1,
        "name": "Web Development",
        "description": "Frontend, Backend, Full-stack development",
        "createdAt": "...",
        "updatedAt": "..."
      },
      {
        "id": 3,
        "name": "Data Science",
        "description": "Machine Learning, AI, Data Analysis",
        "createdAt": "...",
        "updatedAt": "..."
      },
      {
        "id": 7,
        "name": "Database",
        "description": "SQL, NoSQL, Database Design, Optimization",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "user": {
      "id": 2,
      "email": "mentor1@example.com",
      "role": "MENTOR"
    }
  }
}
```

### 2.4 Tạo/Update Mentee Profile với Topics

**Login as mentee:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mentee1@example.com",
    "password": "123456"
  }'
```

**Create/Update profile:**
```bash
curl -X POST http://localhost:3000/api/profiles/mentee \
  -H "Authorization: Bearer MENTEE_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Smith",
    "goals": "Learn web development and AI",
    "interests": [1, 3, 6]
  }'
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "userId": 3,
    "fullName": "Jane Smith",
    "goals": "Learn web development and AI",
    "interests": [
      {
        "id": 1,
        "name": "Web Development",
        "description": "...",
        "createdAt": "...",
        "updatedAt": "..."
      },
      {
        "id": 3,
        "name": "Data Science",
        "description": "...",
        "createdAt": "...",
        "updatedAt": "..."
      },
      {
        "id": 6,
        "name": "UI/UX Design",
        "description": "...",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "user": {
      "id": 3,
      "email": "mentee1@example.com",
      "role": "MENTEE"
    }
  }
}
```

### 2.5 Get Profile để xem topics

**Get mentor profile:**
```bash
curl -X GET http://localhost:3000/api/profiles/mentor/2 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get mentee profile:**
```bash
curl -X GET http://localhost:3000/api/profiles/mentee/3 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2.6 Update topics (thay đổi expertise/interests)

**Update mentor - chỉ thay đổi expertise:**
```bash
curl -X POST http://localhost:3000/api/profiles/mentor \
  -H "Authorization: Bearer MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "expertise": [2, 4, 8]
  }'
```

Topics cũ (1,3,7) sẽ bị xóa và thay bằng topics mới (2,4,8).

## Bước 3: Test Scenarios

### Scenario 1: Tạo profile mới với topics
1. ✅ Login as new mentor/mentee (chưa có profile)
2. ✅ Get topics từ `/api/topics`
3. ✅ Create profile với 2-3 topic IDs
4. ✅ Verify response có đầy đủ topic objects

### Scenario 2: Update topics
1. ✅ Get profile hiện tại
2. ✅ Update với topic IDs mới
3. ✅ Verify topics cũ bị thay thế bởi topics mới

### Scenario 3: Clear topics
1. ✅ Update profile với `expertise: []` hoặc `interests: []`
2. ✅ Verify tất cả topics bị xóa

### Scenario 4: Invalid topic IDs
1. ❌ Gửi topic ID không tồn tại (VD: 999)
2. ❌ Expected: Error từ database foreign key constraint

### Scenario 5: Mixed với avatar upload
1. ✅ Upload avatar + topics cùng lúc với FormData
2. ✅ Verify cả avatar và topics được lưu đúng

## Bước 4: Verify trong Database

```sql
-- Xem mentor expertise
SELECT 
  mp.id,
  mp.fullName,
  t.id as topicId,
  t.name as topicName
FROM mentorprofile mp
LEFT JOIN MentorTopicExpertise mte ON mp.id = mte.mentorProfileId
LEFT JOIN Topic t ON mte.topicId = t.id
WHERE mp.userId = 2;

-- Xem mentee interests
SELECT 
  mp.id,
  mp.fullName,
  t.id as topicId,
  t.name as topicName
FROM menteeprofile mp
LEFT JOIN MenteeTopicInterest mti ON mp.id = mti.menteeProfileId
LEFT JOIN Topic t ON mti.topicId = t.id
WHERE mp.userId = 3;
```

## Bước 5: Common Issues & Solutions

### Issue 1: Topics không được return
**Vấn đề:** Response có expertise: [] thay vì topic objects

**Nguyên nhân:** Service không include topics relations

**Giải pháp:** Đã fix trong ProfilesService - include expertise/interests relations

### Issue 2: Foreign key constraint error
**Vấn đề:** Error khi tạo với topic ID không tồn tại

**Response:** 
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Foreign key constraint failed"
  }
}
```

**Giải pháp:** Chỉ sử dụng topic IDs từ 1-15 (đã seed)

### Issue 3: Topics không được update
**Vấn đề:** Update profile nhưng topics không thay đổi

**Nguyên nhân:** Quên gửi expertise/interests trong request

**Giải pháp:** Phải gửi field expertise hoặc interests trong request body

## Bước 6: Test với Postman Collection

### Import collection vào Postman:
1. Open Postman
2. Import → File → Chọn `MentorMentee.postman_collection.json`
3. Set environment variable `{{token}}` với token từ login
4. Run collection để test tất cả endpoints

### Thêm requests mới cho topics:
```json
{
  "name": "Get Topics",
  "request": {
    "method": "GET",
    "url": "{{baseUrl}}/api/topics",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{token}}"
      }
    ]
  }
}
```

## Expected Results

### ✅ Successful Tests:
- Topics API trả về 15 topics
- Create mentor profile với topics → Response có full topic objects
- Create mentee profile với topics → Response có full topic objects
- Get profile → expertise/interests là array of topic objects
- Update topics → Topics cũ bị replace bởi topics mới
- Schedules API → Mentor expertise hiển thị đúng topics

### ❌ Error Cases:
- Gửi string thay vì number → Validation error
- Topic ID không tồn tại → Foreign key error
- Không gửi fullName (required) → Validation error
- Không có token → 401 Unauthorized

## Next: Frontend Integration

Sau khi test backend thành công, có thể implement frontend:
1. Component để select topics từ list
2. Gửi topic IDs khi create/update profile
3. Display topics trong profile view
