# 🚀 Quick Seed Reference

## One-liner cho Fresh Database

```bash
npx prisma migrate reset && npm run seed:rbac && npm run seed:topics && npm run seed:full
```

## Test Login Credentials

### Admin
```
Email: admin@example.com
Password: Admin@123456
```

### Mentors (password: 123456)
```
mentor1@example.com - Trần Minh Tuấn (Full-stack Dev, 7 years)
mentor2@example.com - Lê Thị Mai (AI/ML, 10 years)
mentor3@example.com - Nguyễn Hoàng Nam (DevOps, 6 years)
mentor4@example.com - Phạm Thanh Hà (UI/UX, 8 years)
mentor5@example.com - Vũ Đức Anh (Cybersecurity, 9 years)
mentor6@example.com - Đặng Thị Lan (Game Dev, 5 years)
mentor7@example.com - Hoàng Quốc Việt (Tech Lead, 12 years)
mentor8@example.com - Bùi Thị Ngọc (Career Coach, 15 years)
mentor9@example.com - Trịnh Văn Đức (Blockchain, 8 years)
mentor10@example.com - Lương Thị Hương (Mobile Dev, 6 years)
```

### Mentees (password: 123456)
```
mentee1@example.com - Nguyễn Văn An
mentee2@example.com - Trần Thị Bình
mentee3@example.com - Lê Văn Cường
mentee4@example.com - Phạm Thị Diễm
mentee5@example.com - Hoàng Văn Em
mentee6@example.com - Vũ Thị Phương
mentee7@example.com - Đỗ Văn Giang
mentee8@example.com - Ngô Thị Hà
```

## Quick Commands

```bash
# View database in browser
npx prisma studio

# Reset everything
npx prisma migrate reset

# Seed in order
npm run seed:rbac    # 1. Roles & Permissions
npm run seed:topics  # 2. Topics
npm run seed:admin   # 3. Admin (optional)
npm run seed:full    # 4. Full data

# Fix roleId issues
npm run fix:roleids
```

## What's Included in seed:full

| Entity | Count | Details |
|--------|-------|---------|
| Mentees | 8 | With profiles & topic interests |
| Mentors | 10 | With profiles & expertise |
| Posts | 13 | Tutorials, guides, experiences |
| Schedules | 13 | Upcoming sessions (various topics) |
| Bookings | 4 | Mix of pending & confirmed |
| Sessions | 1 | With mentor notes |
| Feedbacks | 1 | 5-star rating |
| Notifications | 4 | Various types |

## Topics Available

1. Web Development
2. Mobile Development
3. Data Science
4. DevOps
5. Cybersecurity
6. UI/UX Design
7. Database
8. Software Architecture
9. Career Development
10. Soft Skills
11. Game Development
12. Cloud Computing
13. Blockchain
14. Testing & QA
15. Project Management

## Test Scenarios

### As Mentee (mentee1@example.com)
- ✅ View all mentors and their expertise
- ✅ Browse available schedules
- ✅ Book a schedule (confirmed booking exists)
- ✅ View posts from mentors
- ✅ Give feedback on completed session

### As Mentor (mentor1@example.com)
- ✅ Create new schedules
- ✅ View bookings from mentees
- ✅ Confirm/cancel bookings
- ✅ Create posts (tutorials, guides)
- ✅ View session history

### As Admin (admin@example.com)
- ✅ Manage all users
- ✅ Manage roles & permissions
- ✅ View all system data
- ✅ Moderate posts

## Troubleshooting

**Error: Role not found**
→ Run: `npm run seed:rbac`

**Error: Topic not found**
→ Run: `npm run seed:topics`

**Error: roleId is null**
→ Run: `npm run fix:roleids`

**Want to add more data?**
→ See: `SEED-DATA-FORM.md`

## Pro Tips

1. **Prisma Studio** is your friend for visual database inspection
2. Use **mentee1** and **mentor1** for quick testing
3. All passwords are `123456` in development
4. Topics must exist before creating profiles with interests/expertise
5. Roles must exist before creating users

---

**Need more details?** → Read [SEEDING-GUIDE.md](./SEEDING-GUIDE.md)
