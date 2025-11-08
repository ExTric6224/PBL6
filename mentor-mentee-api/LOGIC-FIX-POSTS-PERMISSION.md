# 🔧 Logic Fix: Posts Permission Check

## ❌ Vấn đề trước khi fix

### Mô tả
Routes yêu cầu permission `post:view_any` để xem posts, nhưng service logic lại filter theo `isPublic`. Điều này tạo ra **inconsistency**:

- ❌ Nếu user **KHÔNG có** `post:view_any` permission → Bị block ngay tại middleware
- ❌ Service logic về public posts **KHÔNG BAO GIỜ ĐƯỢC THỰC THI**
- ❌ Users không thể xem **bất kỳ post nào**, kể cả public posts
- ❌ Logic không phù hợp với requirement: "Public posts nên được mọi người xem"

### Code cũ (routes)
```typescript
// ❌ SAI: Yêu cầu permission để xem posts
router.get('/', authorizePermissions('post:view_any'), postsController.getPosts);
router.get('/:id', authorizePermissions('post:view_any'), postsController.getPostById);
router.get('/:id/likes', authorizePermissions('post:view_any'), postsController.getPostLikes);
```

### Logic trong service (không bao giờ được chạy nếu không có permission)
```typescript
// Service đã có logic đúng nhưng không bao giờ được sử dụng
if (currentUserId && authorId && authorId === currentUserId) {
  // User xem posts của chính mình - hiển thị tất cả
  where.authorId = authorId;
} else {
  // Xem posts của người khác - chỉ hiển thị public ✅
  where.isPublic = true;
}
```

---

## ✅ Giải pháp đã áp dụng

### Triết lý
1. **Public posts** = Bất kỳ authenticated user nào cũng có thể xem
2. **Private posts** = Chỉ author có thể xem
3. **Permission check** = Chỉ cần cho actions: CREATE, UPDATE, DELETE, LIKE

### Code mới (routes)
```typescript
// ✅ ĐÚNG: Không cần permission để xem posts
// Authentication vẫn required, nhưng không cần specific permission
router.get('/', postsController.getPosts);
router.get('/:id', postsController.getPostById);
router.get('/:id/likes', postsController.getPostLikes);

// ✅ Vẫn giữ permission cho actions
router.post('/', authorizePermissions('post:create'), postsController.createPost);
router.put('/:id', authorizePermissions('post:update', {scope: 'own'}), ...);
router.delete('/:id', authorizePermissions('post:delete', {scope: 'own'}), ...);
router.post('/:id/like', authorizePermissions('post:like'), ...);
```

### Access Control Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    GET /api/posts                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
                  ┌─────────────────┐
                  │  Authentication │ ← JWT token required
                  │   (middleware)   │
                  └─────────────────┘
                            ↓
                  ┌─────────────────┐
                  │ NO Permission   │ ← ✅ Bỏ qua permission check
                  │     Check       │
                  └─────────────────┘
                            ↓
                  ┌─────────────────┐
                  │ Service Logic   │ ← Access control ở đây
                  └─────────────────┘
                            ↓
        ┌─────────────────────────────────────┐
        │                                     │
        ↓                                     ↓
┌──────────────┐                    ┌──────────────┐
│ Public Posts │                    │ Own Posts    │
│ (isPublic=1) │                    │ (authorId =  │
│              │                    │  currentUser)│
│ ✅ All users  │                    │ ✅ All posts  │
│   can view   │                    │   (public +  │
│              │                    │   private)   │
└──────────────┘                    └──────────────┘
```

### Service Layer Protection
Service vẫn có logic bảo vệ:

```typescript
// In getPostById()
if (!post.isPublic && currentUserId !== post.authorId) {
  throw new Error('Access denied'); // ✅ Chặn private posts của người khác
}

// In getPosts()
if (currentUserId && authorId && authorId === currentUserId) {
  where.authorId = authorId; // ✅ Hiện tất cả posts của chính mình
} else {
  where.isPublic = true; // ✅ Chỉ hiện public posts của người khác
}
```

---

## 🎯 Kết quả

### Trước khi fix
- ❌ Users không có `post:view_any` permission → Không xem được posts
- ❌ Phải grant permission cho TẤT CẢ users để họ xem posts
- ❌ Không phù hợp với concept "public posts"

### Sau khi fix
- ✅ Tất cả authenticated users có thể xem public posts
- ✅ Private posts chỉ author xem được
- ✅ Permission chỉ cần cho actions quan trọng (create/update/delete)
- ✅ Logic nhất quán giữa routes và service
- ✅ Phù hợp với business requirements

---

## 📊 Permission Matrix (Sau khi fix)

| Action | Public Post | Own Private Post | Other's Private Post | Permission Required |
|--------|-------------|------------------|----------------------|---------------------|
| View   | ✅ Yes      | ✅ Yes           | ❌ No                | ❌ No               |
| Create | N/A         | N/A              | N/A                  | ✅ `post:create`    |
| Update | ❌ No       | ✅ Yes           | ❌ No                | ✅ `post:update`    |
| Delete | ❌ No       | ✅ Yes           | ❌ No                | ✅ `post:delete`    |
| Like   | ✅ Yes      | ✅ Yes           | ❌ No                | ✅ `post:like`      |

---

## 🧪 Test Cases

### Test 1: View public posts (Any authenticated user)
```bash
# Login as any user
POST /api/auth/login
{
  "email": "mentee1@example.com",
  "password": "123456"
}

# View all public posts - Should work ✅
GET /api/posts
Authorization: Bearer <token>

# Expected: Return all public posts + user's own posts
```

### Test 2: View specific public post
```bash
# Should work for any authenticated user ✅
GET /api/posts/1
Authorization: Bearer <token>
```

### Test 3: View private post (not owner)
```bash
# Login as user A
# Try to view user B's private post
GET /api/posts/999
Authorization: Bearer <token>

# Expected: 403 Forbidden - "Access denied" ✅
```

### Test 4: View own posts (including private)
```bash
# View posts with authorId = currentUserId
GET /api/posts?authorId=<currentUserId>
Authorization: Bearer <token>

# Expected: Return ALL posts (public + private) of current user ✅
```

### Test 5: Like post requires permission
```bash
# User WITHOUT post:like permission
POST /api/posts/1/like
Authorization: Bearer <token>

# Expected: 403 Forbidden - "Insufficient permissions" ✅
```

---

## 🔒 Security Notes

1. **Authentication vẫn bắt buộc**: Tất cả routes vẫn cần `authenticate` middleware
2. **Service layer protection**: Logic access control được implement ở service layer
3. **Permission cho actions**: Create/Update/Delete vẫn cần permission
4. **Public ≠ Unprotected**: Public posts chỉ có nghĩa là "visible to authenticated users"

---

## 📝 Migration Notes

### Không cần database migration
- ✅ Chỉ thay đổi code logic
- ✅ Không ảnh hưởng đến database schema
- ✅ Không cần update permissions trong database

### Cần test lại
- ✅ Test viewing public posts
- ✅ Test viewing private posts
- ✅ Test viewing own posts
- ✅ Test create/update/delete permissions

---

## 🎉 Summary

**Fixed inconsistency** giữa route-level permission check và service-level access control.

**Result**: 
- Public posts giờ có thể xem bởi tất cả authenticated users
- Logic nhất quán và dễ hiểu
- Không cần grant `post:view_any` permission cho tất cả users
- Security vẫn được đảm bảo ở service layer

**Files changed**:
- ✅ `src/routes/posts.routes.ts` - Bỏ permission check cho GET endpoints
- ✅ Service layer (`src/services/posts.service.ts`) - Giữ nguyên logic access control
