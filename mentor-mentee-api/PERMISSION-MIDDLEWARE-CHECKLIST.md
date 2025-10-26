# Permission Middleware Implementation Checklist

## 🔴 CRITICAL: Các routes THIẾU middleware permission

### ✅ Posts Routes (FIXED)
- [x] GET /api/posts - `post:view_any`
- [x] GET /api/posts/:id - `post:view_any`
- [x] POST /api/posts - `post:create`
- [x] PUT /api/posts/:id - `post:update` (own scope)
- [x] DELETE /api/posts/:id - `post:delete` (own scope)
- [x] POST /api/posts/:id/like - `post:like`
- [x] GET /api/posts/:id/likes - `post:view_any`

### ⚠️ Schedules Routes (CẦN SỬA)
- [ ] POST /api/schedules - `schedule:create`
- [ ] GET /api/schedules - `schedule:view_any`
- [ ] GET /api/schedules/my-schedules - `schedule:view_own`
- [ ] GET /api/schedules/:id - `schedule:view_any`
- [ ] PATCH /api/schedules/:id - `schedule:update` (own scope)
- [ ] DELETE /api/schedules/:id - `schedule:delete` (own scope)

### ⚠️ Bookings Routes (CẦN SỬA)
- [ ] POST /api/bookings - `booking:create`
- [ ] PATCH /api/bookings/:id/confirm - `booking:update` (own scope - check mentorId)
- [ ] PATCH /api/bookings/:id/cancel - `booking:cancel` (own scope)
- [ ] GET /api/bookings/my - `booking:view_own`

### ⚠️ Sessions Routes (CẦN SỬA)
- [ ] POST /api/sessions/start - `session:create`
- [ ] POST /api/sessions/end - `session:update` (own scope)
- [ ] GET /api/sessions/my - `session:view_own`

### ⚠️ Feedbacks Routes (CẦN SỬA)
- [ ] POST /api/feedbacks - `feedback:create`
- [ ] GET /api/feedbacks/mentor/:mentorId - `feedback:view_any`
- [ ] GET /api/feedbacks/my - `feedback:view_own`

### ⚠️ Profiles Routes (CẦN SỬA)
- [ ] POST /api/profiles/mentor - `profile:update_own`
- [ ] GET /api/profiles/mentor/:userId - `profile:view_any` hoặc `profile:view_own` (own scope)
- [ ] POST /api/profiles/mentee - `profile:update_own`
- [ ] GET /api/profiles/mentee/:userId - `profile:view_any` hoặc `profile:view_own` (own scope)

### ✅ Auth Routes (KHÔNG CẦN)
- [x] POST /api/auth/register - Public
- [x] POST /api/auth/login - Public
- [x] GET /api/auth/me - Chỉ cần authenticate

### ✅ Admin Permission Routes (ĐÃ CÓ)
- [x] Tất cả routes đã có middleware kiểm tra role ADMIN

### ✅ OTP & Password Reset Routes (KHÔNG CẦN)
- [x] Public endpoints

## 📋 Tóm tắt

- **Tổng số route groups:** 9
- **Đã fix:** 2 (Posts, Admin, Auth/OTP)
- **Cần sửa:** 5 (Schedules, Bookings, Sessions, Feedbacks, Profiles)
- **Mức độ ưu tiên:** 🔴 CRITICAL

## 🔧 Cách sửa

Thêm import và middleware vào mỗi routes file:

```typescript
import { authorizePermissions } from '../middleware/permission.middleware';
import prisma from '../db/client';

// Example cho route có scope 'own'
router.put('/:id', 
  authorizePermissions('resource:update', {
    scope: 'own',
    getResourceOwnerId: async (req) => {
      const resource = await prisma.resource.findUnique({ 
        where: { id: Number(req.params.id) } 
      });
      return resource?.ownerId ?? null;
    }
  }), 
  controller.update
);
```

## ⚡ Next Steps

1. Sửa schedules.routes.ts
2. Sửa bookings.routes.ts
3. Sửa sessions.routes.ts
4. Sửa feedbacks.routes.ts
5. Sửa profiles.routes.ts
6. Test tất cả endpoints trên Postman
7. Verify RBAC hoạt động đúng
