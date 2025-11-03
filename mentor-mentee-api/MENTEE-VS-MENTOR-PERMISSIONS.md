# 📊 SO SÁNH PERMISSIONS: MENTEE vs MENTOR

## 🎯 **TÓM TẮT KHÁC BIỆT**

| Resource | MENTEE | MENTOR |
|----------|--------|--------|
| **Schedule** | ❌ Không thể tạo<br>✅ Chỉ xem (view_any) | ✅ Tạo, xem, sửa, xóa (own)<br>✅ Xem tất cả (view_any) |
| **Booking** | ✅ Tạo, xem, hủy (own) | ✅ Xem, sửa, hủy (own)<br>✅ Xem tất cả (view_any)<br>✅ **Approve** bookings |
| **Post** | ❌ **KHÔNG thể tạo**<br>✅ Xem, like | ✅ **Tạo, xem, sửa, xóa (own)**<br>✅ Xem tất cả (view_any)<br>✅ Like |
| **Session** | ✅ Chỉ xem (own) | ✅ Tạo, xem, sửa (own) |
| **Feedback** | ✅ Tạo, xem (own) | ✅ Tạo, xem (own)<br>✅ Xem tất cả (view_any) |
| **Profile** | ✅ Xem, sửa (own)<br>✅ Xem tất cả (view_any) | ✅ Xem, sửa (own)<br>✅ Xem tất cả (view_any) |
| **Notification** | ✅ Xem, cập nhật (own) | ✅ Xem, cập nhật (own) |

---

## 📝 **CHI TIẾT PERMISSIONS**

### 🟢 **MENTOR Permissions** (29 permissions)

#### **Schedule Management** (5 permissions)
```javascript
✅ schedule:create         // Tạo lịch mentor
✅ schedule:view_own       // Xem lịch của mình
✅ schedule:view_any       // Xem tất cả lịch
✅ schedule:update_own     // Sửa lịch của mình
✅ schedule:delete_own     // Xóa lịch của mình
```

#### **Booking Management** (5 permissions)
```javascript
✅ booking:view_own        // Xem booking của mình
✅ booking:view_any        // Xem tất cả bookings
✅ booking:update_own      // Sửa booking của mình
✅ booking:approve         // Approve/confirm bookings (QUAN TRỌNG)
✅ booking:cancel_own      // Hủy booking của mình
```

#### **Session Management** (3 permissions)
```javascript
✅ session:create          // Tạo session
✅ session:view_own        // Xem session của mình
✅ session:update_own      // Cập nhật session
```

#### **Feedback** (3 permissions)
```javascript
✅ feedback:create         // Tạo feedback
✅ feedback:view_own       // Xem feedback của mình
✅ feedback:view_any       // Xem tất cả feedback
```

#### **Posts** (6 permissions) ⭐
```javascript
✅ post:create             // TẠO POST
✅ post:view_own           // Xem post của mình
✅ post:view_any           // Xem tất cả posts
✅ post:update_own         // Sửa post của mình
✅ post:delete_own         // Xóa post của mình
✅ post:like               // Like posts
```

#### **Profile** (3 permissions)
```javascript
✅ profile:view_own        // Xem profile của mình
✅ profile:view_any        // Xem tất cả profiles
✅ profile:update_own      // Sửa profile của mình
```

#### **Notifications** (2 permissions)
```javascript
✅ notification:view_own   // Xem thông báo của mình
✅ notification:update_own // Đánh dấu đã đọc
```

---

### 🔵 **MENTEE Permissions** (15 permissions THEO CODE)

#### **Schedule Viewing** (1 permission)
```javascript
✅ schedule:view_any       // CHỈ xem lịch, KHÔNG tạo được
```

#### **Booking Management** (3 permissions)
```javascript
✅ booking:create          // Đặt lịch với mentor
✅ booking:view_own        // Xem booking của mình
✅ booking:cancel_own      // Hủy booking của mình
```

#### **Session** (1 permission)
```javascript
✅ session:view_own        // Xem session của mình
```

#### **Feedback** (2 permissions)
```javascript
✅ feedback:create         // Đánh giá mentor
✅ feedback:view_own       // Xem feedback của mình
```

#### **Posts** (3 permissions) ⚠️ **QUAN TRỌNG**
```javascript
❌ post:create             // KHÔNG CÓ - KHÔNG thể tạo post
✅ post:view_own           // Xem post của mình
✅ post:view_any           // Xem tất cả posts
✅ post:like               // Like posts
```

**COMMENT TRONG CODE:**
```typescript
// Posts - MENTEE không được tạo/update/delete post, chỉ xem và like
```

#### **Profile** (3 permissions)
```javascript
✅ profile:view_own        // Xem profile của mình
✅ profile:view_any        // Xem profiles khác
✅ profile:update_own      // Sửa profile của mình
```

#### **Notifications** (2 permissions)
```javascript
✅ notification:view_own   // Xem thông báo
✅ notification:update_own // Đánh dấu đã đọc
```

---

## 🚨 **VẤN ĐỀ PHÁT HIỆN**

### **Permissions TRONG CODE** (src/utils/permissions.ts)
```typescript
MENTEE: [
  // ...
  PERMISSIONS.POST_VIEW_OWN,
  PERMISSIONS.POST_VIEW_ANY,
  PERMISSIONS.POST_LIKE,
  // ❌ KHÔNG CÓ POST_CREATE
]
```

### **Permissions TRONG DATABASE** (từ server log)
```
[ROLE] Added: post:create    ← ⚠️ CÓ THÊM!
[ROLE] Added: post:view_own
[ROLE] Added: post:view_any
[ROLE] Added: post:update_own    ← ⚠️ CÓ THÊM!
[ROLE] Added: post:delete_own    ← ⚠️ CÓ THÊM!
```

### **KẾT LUẬN**

❌ **Database đã bị MODIFY không khớp với code!**

Có ai đó đã:
1. Grant thêm `post:create` vào role MENTEE
2. Grant thêm `post:update_own` vào role MENTEE  
3. Grant thêm `post:delete_own` vào role MENTEE

**NGUYÊN NHÂN CÓ THỂ:**
- Chạy migration/seed không đúng version
- Ai đó manually update database
- Seed script bị lỗi hoặc chạy nhiều lần
- Testing rồi quên revert lại

---

## ✅ **CÁCH FIX**

### **Option 1: Reseed Database** (Khuyến nghị)

```bash
# Backup database trước
mysqldump -u root myapp > backup.sql

# Reset và seed lại
npx prisma migrate reset --force
npx ts-node prisma/seed-rbac.ts
```

### **Option 2: Manually Remove Permissions**

```bash
# Gọi API admin để remove permissions không đúng
POST /api/admin/permissions/roles/MENTEE/remove
{
  "permissionCode": "post:create"
}

POST /api/admin/permissions/roles/MENTEE/remove
{
  "permissionCode": "post:update_own"
}

POST /api/admin/permissions/roles/MENTEE/remove
{
  "permissionCode": "post:delete_own"
}
```

### **Option 3: SQL Query Trực Tiếp**

```sql
-- Xóa permissions không đúng khỏi role MENTEE
DELETE rp FROM RolePermission rp
JOIN Role r ON r.id = rp.roleId
JOIN Permission p ON p.id = rp.permissionId
WHERE r.name = 'MENTEE' 
  AND p.code IN ('post:create', 'post:update_own', 'post:delete_own');
```

---

## 📋 **PERMISSIONS SAU KHI FIX**

### **MENTEE nên có (15 permissions):**
```
schedule:view_any
booking:create
booking:view_own
booking:cancel_own
session:view_own
feedback:create
feedback:view_own
post:view_own          ← Chỉ xem
post:view_any          ← Chỉ xem
post:like              ← Chỉ like
profile:view_own
profile:view_any
profile:update_own
notification:view_own
notification:update_own
```

### **MENTOR có (29 permissions):**
```
schedule:create        ← Có
schedule:view_own
schedule:view_any
schedule:update_own
schedule:delete_own
booking:view_own
booking:view_any
booking:update_own
booking:approve        ← Quan trọng
booking:cancel_own
session:create         ← Có
session:view_own
session:update_own
feedback:create
feedback:view_own
feedback:view_any
post:create            ← Có
post:view_own
post:view_any
post:update_own        ← Có
post:delete_own        ← Có
post:like
profile:view_own
profile:view_any
profile:update_own
notification:view_own
notification:update_own
```

---

## 🎯 **LOGIC NGHIỆP VỤ**

### **Tại sao MENTEE không thể tạo Post?**

1. **Posts = Kiến thức/Kinh nghiệm chia sẻ**
   - Mentor là người có kinh nghiệm → Viết posts chia sẻ
   - Mentee là người học → Đọc posts

2. **Phân quyền rõ ràng:**
   - Mentor: Người tạo nội dung (Content Creator)
   - Mentee: Người tiêu thụ nội dung (Consumer)

3. **Tránh spam:**
   - Nếu Mentee cũng tạo posts → Khó kiểm soát chất lượng
   - Chỉ Mentor mới được share kinh nghiệm

---

**Ngày cập nhật:** 27/10/2025
