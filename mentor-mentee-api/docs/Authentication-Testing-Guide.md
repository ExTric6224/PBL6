# Hướng dẫn Test Authentication trên Postman

## 🚀 Bước 1: Chuẩn bị

### Đảm bảo Server đang chạy
```bash
cd d:\Documents\test\mentor-mentee-api
npm run dev
```
Server sẽ chạy tại: `http://localhost:3000`

### Import Postman Collection
1. Mở Postman
2. Click **Import** 
3. Chọn file `postman/Authentication-Collection.json`
4. Collection "Mentor-Mentee API - Authentication" sẽ xuất hiện

## 🧪 Bước 2: Luồng Test Cơ bản

### 1. Kiểm tra API Health
```
GET /api/health
```
**Kết quả mong đợi**: 
```json
{
  "ok": true,
  "timestamp": "2025-08-26T16:07:48.123Z"
}
```

### 2. Đăng ký User mới
```
POST /api/auth/register
{
  "email": "mentor.test@example.com",
  "password": "password123", 
  "role": "MENTOR"
}
```
**Kết quả mong đợi**: 
- Status: 201 Created
- accessToken tự động lưu vào collection variables
- User object trả về với id, email, role

### 3. Đăng nhập
```
POST /api/auth/login
{
  "email": "mentor.test@example.com",
  "password": "password123"
}
```
**Kết quả mong đợi**: 
- Status: 200 OK
- accessToken mới được tạo
- User info được trả về

### 4. Test Protected Route
```
GET /api/profiles/me
Headers: Authorization: Bearer {token}
```
**Kết quả mong đợi**: 
- Status: 200 OK
- User profile được trả về

## 📋 Chi tiết các Test Cases

### ✅ Happy Path Tests

#### Đăng ký thành công
- **Endpoint**: `POST /auth/register`
- **Body**: Email, password, role hợp lệ
- **Expected**: 201 Created, user object + access token

#### Đăng nhập thành công  
- **Endpoint**: `POST /auth/login`
- **Body**: Email và password đúng
- **Expected**: 200 OK, user object + access token

#### Truy cập route có authentication
- **Endpoint**: `GET /profiles/me`
- **Headers**: Authorization Bearer token
- **Expected**: 200 OK, user data

### ⚠️ Error Cases Tests

#### Validation Errors
1. **Email không hợp lệ**: `invalid-email` → 400 Bad Request
2. **Password quá ngắn**: `123` → 400 Bad Request  
3. **Role không hợp lệ**: `INVALID_ROLE` → 400 Bad Request

#### Business Logic Errors
1. **Email đã tồn tại**: Đăng ký email trùng → 409 Conflict
2. **Sai password**: Login với password sai → 401 Unauthorized
3. **User không tồn tại**: Login email không có → 401 Unauthorized

#### Authentication Errors
1. **Không có token**: Truy cập protected route → 401 Unauthorized
2. **Token không hợp lệ**: Bearer invalid_token → 401 Unauthorized
3. **Token hết hạn**: Bearer expired_token → 401 Unauthorized

## 🔧 Sử dụng Seeded Data

Database đã có sẵn 2 users từ seed data:

### Mentor
- **Email**: `mentor@example.com`
- **Password**: `password123`
- **Role**: MENTOR

### Mentee  
- **Email**: `mentee@example.com`
- **Password**: `password123`
- **Role**: MENTEE

Bạn có thể login trực tiếp với các accounts này mà không cần đăng ký mới.

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "MENTOR",
      "createdAt": "2025-08-26T16:00:00.000Z",
      "updatedAt": "2025-08-26T16:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Registration successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Email already exists",
  "details": null
}
```

### Validation Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_string",
      "expected": "string",
      "received": "undefined",
      "path": ["email"],
      "message": "Required"
    }
  ]
}
```

## 🎯 Test Scenarios Quan trọng

### Scenario 1: Đăng ký và sử dụng hệ thống
1. Đăng ký mentor mới
2. Login với account vừa tạo  
3. Truy cập protected route để lấy profile
4. Verify token hoạt động đúng

### Scenario 2: Edge cases
1. Thử đăng ký với email trùng → Expect 409
2. Login với password sai → Expect 401
3. Truy cập API không có token → Expect 401
4. Truy cập API với token sai → Expect 401

### Scenario 3: Role-based testing
1. Đăng ký MENTOR → Check role trong response
2. Đăng ký MENTEE → Check role trong response  
3. Login cả 2 loại → Verify role được preserve

## 🐛 Troubleshooting

### Server không khởi động được
```bash
# Kiểm tra port 3000 có bị chiếm không
netstat -ano | findstr :3000

# Nếu bị chiếm, kill process hoặc đổi port trong .env
```

### Database connection lỗi
```bash
# Kiểm tra MySQL đã chạy chưa
# Kiểm tra .env file có DATABASE_URL đúng không
```

### Postman không save token
- Kiểm tra Test script trong request có chạy không
- Verify collection variables được set đúng
- Xem Console tab để debug

### API trả về 404
- Đảm bảo server đang chạy
- Check baseUrl trong collection variables
- Verify routes đã được register đúng

## 🎯 Tips Test hiệu quả

1. **Chạy theo thứ tự**: Health check → Register → Login → Protected routes
2. **Sử dụng Collection Runner**: Chạy toàn bộ tests tự động
3. **Check Console**: Xem logs để debug khi có lỗi
4. **Pre-request Scripts**: Set up data trước khi test
5. **Environment Variables**: Dùng để switch giữa dev/staging/prod

## 🔄 Automation với Collection Runner

1. Click Collection → Run
2. Chọn Environment: "No Environment" (dùng collection variables)
3. Click "Run Mentor-Mentee API - Authentication"
4. Xem kết quả tests tự động

Tất cả tests sẽ chạy tuần tự và báo cáo pass/fail cho từng case.

**Chúc bạn test thành công! 🎉**
