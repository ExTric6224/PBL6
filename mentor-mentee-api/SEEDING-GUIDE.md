# 🌱 Database Seeding Guide

Hướng dẫn seed database với dữ liệu mẫu cho hệ thống Mentor-Mentee Platform.

## 📋 Tổng quan

Hệ thống có nhiều seed files khác nhau:

| File | Mục đích | Khi nào dùng |
|------|----------|--------------|
| `seed-rbac.ts` | Roles & Permissions | **BẮT BUỘC** - Chạy đầu tiên |
| `seed-topics.ts` | Topics (chủ đề) | **BẮT BUỘC** - Chạy sau RBAC |
| `seed-admin.ts` | Tài khoản Admin | Tạo admin account |
| `seed.ts` | Dữ liệu cơ bản | Development environment |
| `seed-full.ts` | Dữ liệu đầy đủ | **RECOMMENDED** - Complete data |

## 🚀 Quick Start

### Lần đầu setup database:

```bash
# 1. Chạy migrations
npm run migrate

# 2. Seed RBAC (roles & permissions) - BẮT BUỘC
npm run seed:rbac

# 3. Seed Topics - BẮT BUỘC  
npm run seed:topics

# 4. Seed Admin account (optional)
npm run seed:admin

# 5. Seed full data (recommended)
npm run seed:full
```

### Reset và seed lại:

```bash
# Option 1: Reset database và seed lại tất cả
npx prisma migrate reset
npm run seed:rbac
npm run seed:topics
npm run seed:full

# Option 2: Chỉ seed lại data (giữ migrations)
npm run seed:full
```

## 📦 Chi tiết từng Seed File

### 1. seed-rbac.ts - RBAC System

**Mục đích:** Tạo Roles và Permissions cho hệ thống

**Tạo:**
- 3 Roles: ADMIN, MENTOR, MENTEE
- 40+ Permissions (posts, schedules, bookings, profiles, etc.)
- RolePermissions mapping

**Chạy:**
```bash
npm run seed:rbac
```

**Lưu ý:** 
- Phải chạy đầu tiên
- Sync existing users với roles

### 2. seed-topics.ts - Topics

**Mục đích:** Tạo danh sách chủ đề (topics) cho mentor/mentee

**Tạo:**
- 15 Topics: Web Development, Mobile Development, Data Science, DevOps, Cybersecurity, UI/UX Design, Database, Software Architecture, Career Development, Soft Skills, Game Development, Cloud Computing, Blockchain, Testing & QA, Project Management

**Chạy:**
```bash
npm run seed:topics
```

### 3. seed-admin.ts - Admin Account

**Mục đích:** Tạo tài khoản admin

**Tạo:**
- 1 Admin user
  - Email: `admin@example.com`
  - Password: `Admin@123456`
  - Role: ADMIN

**Chạy:**
```bash
npm run seed:admin
```

**Lưu ý:** Đổi password sau khi login lần đầu!

### 4. seed-full.ts - Complete Dataset

**Mục đích:** Seed dữ liệu đầy đủ cho development/testing

**Tạo:**
- ✅ 8 Mentees với profiles và interests
- ✅ 10 Mentors với profiles và expertise
- ✅ 13 Posts (tutorials, guides, experiences)
- ✅ 13 Schedules (upcoming sessions)
- ✅ 4 Bookings (pending & confirmed)
- ✅ 1 Session với notes
- ✅ 1 Feedback (5 stars)
- ✅ 4 Notifications
- ✅ Likes trên posts

**Chạy:**
```bash
npm run seed:full
```

**Login credentials:**
- Mentees: `mentee1@example.com` - `mentee8@example.com`
- Mentors: `mentor1@example.com` - `mentor10@example.com`
- Password: `123456` (cho tất cả)

## 👥 Seed Data Details

### Mentees (8 users)

| Email | Tên | Quan tâm |
|-------|-----|----------|
| mentee1@example.com | Nguyễn Văn An | Web Dev, Mobile Dev |
| mentee2@example.com | Trần Thị Bình | Data Science, Software Architecture |
| mentee3@example.com | Lê Văn Cường | DevOps, Cloud Computing |
| mentee4@example.com | Phạm Thị Diễm | UI/UX, Web Dev |
| mentee5@example.com | Hoàng Văn Em | Cybersecurity, Database |
| mentee6@example.com | Vũ Thị Phương | Game Dev, Software Architecture |
| mentee7@example.com | Đỗ Văn Giang | Career Dev, Software Architecture |
| mentee8@example.com | Ngô Thị Hà | Blockchain, Web Dev |

### Mentors (10 users)

| Email | Tên | Chuyên môn | Kinh nghiệm |
|-------|-----|------------|-------------|
| mentor1@example.com | Trần Minh Tuấn | Full-stack Dev | 7 năm |
| mentor2@example.com | Lê Thị Mai | AI/ML | 10 năm |
| mentor3@example.com | Nguyễn Hoàng Nam | DevOps | 6 năm |
| mentor4@example.com | Phạm Thanh Hà | UI/UX Design | 8 năm |
| mentor5@example.com | Vũ Đức Anh | Cybersecurity | 9 năm |
| mentor6@example.com | Đặng Thị Lan | Game Dev | 5 năm |
| mentor7@example.com | Hoàng Quốc Việt | Tech Lead | 12 năm |
| mentor8@example.com | Bùi Thị Ngọc | Career Coach | 15 năm |
| mentor9@example.com | Trịnh Văn Đức | Blockchain | 8 năm |
| mentor10@example.com | Lương Thị Hương | Mobile Dev | 6 năm |

### Posts (13 bài viết)

Đa dạng topics:
- React Hooks, TypeScript Best Practices
- Machine Learning for Beginners
- Docker vs Kubernetes
- UI/UX Principles
- Cybersecurity 101
- Unity Game Development
- System Design Interview
- Career Path
- Web3 & Blockchain
- React Native vs Flutter
- Personal learning experiences

### Schedules (13 buổi học)

Topics bao gồm:
- React Hooks Deep Dive
- Neural Networks
- Docker & Kubernetes
- UI/UX Workshop
- Web Security
- Unity Basics
- System Design Practice
- Interview Preparation
- Smart Contract Development
- React Native Tutorial

## 🔧 Custom Seeding

Muốn tạo seed data tùy chỉnh? Xem file **SEED-DATA-FORM.md** để có:
- Template form đầy đủ
- Examples cho từng loại data
- Script boilerplate
- Best practices
- Troubleshooting guide

## 📊 Kiểm tra Seed Data

Sau khi seed, kiểm tra database:

```bash
# Prisma Studio - GUI tool
npx prisma studio

# Hoặc query trực tiếp
npx prisma db execute --file check-data.sql
```

Hoặc test qua API:
```bash
# Get all mentors
curl http://localhost:3000/api/profiles/mentors

# Get all topics
curl http://localhost:3000/api/topics

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mentee1@example.com","password":"123456"}'
```

## ⚠️ Important Notes

### Foreign Key Dependencies

Thứ tự seed quan trọng:
1. **Roles** (RBAC) - Users cần roleId
2. **Topics** - Profiles cần topics
3. **Users** - Phải có users trước
4. **Profiles** - Gắn với users
5. **Posts, Schedules** - Cần authorId/mentorId
6. **Bookings** - Cần scheduleId & menteeId
7. **Sessions** - Cần bookingId
8. **Feedbacks** - Cần sessionId

### Password Security

**Development:**
- Default password: `123456` (easy to remember)
- Hash với bcrypt

**Production:**
- ❌ KHÔNG dùng seed-full.ts
- Tạo admin bằng script riêng
- Enforce strong password policy
- Require password change on first login

### Data Cleanup

Seed-full.ts sẽ **XÓA** data cũ:
- ✅ Xóa: Mentees, Mentors, Posts, Schedules, Bookings, Sessions, Feedbacks
- ❌ KHÔNG xóa: Admin users, Roles, Permissions, Topics

Nếu muốn giữ data cũ, comment out phần cleanup trong seed file.

## 🛠 Troubleshooting

### Error: "Role not found"
```
❌ Roles not found! Please run: npm run seed:rbac
```
**Fix:** Chạy `npm run seed:rbac` trước

### Error: "Topics not found"
```
❌ Topics not found! Please run: npm run seed:topics
```
**Fix:** Chạy `npm run seed:topics` trước

### Error: "Unique constraint failed"
```
Unique constraint failed on the fields: (`email`)
```
**Fix:** Email đã tồn tại. Xóa user cũ hoặc đổi email trong seed file

### Error: "Foreign key constraint failed"
```
Foreign key constraint failed on the field: `roleId`
```
**Fix:** 
1. Kiểm tra roles đã được seed chưa
2. Chạy `npm run fix:roleids` để fix existing users

### Seed chạy chậm
**Fix:**
- Giảm số lượng records
- Dùng `createMany()` thay vì loop `create()`
- Tắt logging

## 📝 Scripts Available

```json
{
  "seed": "ts-node prisma/seed.ts",           // Basic seed
  "seed:rbac": "ts-node prisma/seed-rbac.ts", // RBAC only
  "seed:admin": "ts-node prisma/seed-admin.ts", // Admin only
  "seed:topics": "ts-node prisma/seed-topics.ts", // Topics only
  "seed:full": "ts-node prisma/seed-full.ts",   // Complete data
  "fix:roleids": "ts-node scripts/fix-user-roleids.ts" // Fix null roleIds
}
```

## 🎯 Recommended Workflow

### Development
```bash
# Initial setup
npm run migrate
npm run seed:rbac
npm run seed:topics
npm run seed:full

# Reset when needed
npx prisma migrate reset
npm run seed:rbac
npm run seed:topics
npm run seed:full
```

### Testing
```bash
# Clean slate for each test suite
npx prisma migrate reset --skip-seed
npm run seed:rbac
npm run seed:topics
# Test với ít data hơn nếu cần
```

### Production
```bash
# NEVER seed full data in production!
npm run migrate
npm run seed:rbac
npm run seed:topics
npm run seed:admin
# Users register naturally
```

## 📚 Resources

- [Prisma Seeding Docs](https://www.prisma.io/docs/guides/database/seed-database)
- [SEED-DATA-FORM.md](./SEED-DATA-FORM.md) - Custom seeding guide
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI

---

**Happy Seeding! 🌱**
