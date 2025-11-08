# Topics System Implementation

## Đã hoàn thành:

### 1. Database Schema
- ✅ Tạo model `Topic` với các field: id, name, description, createdAt, updatedAt
- ✅ Tạo model `MentorTopicExpertise` - bảng trung gian cho mentor và topics
- ✅ Tạo model `MenteeTopicInterest` - bảng trung gian cho mentee và topics
- ✅ Xóa field `expertise` (LONGTEXT) từ `mentorprofile`
- ✅ Xóa field `interests` (LONGTEXT) từ `menteeprofile`
- ✅ Thêm relations many-to-many giữa profiles và topics

### 2. Migration
- ✅ Tạo migration `add_topics_normalization`
- ✅ Apply migration thành công

### 3. Seed Data
- ✅ Tạo script `seed-topics.ts` với 15 topics:
  - Web Development
  - Mobile Development
  - Data Science
  - DevOps
  - Cybersecurity
  - UI/UX Design
  - Database
  - Software Architecture
  - Career Development
  - Soft Skills
  - Game Development
  - Cloud Computing
  - Blockchain
  - Testing & QA
  - Project Management
- ✅ Chạy seed thành công

### 4. API Backend

#### Topics API
- ✅ Service: `TopicsService` 
  - `getAllTopics()` - Lấy tất cả topics
  - `getTopicById(id)` - Lấy topic theo ID
  - `createTopic()` - Tạo topic mới
- ✅ Controller: `TopicsController`
  - `GET /api/topics` - Lấy danh sách topics
- ✅ Routes: Đã thêm vào `/api/topics`

#### Profiles API Updates
- ✅ Schema validation: Cập nhật để validate topic IDs (array of numbers)
- ✅ Service updates:
  - **createOrUpdateMentorProfile**: 
    - Nhận `expertise` là array of topic IDs
    - Xóa expertise cũ và tạo mới qua `MentorTopicExpertise`
    - Return profile với expertise đầy đủ (array of topic objects)
  - **getMentorProfile**: 
    - Include expertise relations
    - Transform để return array of topic objects
  - **createOrUpdateMenteeProfile**: 
    - Nhận `interests` là array of topic IDs
    - Xóa interests cũ và tạo mới qua `MenteeTopicInterest`
    - Return profile với interests đầy đủ (array of topic objects)
  - **getMenteeProfile**: 
    - Include interests relations
    - Transform để return array of topic objects

### 5. Bug Fixes
- ✅ Fix schema transform để parse topic IDs từ string/array thành numbers
- ✅ Fix service để return đúng format khi create/update profiles
- ✅ Fix topics service để include `updatedAt` khi create topic
- ✅ Đảm bảo topics được fetch lại sau khi create/update để có data mới nhất

## API Endpoints:

### Topics
```
GET /api/topics
- Lấy danh sách tất cả topics
- Auth: Required
- Response: Array of { id, name, description, createdAt, updatedAt }
```

### Mentor Profile
```
POST /api/profiles/mentor
- Tạo/cập nhật profile mentor
- Body: { fullName, avatar?, school?, expertise: [topicId1, topicId2], degree?, yearsExp?, bio? }
- expertise: Array of topic IDs
- Response: Profile với expertise là array of topic objects

GET /api/profiles/mentor/:userId
- Lấy mentor profile
- Response: Profile với expertise là array of topic objects
```

### Mentee Profile
```
POST /api/profiles/mentee
- Tạo/cập nhật profile mentee
- Body: { fullName, avatar?, goals?, interests: [topicId1, topicId2] }
- interests: Array of topic IDs
- Response: Profile với interests là array of topic objects

GET /api/profiles/mentee/:userId
- Lấy mentee profile
- Response: Profile với interests là array of topic objects
```

## Cách sử dụng:

### 1. Lấy danh sách topics:
```bash
GET /api/topics
Authorization: Bearer <token>
```

### 2. Tạo/update mentor profile với topics:
```bash
POST /api/profiles/mentor
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Doe",
  "school": "MIT",
  "expertise": [1, 3, 7],  // Web Development, Data Science, Database
  "degree": "Master",
  "yearsExp": 5,
  "bio": "Experienced developer"
}
```

### 3. Tạo/update mentee profile với topics:
```bash
POST /api/profiles/mentee
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Jane Smith",
  "goals": "Learn web development",
  "interests": [1, 6]  // Web Development, UI/UX Design
}
```

## Lưu ý khi test:
1. Phải có token authentication
2. Topic IDs phải tồn tại trong database (1-15)
3. Khi update profile, topics cũ sẽ bị xóa và thay bằng topics mới
4. Response sẽ trả về full topic objects (không chỉ IDs)
