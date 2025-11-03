# 🐛 PERMISSION BUG FIX - Hướng dẫn Test & Debug

## ❌ VẤN ĐỀ

User **KHÔNG có** permission `post:create` nhưng vẫn tạo được post thành công.

### User Permissions (từ `/debug/me/permissions`):
```json
{
  "effectivePermissions": [
    "schedule:view_any",
    "booking:create",
    "booking:view_own",
    "booking:cancel_own",
    "post:view_own",
    "post:view_any",
    "post:update_own",
    "post:delete_own",
    "session:view_own",
    "feedback:create",
    "feedback:view_own",
    "profile:view_own",
    "profile:update_own",
    "notification:view_own"
  ]
}
```

**Thiếu:** `post:create` ❌

---

## 🔍 NGUYÊN NHÂN

### Bug #1: Logic Middleware SAI (ĐÃ FIX)

**File:** `src/middleware/permission.middleware.ts` (dòng 107-109)

**Code CŨ (SAI):**
```typescript
const hasPermission = 
  effectivePermissions.has(requiredPermission) ||
  effectivePermissions.has(`${basePermission}_any`) ||
  effectivePermissions.has(basePermission);  // ← SAI!
```

**Vấn đề:**
- Dòng cuối check `basePermission` (ví dụ: `"post:create"`) 
- Nếu regex không match `_(own|any)$`, thì `basePermission` = `requiredPermission`
- Dòng này trở thành duplicate check và vô nghĩa
- Trong một số trường hợp edge case, có thể gây ra false positive

**Code MỚI (ĐÚNG):**
```typescript
const hasPermission = 
  effectivePermissions.has(requiredPermission) ||
  effectivePermissions.has(`${basePermission}_any`);

if (!hasPermission) {
  console.log(`[PERMISSION DENIED] User ${userId} tried to access ${requiredPermission}`);
  console.log(`  Required: ${requiredPermission}`);
  console.log(`  User has: ${Array.from(effectivePermissions).join(', ')}`);
  return forbiddenError(res, `Insufficient permissions: ${requiredPermission}`);
}
```

---

## ✅ CÁC FIX ĐÃ THỰC HIỆN

### 1. **Fix Middleware Logic**
- ✅ Xóa logic check `basePermission` không cần thiết
- ✅ Thêm console.log để debug khi permission bị denied
- ✅ Log ra permission user đang cố truy cập

### 2. **Thêm Logging vào Permission Service**
- ✅ Log role của user
- ✅ Log từng permission được add từ role
- ✅ Log user overrides (grant/revoke)
- ✅ Log final effective permissions

**File:** `src/services/permission.service.ts`

### 3. **Tạo Debug API Endpoint**
- ✅ Route mới: `GET /api/debug/me/permissions`
- ✅ Chỉ available khi `NODE_ENV !== 'production'`
- ✅ Trả về đầy đủ thông tin permissions của user hiện tại

---

## 🧪 CÁCH TEST

### Test 1: Kiểm tra permissions của user

```bash
# Login với user có vấn đề
POST http://localhost:3000/api/auth/login
{
  "email": "testmentee@example.com",
  "password": "your_password"
}

# Copy token từ response

# Gọi debug endpoint
GET http://localhost:3000/api/debug/me/permissions
Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "testmentee@example.com",
      "role": "MENTEE",
      "roleName": "MENTEE"
    },
    "effectivePermissions": [
      "schedule:view_any",
      "booking:create",
      ...
    ],
    "overrides": []
  }
}
```

### Test 2: Thử tạo post (PHẢI BỊ CHẶN)

```bash
POST http://localhost:3000/api/posts
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Test Post",
  "content": "This should be blocked"
}
```

**Expected Response (403 Forbidden):**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions: post:create"
  }
}
```

**Server Console Log:**
```
[PERMISSIONS] User 1 role: MENTEE
  [ROLE] Added: schedule:view_any
  [ROLE] Added: booking:create
  ...
[PERMISSIONS] Final effective permissions for user 1: 14 total
  schedule:view_any, booking:create, ...
  
[PERMISSION DENIED] User 1 tried to access post:create
  Required: post:create
  User has: schedule:view_any, booking:create, ...
```

### Test 3: Grant permission và test lại

```bash
# Grant permission (cần ADMIN)
POST http://localhost:3000/api/admin/permissions/users/1/grant
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "permissionCode": "post:create"
}

# Thử tạo post lại
POST http://localhost:3000/api/posts
Authorization: Bearer USER_TOKEN

{
  "title": "Test Post",
  "content": "Now this should work"
}
```

**Expected:** Status 201 Created ✅

---

## 📊 DEBUG FLOW

Khi user gọi API, hệ thống sẽ log theo flow:

```
1. User sends request → POST /api/posts
   ↓
2. authenticate middleware → Verify JWT
   ↓
3. authorizePermissions('post:create')
   ↓
4. getEffectivePermissions(userId)
   [PERMISSIONS] User 1 role: MENTEE
     [ROLE] Added: schedule:view_any
     [ROLE] Added: booking:create
     ...
   [PERMISSIONS] Final: 14 permissions
   ↓
5. Check: effectivePermissions.has('post:create')
   → FALSE
   ↓
6. Check: effectivePermissions.has('post_any')
   → FALSE
   ↓
7. [PERMISSION DENIED] Log denied + permissions
   ↓
8. Return 403 Forbidden
```

---

## 🔧 NẾU VẪN CÒN VẤN ĐỀ

### Kiểm tra:

1. **Frontend có đang cache token cũ?**
   ```javascript
   // Clear localStorage trong browser console
   localStorage.clear();
   // Login lại
   ```

2. **API server có được restart sau khi fix?**
   ```bash
   # Restart server
   npm run dev
   ```

3. **Database có đúng permissions?**
   ```sql
   -- Check role permissions
   SELECT r.name, p.code 
   FROM RolePermission rp
   JOIN Role r ON r.id = rp.roleId
   JOIN Permission p ON p.id = rp.permissionId
   WHERE r.name = 'MENTEE';
   
   -- Check user permissions
   SELECT u.email, p.code, up.isGranted
   FROM UserPermission up
   JOIN user u ON u.id = up.userId
   JOIN Permission p ON p.id = up.permissionId
   WHERE u.id = 1;
   ```

4. **Có route nào bypass middleware?**
   - Kiểm tra `src/routes/posts.routes.ts`
   - Đảm bảo tất cả routes đều có `authorizePermissions()`

5. **Frontend có gọi đúng endpoint?**
   - Check Network tab trong DevTools
   - Xem request URL và method
   - Verify response status code

---

## 📝 CHECKLIST FIX

- [x] Fix middleware logic (remove basePermission check)
- [x] Add logging to permission.service.ts
- [x] Add logging to permission.middleware.ts  
- [x] Create debug endpoint `/debug/me/permissions`
- [x] Update routes index.ts
- [ ] Test với user không có permission → Should get 403
- [ ] Test với user có permission → Should succeed
- [ ] Test grant permission → Verify works
- [ ] Test revoke permission → Verify blocked
- [ ] Remove debug logs before production
- [ ] Disable debug routes in production

---

## 🚨 LƯU Ý BẢO MẬT

1. **Debug endpoint CHỈ dùng trong development!**
   ```typescript
   if (process.env.NODE_ENV !== 'production') {
     // Debug routes here
   }
   ```

2. **Remove console.log trước khi deploy production**
   - Hoặc dùng proper logger (Winston, Pino)
   - Log level: debug trong dev, error trong prod

3. **Deny by default principle**
   - Nếu user KHÔNG có permission → BLOCK
   - KHÔNG cho phép access nếu không chắc chắn

---

## 📞 HỖ TRỢ

Nếu sau khi apply các fix mà vẫn có vấn đề:

1. Gửi full server logs khi test
2. Gửi response từ `/debug/me/permissions`
3. Gửi request body + headers của request bị lỗi
4. Check database role và permissions của user

---

**Date:** October 27, 2025
**Status:** FIXED - Đợi testing
