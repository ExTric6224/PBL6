# Hướng dẫn Test Posts API

## Tổng quan

Chức năng Posts cho phép mentor và mentee:
- ✅ Đăng bài viết (public hoặc private)
- ✅ Xem feed bài viết public
- ✅ Like/Unlike bài viết
- ✅ Tìm kiếm bài viết
- ✅ Quản lý bài viết của chính mình

## Cài đặt Postman Collection

### Bước 1: Import Collection
1. Mở Postman
2. Click **Import** 
3. Chọn file `postman/Posts-API-Collection.json`
4. Collection "Mentor-Mentee API - Posts" sẽ xuất hiện

### Bước 2: Cấu hình Environment
1. Tạo Environment mới tên "Local Development"
2. Thêm variables:
   ```
   baseUrl: http://localhost:3000/api
   accessToken: (sẽ tự động set sau khi login)
   postId: (sẽ tự động set sau khi tạo post)
   ```

## Luồng Test Cơ bản

### 1. Authentication
```
POST /auth/login
{
  "email": "mentor@example.com", 
  "password": "password123"
}
```
**Kết quả mong đợi**: accessToken tự động lưu vào collection variables

### 2. Tạo Post Public
```
POST /posts
{
  "title": "Kinh nghiệm học lập trình hiệu quả",
  "content": "Xin chào các bạn! Hôm nay mình muốn chia sẻ...",
  "isPublic": true
}
```
**Kết quả mong đợi**: 
- Status: 201 Created
- postId tự động lưu vào collection variables

### 3. Xem Feed Posts
```
GET /posts?page=1&limit=10
```
**Kết quả mong đợi**: Danh sách posts public với pagination info

### 4. Like Post
```
POST /posts/:postId/like
```
**Kết quả mong đợi**: 
- Lần 1: `{"action": "liked"}`
- Lần 2: `{"action": "unliked"}` (toggle)

## Chi tiết các Endpoints

### 📝 Posts Management

#### 1. Tạo Post
- **Endpoint**: `POST /api/posts`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "title": "string (1-200 chars, required)",
    "content": "string (10-10000 chars, required)", 
    "isPublic": "boolean (optional, default: true)"
  }
  ```
- **Response**: Post object với author info và like count

#### 2. Lấy danh sách Posts
- **Endpoint**: `GET /api/posts`
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**:
  - `page`: number (default: 1)
  - `limit`: number (1-50, default: 10)
  - `authorId`: number (optional, filter by author)
  - `search`: string (optional, search in title/content)
- **Response**: Array of posts + pagination info

#### 3. Lấy Post theo ID
- **Endpoint**: `GET /api/posts/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Post object với full details

#### 4. Cập nhật Post
- **Endpoint**: `PUT /api/posts/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: Partial post object
- **Permission**: Chỉ author của post
- **Response**: Updated post object

#### 5. Xóa Post
- **Endpoint**: `DELETE /api/posts/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Permission**: Chỉ author của post
- **Response**: Success message

### ❤️ Likes Management

#### 1. Like/Unlike Post (Toggle)
- **Endpoint**: `POST /api/posts/:id/like`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{"action": "liked|unliked"}`

#### 2. Lấy danh sách Likes
- **Endpoint**: `GET /api/posts/:id/likes`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Array of users who liked + like count

## Quy tắc Logic

### Visibility Rules
1. **Public Posts**: Ai cũng xem được
2. **Private Posts**: Chỉ author xem được
3. **Feed chung**: Chỉ hiển thị public posts
4. **Profile cá nhân**: Hiển thị tất cả posts của chính mình

### Like Rules
1. **Public Posts**: Ai cũng like được
2. **Private Posts**: Chỉ author like được (và chỉ author thấy)
3. **Toggle behavior**: Like rồi thì unlike, chưa like thì like

### Authorization Rules
1. **Tạo post**: Cần login (mentor hoặc mentee)
2. **Xem posts**: Cần login
3. **Update/Delete**: Chỉ author của post
4. **Like**: Cần login, post phải public (trừ own post)

## Test Cases Quan trọng

### ✅ Happy Path
1. Login → Tạo post → Xem feed → Like post → Update post → Delete post

### ⚠️ Edge Cases
1. **Validation errors**: Title/content rỗng hoặc quá dài
2. **Permission denied**: Update/delete post của người khác
3. **Not found**: Truy cập post không tồn tại
4. **Private post access**: Người khác xem private post
5. **Like private post**: Like private post của người khác

### 🔐 Security Tests
1. **No token**: Gọi API không có Authorization header
2. **Invalid token**: Gọi API với token sai
3. **Expired token**: Gọi API với token hết hạn

## Expected Responses

### Success Response Format
```json
{
  "success": true,
  "data": { /* post object or array */ },
  "message": "Optional success message",
  "pagination": { /* for list endpoints */ }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": { /* validation errors if any */ }
}
```

### Post Object Structure
```json
{
  "id": 1,
  "title": "Post title",
  "content": "Post content",
  "isPublic": true,
  "authorId": 1,
  "createdAt": "2025-01-25T10:00:00.000Z",
  "updatedAt": "2025-01-25T10:00:00.000Z",
  "author": {
    "id": 1,
    "email": "user@example.com",
    "role": "MENTOR",
    "mentorProfile": {
      "fullName": "John Doe",
      "school": "XYZ University"
    }
  },
  "likesCount": 5,
  "isLikedByCurrentUser": true
}
```

## Troubleshooting

### Common Issues

1. **"Property 'post' does not exist"**
   - Chạy: `npx prisma generate`
   - Restart development server

2. **"Unauthorized" errors**
   - Kiểm tra accessToken đã được set chưa
   - Thử login lại để lấy token mới

3. **"Validation failed"**
   - Kiểm tra title (1-200 chars)
   - Kiểm tra content (10-10000 chars)
   - Kiểm tra isPublic là boolean

4. **"Post not found"**
   - Kiểm tra postId có tồn tại không
   - Nếu là private post, chỉ author mới xem được

### Debug Commands
```bash
# Kiểm tra database
npx prisma studio

# Xem logs server
npm run dev

# Reset database (nếu cần)
npx prisma migrate reset
```

## Workflow Thực tế

### Scenario 1: Mentor chia sẻ kinh nghiệm
1. Mentor login
2. Tạo post public về kinh nghiệm
3. Mentees xem trong feed và like
4. Mentor update post với thông tin thêm

### Scenario 2: Mentee tạo ghi chú cá nhân
1. Mentee login  
2. Tạo post private cho ghi chú học tập
3. Chỉ mentee đó xem được
4. Có thể chuyển thành public sau

### Scenario 3: Community interaction
1. Nhiều users tạo posts
2. Xem feed chung (chỉ public posts)
3. Search posts theo từ khóa
4. Like các posts hữu ích
5. Xem profile của author để thấy các posts khác

**Chúc bạn test thành công! 🚀**
