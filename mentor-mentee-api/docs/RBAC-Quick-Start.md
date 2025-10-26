# RBAC Quick Start Guide

## 🚀 Quick Implementation (5 minutes)

### Step 1: Generate Prisma Client & Run Migration
```bash
cd mentor-mentee-api

# Generate Prisma client with new models
npx prisma generate

# Create migration
npx prisma migrate dev --name add_rbac_system

# Seed RBAC data (permissions, roles, mappings)
npx ts-node prisma/seed-rbac.ts
```

**Expected Output:**
```
🌱 Starting RBAC seed...
📝 Creating permissions...
  ✓ schedule:create
  ✓ schedule:view_own
  ... (50+ permissions)
✅ Created 52 permissions

👥 Creating roles and assigning permissions...
  📌 Role: ADMIN (ID: 1)
  ✓ Assigned 52 permissions to ADMIN
  📌 Role: MENTOR (ID: 2)
  ✓ Assigned 28 permissions to MENTOR
  📌 Role: MENTEE (ID: 3)
  ✓ Assigned 15 permissions to MENTEE

🔄 Syncing existing users with RBAC roles...
  ✓ Synced mentor@example.com with role MENTOR
  ✓ Synced mentee@example.com with role MENTEE

✨ RBAC seed completed successfully!
```

### Step 2: Restart Server
```bash
npm run dev
```

### Step 3: Test Admin Endpoints

#### List All Permissions
```bash
curl http://localhost:3000/api/admin/permissions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### List All Roles with Permissions
```bash
curl http://localhost:3000/api/admin/permissions/roles \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Get User's Permissions
```bash
curl http://localhost:3000/api/admin/permissions/users/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Step 4: Start Using in Routes

#### Example 1: Simple Permission Check
```typescript
// src/routes/posts.routes.ts
import { authorizePermissions } from '../middleware/permission.middleware';

router.post('/',
  authenticate,
  authorizePermissions('post:create'), // ✅ New permission-based
  ctrl.createPost
);
```

#### Example 2: Ownership Check
```typescript
import prisma from '../db/client';

router.put('/:id',
  authenticate,
  authorizePermissions('post:update', {
    scope: 'own',
    getResourceOwnerId: async (req) => {
      const post = await prisma.post.findUnique({
        where: { id: Number(req.params.id) },
        select: { authorId: true }
      });
      return post?.authorId ?? null;
    }
  }),
  ctrl.updatePost
);
```

---

## 📋 Available Permissions

### Schedule Permissions
```
schedule:create
schedule:view_own
schedule:view_any
schedule:update_own
schedule:update_any
schedule:delete_own
schedule:delete_any
```

### Booking Permissions
```
booking:create
booking:view_own
booking:view_any
booking:update_own
booking:update_any
booking:cancel_own
booking:cancel_any
```

### Post Permissions
```
post:create
post:view_own
post:view_any
post:update_own
post:update_any
post:delete_own
post:delete_any
```

### Session, Feedback, Profile, etc.
See `src/utils/permissions.ts` for complete list.

---

## 🎯 Common Use Cases

### 1. Grant Extra Permission to User
```bash
# Allow specific mentee to create schedules
curl -X POST http://localhost:3000/api/admin/permissions/users/5/grant \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permissionCode": "schedule:create"}'
```

### 2. Revoke Permission from User
```bash
# Remove post delete permission from specific mentor
curl -X POST http://localhost:3000/api/admin/permissions/users/3/revoke \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permissionCode": "post:delete_own"}'
```

### 3. Remove User Override (Revert to Role Default)
```bash
curl -X DELETE http://localhost:3000/api/admin/permissions/users/5/schedule:create \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 4. Add Permission to Role
```bash
# Give all mentees ability to create posts
curl -X POST http://localhost:3000/api/admin/permissions/roles/MENTEE/add \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permissionCode": "post:create"}'
```

### 5. Check User's Effective Permissions
```bash
curl http://localhost:3000/api/admin/permissions/users/5 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:**
```json
{
  "data": {
    "user": {
      "id": 5,
      "email": "mentee@example.com",
      "role": "MENTEE",
      "roleName": "MENTEE"
    },
    "effectivePermissions": [
      "schedule:view_any",
      "booking:create",
      "booking:view_own",
      "post:create",
      "schedule:create"  // ← Override granted!
    ],
    "overrides": [
      { "code": "schedule:create", "isGranted": true }
    ]
  }
}
```

---

## 🔧 Middleware Options

### Option 1: Check Permission (No Scope)
```typescript
authorizePermissions('post:create')
// User just needs the permission
```

### Option 2: Check Permission with "any" Scope
```typescript
authorizePermissions('post:view', { scope: 'any' })
// Requires post:view_any or post:view permission
```

### Option 3: Check Permission with "own" Scope
```typescript
authorizePermissions('post:update', {
  scope: 'own',
  getResourceOwnerId: async (req) => {
    const post = await prisma.post.findUnique({
      where: { id: Number(req.params.id) }
    });
    return post?.authorId ?? null;
  }
})
// Requires post:update_own + ownership verification
// OR post:update_any (bypasses ownership check)
```

### Option 4: Check Any of Multiple Permissions
```typescript
import { authorizeAnyPermission } from '../middleware/permission.middleware';

authorizeAnyPermission(['post:update_own', 'post:update_any'])
// User needs at least one of these
```

### Option 5: Check All Permissions
```typescript
import { authorizeAllPermissions } from '../middleware/permission.middleware';

authorizeAllPermissions(['post:view_any', 'post:update_any'])
// User needs both permissions
```

---

## 🎨 Frontend Integration (Later)

### Admin Permission Management UI
Create an admin panel to:
- ✅ View all users with their roles and permissions
- ✅ Grant/revoke permissions for specific users
- ✅ View and modify role permissions
- ✅ Audit permission changes

### Sample API Calls from Frontend
```typescript
// Get user permissions
const getUserPermissions = async (userId: number) => {
  const response = await api.get(`/admin/permissions/users/${userId}`);
  return response.data;
};

// Grant permission to user
const grantPermission = async (userId: number, permissionCode: string) => {
  await api.post(`/admin/permissions/users/${userId}/grant`, {
    permissionCode
  });
};

// Revoke permission from user
const revokePermission = async (userId: number, permissionCode: string) => {
  await api.post(`/admin/permissions/users/${userId}/revoke`, {
    permissionCode
  });
};

// Get all roles
const getAllRoles = async () => {
  const response = await api.get('/admin/permissions/roles');
  return response.data.roles;
};
```

---

## 🐛 Troubleshooting

### Error: "Property 'permission' does not exist"
```bash
# Run Prisma generate
npx prisma generate
```

### Error: "Permission not found"
```bash
# Re-run seed script
npx ts-node prisma/seed-rbac.ts
```

### Error: "Forbidden"
```bash
# Check user's effective permissions
curl http://localhost:3000/api/admin/permissions/users/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Slow Permission Checks
Add caching (see RBAC-Migration-Guide.md for details)

---

## ✅ Migration Checklist

- [ ] Prisma generate completed
- [ ] Migration created and run
- [ ] RBAC seed script executed successfully
- [ ] Server restarted
- [ ] Admin endpoints accessible
- [ ] Can view permissions and roles
- [ ] Can grant/revoke permissions
- [ ] Old routes still work (backward compatible)
- [ ] New permission-based routes added
- [ ] Tests updated

---

## 📚 Next Steps

1. **Gradually migrate routes** - Update one resource at a time
2. **Add audit logging** - Track who changes what permissions
3. **Build admin UI** - Make permission management user-friendly
4. **Add caching** - Optimize performance with Redis
5. **Create permission groups** - For complex scenarios

---

## 🆘 Need Help?

- **Full Migration Guide:** `docs/RBAC-Migration-Guide.md`
- **Permission Definitions:** `src/utils/permissions.ts`
- **Service Layer:** `src/services/permission.service.ts`
- **Middleware:** `src/middleware/permission.middleware.ts`
- **Controllers:** `src/controllers/admin-permissions.controller.ts`

Happy coding! 🚀
