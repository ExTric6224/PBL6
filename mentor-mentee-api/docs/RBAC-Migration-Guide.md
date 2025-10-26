# RBAC Migration Guide

## Overview
This guide will help you migrate from simple role-based authorization to a full RBAC (Role-Based Access Control) system with granular permissions.

## What's Changed

### Before (Simple Role-Based)
```typescript
// Only check user role
authorize(['ADMIN', 'MENTOR'])
```

### After (Permission-Based RBAC)
```typescript
// Check specific permission
authorizePermissions('schedule:create')

// Check permission with ownership
authorizePermissions('post:update', {
  scope: 'own',
  getResourceOwnerId: async (req) => {
    const post = await prisma.post.findUnique({...});
    return post?.authorId;
  }
})
```

## Migration Steps

### Step 1: Run Prisma Migration

```bash
# Navigate to API directory
cd mentor-mentee-api

# Generate Prisma Client with new models
npx prisma generate

# Create and run migration
npx prisma migrate dev --name add_rbac_tables

# This will create:
# - Role table
# - Permission table
# - RolePermission junction table
# - UserPermission junction table
```

### Step 2: Seed RBAC Data

```bash
# Run RBAC seed script
npx ts-node prisma/seed-rbac.ts
```

This will:
- ✅ Create all permission definitions (~50+ permissions)
- ✅ Create roles (ADMIN, MENTOR, MENTEE)
- ✅ Assign default permissions to each role
- ✅ Sync existing users with their RBAC roles

### Step 3: Update Environment (Optional)

Add to `.env` if you want to enable permission caching:

```env
# Permission cache TTL in seconds (default: 300 = 5 minutes)
PERMISSION_CACHE_TTL=300

# Enable permission caching with Redis (optional)
REDIS_URL=redis://localhost:6379
ENABLE_PERMISSION_CACHE=true
```

### Step 4: Update Routes (Gradually)

You can migrate routes gradually. Both old and new authorization work together:

#### Example: Posts Routes

**Before:**
```typescript
// src/routes/posts.routes.ts
import { authorize } from '../middleware/auth.middleware';

router.post('/', 
  authenticate, 
  authorize(['ADMIN', 'MENTOR', 'MENTEE']),
  ctrl.createPost
);

router.put('/:id',
  authenticate,
  authorize(['ADMIN']), // Only admin can update any post
  ctrl.updatePost
);
```

**After:**
```typescript
// src/routes/posts.routes.ts
import { authorizePermissions } from '../middleware/permission.middleware';
import prisma from '../db/client';

router.post('/', 
  authenticate, 
  authorizePermissions('post:create'), // Any user with post:create permission
  ctrl.createPost
);

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
  }), // Users can update their own posts, admins can update any
  ctrl.updatePost
);

router.delete('/:id',
  authenticate,
  authorizePermissions('post:delete', {
    scope: 'own',
    getResourceOwnerId: async (req) => {
      const post = await prisma.post.findUnique({
        where: { id: Number(req.params.id) },
        select: { authorId: true }
      });
      return post?.authorId ?? null;
    }
  }),
  ctrl.deletePost
);
```

#### Example: Schedules Routes

**Before:**
```typescript
// src/routes/schedules.routes.ts
router.post('/',
  authenticate,
  authorize(['MENTOR']), // Only mentors
  ctrl.createSchedule
);
```

**After:**
```typescript
// src/routes/schedules.routes.ts
import { authorizePermissions } from '../middleware/permission.middleware';

router.post('/',
  authenticate,
  authorizePermissions('schedule:create'), // More flexible
  ctrl.createSchedule
);

router.get('/',
  authenticate,
  authorizePermissions('schedule:view_any'), // Can be granted to specific users
  ctrl.listSchedules
);

router.get('/:id',
  authenticate,
  authorizePermissions('schedule:view', {
    scope: 'own',
    getResourceOwnerId: async (req) => {
      const schedule = await prisma.schedule.findUnique({
        where: { id: Number(req.params.id) },
        select: { mentorId: true }
      });
      return schedule?.mentorId ?? null;
    }
  }),
  ctrl.getSchedule
);
```

### Step 5: Add Admin Permission Management Routes

Create new route file:

```typescript
// src/routes/admin-permissions.routes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as ctrl from '../controllers/admin-permissions.controller';

const router = Router();

// Only ADMIN role can manage permissions
router.use(authenticate);
router.use(authorize(['ADMIN']));

// User permission management
router.post('/users/:userId/grant', ctrl.grantPermissionToUser);
router.post('/users/:userId/revoke', ctrl.revokePermissionFromUser);
router.delete('/users/:userId/:permissionCode', ctrl.removeUserOverride);
router.get('/users/:userId', ctrl.getUserPermissions);

// Role permission management
router.get('/roles', ctrl.listAllRoles);
router.get('/roles/:roleName', ctrl.getPermissionsForRole);
router.put('/roles/:roleName', ctrl.setPermissionsForRole);
router.post('/roles/:roleName/add', ctrl.addPermissionToRoleHandler);
router.post('/roles/:roleName/remove', ctrl.removePermissionFromRoleHandler);

// Permission listing
router.get('/', ctrl.listAllPermissions);

export default router;
```

Register in main routes:

```typescript
// src/routes/index.ts
import adminPermissionsRoutes from './admin-permissions.routes';

router.use('/admin/permissions', adminPermissionsRoutes);
```

### Step 6: Test Permission System

#### Test Default Permissions
```bash
# Test as MENTOR
curl -X POST http://localhost:3000/api/schedules \
  -H "Authorization: Bearer <mentor_token>" \
  -H "Content-Type: application/json" \
  -d '{"topic": "Test", "startAt": "..."}'

# Should work - MENTOR has schedule:create permission
```

#### Test Permission Override
```bash
# Grant extra permission to specific mentee
curl -X POST http://localhost:3000/api/admin/permissions/users/5/grant \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"permissionCode": "schedule:create"}'

# Now mentee can create schedules too!
```

#### Test Permission Revoke
```bash
# Revoke permission from mentor
curl -X POST http://localhost:3000/api/admin/permissions/users/3/revoke \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"permissionCode": "schedule:delete_own"}'

# Mentor can no longer delete their own schedules
```

## Permission Naming Convention

Format: `resource:action` or `resource:action_scope`

Examples:
- `post:create` - Create posts
- `post:view_own` - View own posts
- `post:view_any` - View any posts
- `post:update_own` - Update own posts
- `post:update_any` - Update any posts (admin-level)
- `schedule:create` - Create schedules
- `booking:cancel_own` - Cancel own bookings

## Default Role Permissions

### ADMIN
- All permissions (full access)

### MENTOR
- Create, view, update, delete own schedules
- View any schedules
- View bookings for their schedules
- Create, view, update sessions
- Create, view feedback
- Create, view, update, delete own posts
- View any posts
- View, update own profile
- View any profiles

### MENTEE
- View any schedules (to book)
- Create, view, cancel own bookings
- View own sessions
- Create, view own feedback
- Create, view, update, delete own posts
- View any posts
- View, update own profile
- View any profiles

## Admin API Endpoints

### List All Permissions
```
GET /api/admin/permissions
```

### List All Roles
```
GET /api/admin/permissions/roles
```

### Get Role Permissions
```
GET /api/admin/permissions/roles/MENTOR
```

### Set Role Permissions (Replace All)
```
PUT /api/admin/permissions/roles/MENTOR
Body: { "permissionCodes": ["schedule:create", "post:create", ...] }
```

### Add Permission to Role
```
POST /api/admin/permissions/roles/MENTOR/add
Body: { "permissionCode": "booking:view_any" }
```

### Remove Permission from Role
```
POST /api/admin/permissions/roles/MENTOR/remove
Body: { "permissionCode": "booking:view_any" }
```

### Grant Permission to User (Override)
```
POST /api/admin/permissions/users/5/grant
Body: { "permissionCode": "schedule:create" }
```

### Revoke Permission from User (Override Deny)
```
POST /api/admin/permissions/users/5/revoke
Body: { "permissionCode": "schedule:delete_own" }
```

### Remove User Override (Revert to Role Default)
```
DELETE /api/admin/permissions/users/5/schedule:create
```

### Get User's Effective Permissions
```
GET /api/admin/permissions/users/5
```

Response:
```json
{
  "data": {
    "user": {
      "id": 5,
      "email": "user@example.com",
      "role": "MENTEE",
      "roleName": "MENTEE"
    },
    "effectivePermissions": [
      "schedule:view_any",
      "booking:create",
      "schedule:create"  // Granted override
    ],
    "overrides": [
      { "code": "schedule:create", "isGranted": true }
    ]
  }
}
```

## Performance Optimization

### Option 1: In-Memory Cache (Simple)
```typescript
// Add to permission.service.ts
const permissionCache = new Map<number, { permissions: Set<string>, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getEffectivePermissions(userId: number): Promise<Set<string>> {
  const cached = permissionCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }
  
  // ... fetch from DB ...
  
  permissionCache.set(userId, { permissions: result, timestamp: Date.now() });
  return result;
}
```

### Option 2: Redis Cache (Production)
```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export async function getEffectivePermissions(userId: number): Promise<Set<string>> {
  const cacheKey = `permissions:user:${userId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return new Set(JSON.parse(cached));
  }
  
  // ... fetch from DB ...
  
  await redis.setex(cacheKey, 300, JSON.stringify(Array.from(result)));
  return result;
}

// Bust cache when permissions change
export async function bustPermissionCache(userId: number) {
  await redis.del(`permissions:user:${userId}`);
}
```

## Rollback Plan

If you need to rollback:

1. Keep old `authorize()` middleware working
2. Don't remove `role` enum from User model yet
3. Can switch routes back to old authorization
4. To fully rollback:
   ```bash
   npx prisma migrate dev --name rollback_rbac
   # Manually remove Role, Permission tables from migration
   ```

## Testing Checklist

- [ ] All permissions seeded correctly
- [ ] Existing users synced with RBAC roles
- [ ] ADMIN can access all endpoints
- [ ] MENTOR can create schedules
- [ ] MENTEE can create bookings
- [ ] Users can only update/delete their own resources
- [ ] Permission override works (grant/revoke)
- [ ] Admin permission management endpoints work
- [ ] Performance is acceptable (add caching if needed)

## Common Issues

### Issue: Prisma Client not updated
```bash
npx prisma generate
```

### Issue: Migration failed
```bash
# Reset database (development only!)
npx prisma migrate reset
npx ts-node prisma/seed-rbac.ts
```

### Issue: Permission denied unexpectedly
```bash
# Check user's effective permissions
curl GET http://localhost:3000/api/admin/permissions/users/USER_ID \
  -H "Authorization: Bearer <admin_token>"
```

### Issue: Slow permission checks
- Implement caching (see Performance Optimization)
- Add database indices (already included in schema)

## Next Steps

1. ✅ Complete migration
2. Gradually update all routes to use `authorizePermissions`
3. Build admin UI for permission management
4. Add audit logging for permission changes
5. Consider adding permission groups/policies for complex scenarios

## Support

For issues or questions:
1. Check console logs for errors
2. Verify database tables created correctly
3. Check that seed script ran successfully
4. Test with curl/Postman before debugging code
