# Hướng Dẫn Test Chức Năng Trao Quyền/Cấp Quyền trên Postman

## 📋 Mục Lục
1. [Chuẩn Bị](#chuẩn-bị)
2. [Danh Sách API Endpoints](#danh-sách-api-endpoints)
3. [Test Cases Chi Tiết](#test-cases-chi-tiết)
4. [Kịch Bản Test Thực Tế](#kịch-bản-test-thực-tế)

---

## 🔧 Chuẩn Bị

### 1. Đăng nhập với tài khoản ADMIN
Trước tiên, bạn cần có token của một tài khoản ADMIN để thực hiện các thao tác quản lý quyền.

**Request:**
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "code": "SUCCESS",
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

⚠️ **Lưu ý:** Copy token này để sử dụng cho các request tiếp theo!

### 2. Thiết lập Authorization trong Postman
- Vào tab **Authorization**
- Chọn Type: **Bearer Token**
- Paste token vào ô **Token**

---

## 📚 Danh Sách API Endpoints

### 🔍 **Xem Thông Tin**

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| GET | `/api/admin/permissions` | Xem tất cả các quyền có sẵn |
| GET | `/api/admin/permissions/roles` | Xem tất cả các roles và quyền của chúng |
| GET | `/api/admin/permissions/roles/:roleName` | Xem quyền của một role cụ thể |
| GET | `/api/admin/permissions/users/:userId` | Xem quyền hiệu lực của user |

### ✏️ **Quản Lý Quyền Cho Role**

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| PUT | `/api/admin/permissions/roles/:roleName` | Thay thế toàn bộ quyền của role |
| POST | `/api/admin/permissions/roles/:roleName/add` | Thêm một quyền vào role |
| POST | `/api/admin/permissions/roles/:roleName/remove` | Xóa một quyền khỏi role |

### 👤 **Quản Lý Quyền Cho User Cụ Thể**

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| POST | `/api/admin/permissions/users/:userId/grant` | Cấp quyền cho user (override) |
| POST | `/api/admin/permissions/users/:userId/revoke` | Thu hồi quyền từ user (override) |
| DELETE | `/api/admin/permissions/users/:userId/:permissionCode` | Xóa override, quay về quyền mặc định của role |

---

## 🧪 Test Cases Chi Tiết

### Test Case 1: Xem Tất Cả Quyền Có Sẵn

**Mục đích:** Liệt kê tất cả các quyền trong hệ thống để biết quyền nào có thể cấp

**Request:**
```
GET http://localhost:3000/api/admin/permissions
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response:**
```json
{
  "code": "SUCCESS",
  "message": "Request successful",
  "data": {
    "total": 52,
    "permissions": {
      "schedule": [
        "schedule:create",
        "schedule:view_own",
        "schedule:view_any",
        "schedule:update_own",
        "schedule:update_any",
        "schedule:delete_own",
        "schedule:delete_any"
      ],
      "booking": [
        "booking:create",
        "booking:view_own",
        "booking:view_any",
        "booking:update_own",
        "booking:update_any",
        "booking:delete_own",
        "booking:delete_any",
        "booking:approve"
      ],
      "post": [
        "post:create",
        "post:view_own",
        "post:view_any",
        "post:update_own",
        "post:update_any",
        "post:delete_own",
        "post:delete_any",
        "post:like"
      ],
      // ... và nhiều quyền khác
    }
  }
}
```

---

### Test Case 2: Xem Tất Cả Roles và Quyền

**Mục đích:** Xem các role có trong hệ thống và quyền mặc định của chúng

**Request:**
```
GET http://localhost:3000/api/admin/permissions/roles
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response:**
```json
{
  "code": "SUCCESS",
  "message": "Request successful",
  "data": {
    "roles": [
      {
        "id": 1,
        "name": "ADMIN",
        "userCount": 2,
        "permissionCount": 52,
        "permissions": ["schedule:create", "schedule:view_own", ...]
      },
      {
        "id": 2,
        "name": "MENTOR",
        "userCount": 5,
        "permissionCount": 28,
        "permissions": ["schedule:create", "schedule:view_own", ...]
      },
      {
        "id": 3,
        "name": "MENTEE",
        "userCount": 10,
        "permissionCount": 15,
        "permissions": ["booking:create", "booking:view_own", ...]
      }
    ]
  }
}
```

---

### Test Case 3: Xem Quyền Hiệu Lực Của User

**Mục đích:** Kiểm tra quyền thực tế mà một user đang có (bao gồm cả override)

**Request:**
```
GET http://localhost:3000/api/admin/permissions/users/5
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Giải thích:** Thay `5` bằng ID của user bạn muốn kiểm tra

**Expected Response:**
```json
{
  "code": "SUCCESS",
  "message": "Request successful",
  "data": {
    "user": {
      "id": 5,
      "email": "mentor@example.com",
      "role": "MENTOR",
      "roleName": "MENTOR"
    },
    "effectivePermissions": [
      "schedule:create",
      "schedule:view_own",
      "schedule:update_own",
      "booking:view_any",
      "booking:approve",
      // ... tất cả quyền user đang có
    ],
    "overrides": [
      {
        "permissionCode": "post:delete_any",
        "granted": true,
        "createdAt": "2025-10-21T10:30:00.000Z"
      }
      // Danh sách các quyền đã được override (cấp thêm hoặc thu hồi)
    ]
  }
}
```

---

### Test Case 4: Cấp Quyền Cho User Cụ Thể

**Mục đích:** Cấp thêm một quyền đặc biệt cho user (vượt qua quyền mặc định của role)

**Kịch bản:** Bạn muốn cho phép một MENTEE cụ thể có thể tạo bài post (quyền `post:create` - thường chỉ MENTOR và ADMIN mới có)

**Request:**
```
POST http://localhost:3000/api/admin/permissions/users/8/grant
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "permissionCode": "post:create"
}
```

**Giải thích:**
- `8` là ID của user (MENTEE)
- `post:create` là quyền bạn muốn cấp

**Expected Response:**
```json
{
  "code": "SUCCESS",
  "message": "Request successful",
  "data": {
    "userId": 8,
    "permissionCode": "post:create",
    "granted": true,
    "message": "Permission post:create granted to user mentee@example.com"
  }
}
```

**Kiểm tra lại:**
```
GET http://localhost:3000/api/admin/permissions/users/8
```

Bạn sẽ thấy `post:create` xuất hiện trong `effectivePermissions` và `overrides`.

---

### Test Case 5: Thu Hồi Quyền Từ User

**Mục đích:** Thu hồi một quyền mà user đang có (thậm chí quyền mặc định của role)

**Kịch bản:** Bạn muốn cấm một MENTOR cụ thể tạo schedule mới (thu hồi quyền `schedule:create`)

**Request:**
```
POST http://localhost:3000/api/admin/permissions/users/5/revoke
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "permissionCode": "schedule:create"
}
```

**Expected Response:**
```json
{
  "code": "SUCCESS",
  "message": "Request successful",
  "data": {
    "userId": 5,
    "permissionCode": "schedule:create",
    "granted": false,
    "message": "Permission schedule:create revoked from user mentor@example.com"
  }
}
```

**Kiểm tra lại:**
```
GET http://localhost:3000/api/admin/permissions/users/5
```

Bạn sẽ thấy `schedule:create` KHÔNG có trong `effectivePermissions` nhưng có trong `overrides` với `granted: false`.

---

### Test Case 6: Xóa Override (Quay Về Quyền Mặc Định)

**Mục đích:** Xóa bỏ override để user quay về quyền mặc định của role

**Kịch bản:** Sau khi thu hồi quyền `schedule:create` từ MENTOR ở Test Case 5, bạn muốn khôi phục lại quyền mặc định của MENTOR

**Request:**
```
DELETE http://localhost:3000/api/admin/permissions/users/5/schedule:create
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response:**
```json
{
  "code": "SUCCESS",
  "message": "Request successful",
  "data": {
    "userId": 5,
    "permissionCode": "schedule:create",
    "message": "Permission override removed for user mentor@example.com. Reverted to role default."
  }
}
```

**Kiểm tra lại:**
```
GET http://localhost:3000/api/admin/permissions/users/5
```

Bạn sẽ thấy `schedule:create` quay lại `effectivePermissions` và không còn trong `overrides`.

---

### Test Case 7: Thêm Quyền Vào Role

**Mục đích:** Thêm một quyền mới vào role, áp dụng cho tất cả users có role đó

**Kịch bản:** Bạn muốn cho phép tất cả MENTEE có thể xem bài post của người khác (thêm quyền `post:view_any`)

**Request:**
```
POST http://localhost:3000/api/admin/permissions/roles/MENTEE/add
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "permissionCode": "post:view_any"
}
```

**Expected Response:**
```json
{
  "code": "SUCCESS",
  "message": "Request successful",
  "data": {
    "roleName": "MENTEE",
    "permissionCode": "post:view_any",
    "message": "Permission post:view_any added to role MENTEE"
  }
}
```

**Kiểm tra lại:**
```
GET http://localhost:3000/api/admin/permissions/roles/MENTEE
```

---

### Test Case 8: Xóa Quyền Khỏi Role

**Mục đích:** Xóa một quyền khỏi role, ảnh hưởng tất cả users có role đó

**Kịch bản:** Bạn muốn ngăn tất cả MENTEE like bài post (xóa quyền `post:like`)

**Request:**
```
POST http://localhost:3000/api/admin/permissions/roles/MENTEE/remove
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "permissionCode": "post:like"
}
```

**Expected Response:**
```json
{
  "code": "SUCCESS",
  "message": "Request successful",
  "data": {
    "roleName": "MENTEE",
    "permissionCode": "post:like",
    "message": "Permission post:like removed from role MENTEE"
  }
}
```

---

### Test Case 9: Thay Thế Toàn Bộ Quyền Của Role

**Mục đích:** Cập nhật toàn bộ quyền của một role (xóa hết và gán lại)

**⚠️ Cảnh báo:** Thao tác này sẽ XÓA TẤT CẢ quyền hiện tại và chỉ giữ lại những quyền trong request!

**Request:**
```
PUT http://localhost:3000/api/admin/permissions/roles/MENTEE
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "permissionCodes": [
    "booking:create",
    "booking:view_own",
    "schedule:view_any",
    "post:view_any",
    "post:view_own"
  ]
}
```

**Expected Response:**
```json
{
  "code": "SUCCESS",
  "message": "Request successful",
  "data": {
    "roleName": "MENTEE",
    "permissionCodes": [
      "booking:create",
      "booking:view_own",
      "schedule:view_any",
      "post:view_any",
      "post:view_own"
    ],
    "message": "Permissions updated for role MENTEE"
  }
}
```

---

## 🎬 Kịch Bản Test Thực Tế

### Kịch Bản 1: Cấp Quyền Đặc Biệt Cho "Super Mentee"

**Tình huống:** Một MENTEE xuất sắc được phép tạo và quản lý bài post như MENTOR

**Các bước:**

1. **Xác định user cần cấp quyền:**
```
GET http://localhost:3000/api/admin/permissions/users/10
```

2. **Cấp quyền tạo bài post:**
```
POST http://localhost:3000/api/admin/permissions/users/10/grant
{
  "permissionCode": "post:create"
}
```

3. **Cấp quyền sửa bài post của mình:**
```
POST http://localhost:3000/api/admin/permissions/users/10/grant
{
  "permissionCode": "post:update_own"
}
```

4. **Cấp quyền xóa bài post của mình:**
```
POST http://localhost:3000/api/admin/permissions/users/10/grant
{
  "permissionCode": "post:delete_own"
}
```

5. **Kiểm tra quyền sau khi cấp:**
```
GET http://localhost:3000/api/admin/permissions/users/10
```

---

### Kịch Bản 2: Hạn Chế Quyền Của Một Mentor Cụ Thể

**Tình huống:** Một MENTOR vi phạm nội quy, tạm thời thu hồi quyền tạo schedule và approve booking

**Các bước:**

1. **Xem quyền hiện tại:**
```
GET http://localhost:3000/api/admin/permissions/users/7
```

2. **Thu hồi quyền tạo schedule:**
```
POST http://localhost:3000/api/admin/permissions/users/7/revoke
{
  "permissionCode": "schedule:create"
}
```

3. **Thu hồi quyền duyệt booking:**
```
POST http://localhost:3000/api/admin/permissions/users/7/revoke
{
  "permissionCode": "booking:approve"
}
```

4. **Kiểm tra quyền sau khi thu hồi:**
```
GET http://localhost:3000/api/admin/permissions/users/7
```

5. **Sau khi hết thời gian phạt, khôi phục quyền:**
```
DELETE http://localhost:3000/api/admin/permissions/users/7/schedule:create
DELETE http://localhost:3000/api/admin/permissions/users/7/booking:approve
```

---

### Kịch Bản 3: Điều Chỉnh Quyền Toàn Bộ Role MENTEE

**Tình huống:** Quyết định cho phép tất cả MENTEE xem profile của người khác

**Các bước:**

1. **Xem quyền hiện tại của MENTEE:**
```
GET http://localhost:3000/api/admin/permissions/roles/MENTEE
```

2. **Thêm quyền mới:**
```
POST http://localhost:3000/api/admin/permissions/roles/MENTEE/add
{
  "permissionCode": "profile:view_any"
}
```

3. **Kiểm tra lại:**
```
GET http://localhost:3000/api/admin/permissions/roles/MENTEE
```

4. **Test với một user MENTEE bất kỳ:**
```
GET http://localhost:3000/api/admin/permissions/users/8
```

---

## 📝 Error Cases Cần Test

### 1. Cấp quyền không tồn tại
```
POST http://localhost:3000/api/admin/permissions/users/5/grant
{
  "permissionCode": "invalid:permission"
}
```
Expected: Error 400 hoặc 500 với thông báo permission không tồn tại

### 2. Cấp quyền cho user không tồn tại
```
POST http://localhost:3000/api/admin/permissions/users/99999/grant
{
  "permissionCode": "post:create"
}
```
Expected: Error 404 "User not found"

### 3. Thiếu token hoặc không phải ADMIN
```
GET http://localhost:3000/api/admin/permissions
(không có header Authorization)
```
Expected: Error 401 "Unauthorized"

### 4. User không phải ADMIN cố gắng cấp quyền
```
GET http://localhost:3000/api/admin/permissions
Authorization: Bearer MENTOR_OR_MENTEE_TOKEN
```
Expected: Error 403 "Forbidden"

---

## 🔍 Tips Kiểm Tra

### Kiểm tra quyền đã được áp dụng thực tế
Sau khi cấp/thu hồi quyền, bạn nên test bằng cách:

1. **Đăng nhập với user đã được cấp quyền**
2. **Thử thực hiện hành động tương ứng**

Ví dụ: Sau khi cấp quyền `post:create` cho MENTEE (userId: 8):

```
# 1. Login as that MENTEE
POST http://localhost:3000/api/auth/login
{
  "email": "mentee@example.com",
  "password": "password123"
}

# 2. Try to create a post with MENTEE token
POST http://localhost:3000/api/posts
Authorization: Bearer MENTEE_TOKEN
{
  "title": "Test Post",
  "content": "This is a test post"
}
```

Nếu thành công → quyền đã được áp dụng ✅

---

## 📊 Checklist Test Đầy Đủ

- [ ] Xem tất cả quyền có sẵn
- [ ] Xem tất cả roles và quyền
- [ ] Xem quyền của user cụ thể
- [ ] Cấp quyền cho user (grant)
- [ ] Thu hồi quyền từ user (revoke)
- [ ] Xóa override (revert to role default)
- [ ] Thêm quyền vào role
- [ ] Xóa quyền khỏi role
- [ ] Thay thế toàn bộ quyền của role
- [ ] Test với token không phải ADMIN (should fail)
- [ ] Test với token hết hạn (should fail)
- [ ] Test với user ID không tồn tại (should fail)
- [ ] Test với permission code không hợp lệ (should fail)
- [ ] Verify quyền thực tế bằng cách thực hiện hành động

---

## 🎯 Kết Luận

Hệ thống RBAC cho phép bạn:
- ✅ Cấp/thu hồi quyền cho từng user cụ thể (override)
- ✅ Quản lý quyền toàn bộ role (ảnh hưởng tất cả users)
- ✅ Xem quyền hiệu lực của mỗi user
- ✅ Linh hoạt điều chỉnh quyền truy cập

**Lưu ý quan trọng:**
- Override user có độ ưu tiên cao hơn quyền mặc định của role
- Thay đổi quyền role sẽ ảnh hưởng TẤT CẢ users có role đó
- Nên backup database trước khi thực hiện thay đổi lớn
