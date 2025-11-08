# Quick Reference: Posts Permission Fix

## ✅ What Changed

### Routes (src/routes/posts.routes.ts)

**Removed permission checks from:**
- `GET /api/posts` - View all posts
- `GET /api/posts/:id` - View single post  
- `GET /api/posts/:id/likes` - View post likes

**Kept permission checks for:**
- `POST /api/posts` - Create (requires `post:create`)
- `PUT /api/posts/:id` - Update (requires `post:update`)
- `DELETE /api/posts/:id` - Delete (requires `post:delete`)
- `POST /api/posts/:id/like` - Like (requires `post:like`)

## 🎯 Why

**Problem:** Routes required `post:view_any` permission, but service already filters public/private posts. This created a double-layer that blocked users from viewing public posts.

**Solution:** Remove permission check from viewing endpoints. Let service handle access control based on `isPublic` flag and ownership.

## 🔒 Security

**Still secure because:**
1. Authentication still required (JWT token)
2. Service filters by `isPublic` flag
3. Private posts only visible to owner
4. Actions (create/update/delete) still require permissions

## 📊 Access Rules

| Post Type | Owner | Other Users |
|-----------|-------|-------------|
| Public    | ✅ Can view/edit/delete | ✅ Can view only |
| Private   | ✅ Can view/edit/delete | ❌ Cannot access |

## 🧪 Quick Test

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mentee1@example.com","password":"123456"}'

# View posts (should work now without post:view_any permission)
curl -X GET http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 Files Changed

- ✅ `src/routes/posts.routes.ts` (removed 3 permission checks)

## 🎉 Impact

**Before:** Users need `post:view_any` permission to view any posts
**After:** All authenticated users can view public posts

---

**Status:** ✅ FIXED | **Priority:** HIGH | **Breaking:** No
