# 📋 SEED DATA GENERATION FORM

## Hướng dẫn sử dụng
Form này giúp bạn tạo seed data mới cho hệ thống mentor-mentee. Điền thông tin vào các mục bên dưới và chạy script tương ứng.

---

## 🎯 LOẠI SEED DATA CẦN TẠO

Chọn một hoặc nhiều:
- [ ] Users (Mentors/Mentees)
- [ ] Posts
- [ ] Schedules
- [ ] Bookings
- [ ] Sessions & Feedbacks
- [ ] Notifications
- [ ] Topics

---

## 👤 USER DATA

### Mentees

```typescript
const newMentees = [
  {
    email: 'mentee_email@example.com',
    fullName: 'Họ Tên Đầy Đủ',
    goals: 'Mục tiêu học tập của mentee này',
    interests: ['Topic 1', 'Topic 2', 'Topic 3'] // Chọn từ danh sách topics có sẵn
  },
  // Thêm mentee khác...
];
```

**Danh sách Topics có sẵn:**
- Web Development
- Mobile Development  
- Data Science
- DevOps
- Cybersecurity
- UI/UX Design
- Database
- Software Architecture
- Career Development
- Soft Skills
- Game Development
- Cloud Computing
- Blockchain
- Testing & QA
- Project Management

### Mentors

```typescript
const newMentors = [
  {
    email: 'mentor_email@example.com',
    fullName: 'Họ Tên Đầy Đủ',
    school: 'Tên trường đại học',
    degree: 'Cử nhân/Thạc sĩ/Tiến sĩ + Chuyên ngành',
    yearsExp: 5, // Số năm kinh nghiệm (number)
    bio: 'Giới thiệu chi tiết về mentor: kinh nghiệm, chuyên môn, thành tích...',
    expertise: ['Topic 1', 'Topic 2', 'Topic 3'] // Chọn từ danh sách topics
  },
  // Thêm mentor khác...
];
```

---

## 📝 POST DATA

```typescript
const newPosts = [
  {
    authorEmail: 'email_của_tác_giả@example.com', // Phải là email đã tồn tại
    title: 'Tiêu đề bài viết',
    content: `Nội dung bài viết chi tiết.
    
Có thể nhiều đoạn.

- Bullet points
- Lists
- Code examples

Markdown format supported!`,
    isPublic: true, // true = công khai, false = riêng tư
    images: [ // Optional - nếu muốn thêm ảnh
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg'
    ]
  },
  // Thêm post khác...
];
```

**Gợi ý topics cho bài viết:**
- Tutorial/How-to guides
- Best practices
- Technology comparisons
- Career advice
- Personal experiences
- Resource compilations
- Project showcases
- Learning roadmaps

---

## 📅 SCHEDULE DATA

```typescript
const newSchedules = [
  {
    mentorEmail: 'mentor@example.com', // Email của mentor
    topic: 'Tên chủ đề buổi học',
    description: 'Mô tả chi tiết nội dung buổi học: sẽ học gì, yêu cầu kiến thức, chuẩn bị gì...',
    daysFromNow: 3, // Số ngày tính từ hôm nay (1 = ngày mai, 7 = tuần sau)
    startHour: 14, // Giờ bắt đầu (0-23)
    durationHours: 2, // Thời lượng (hours)
    capacity: 3, // Số lượng mentee tối đa
    status: 'AVAILABLE' // AVAILABLE | BOOKED | CANCELLED
  },
  // Thêm schedule khác...
];
```

**Lưu ý:**
- startHour: 0-23 (24h format)
- durationHours: 1-8 (reasonable duration)
- capacity: 1-10 (reasonable class size)
- Schedule phải trong tương lai (daysFromNow >= 1)

---

## 📋 BOOKING DATA

```typescript
const newBookings = [
  {
    scheduleId: 1, // ID của schedule (kiểm tra database)
    menteeEmail: 'mentee@example.com',
    status: 'PENDING' // PENDING | CONFIRMED | CANCELLED | COMPLETED
  },
  // Thêm booking khác...
];
```

**Business Rules:**
- Một mentee không thể book cùng schedule 2 lần
- Schedule phải có status AVAILABLE để book được
- Khi booking CONFIRMED, schedule status → BOOKED
- Khi booking CANCELLED, schedule status → AVAILABLE (nếu không có booking CONFIRMED khác)

---

## 🎓 SESSION & FEEDBACK DATA

### Session
```typescript
const newSessions = [
  {
    bookingId: 1, // ID của booking đã CONFIRMED
    notes: 'Ghi chú của mentor về buổi học: nội dung đã dạy, tiến độ của mentee, đề xuất...'
  },
  // Thêm session khác...
];
```

### Feedback
```typescript
const newFeedbacks = [
  {
    sessionId: 1, // ID của session đã hoàn thành
    rating: 5, // 1-5 stars
    comment: 'Nhận xét chi tiết của mentee về buổi học, mentor, nội dung...'
  },
  // Thêm feedback khác...
];
```

**Lưu ý:**
- Một session chỉ có một feedback
- Rating: 1 (very bad) → 5 (excellent)
- Comment là optional nhưng nên có để realistic

---

## 🔔 NOTIFICATION DATA

```typescript
const newNotifications = [
  {
    userEmail: 'user@example.com',
    type: 'INFO', // INFO | SUCCESS | WARNING | ERROR
    title: 'Tiêu đề thông báo ngắn gọn',
    content: 'Nội dung chi tiết của thông báo',
    isRead: false // true = đã đọc, false = chưa đọc
  },
  // Thêm notification khác...
];
```

**Notification Types:**
- INFO: Thông tin thông thường
- SUCCESS: Hành động thành công
- WARNING: Cảnh báo
- ERROR: Lỗi cần chú ý

**Common Scenarios:**
- Booking mới/xác nhận/hủy
- Schedule được tạo/cập nhật
- Session sắp diễn ra (reminder)
- Feedback mới
- Post mới từ mentor đang follow

---

## 🎨 TOPIC DATA

```typescript
const newTopics = [
  {
    name: 'Tên Topic',
    description: 'Mô tả chi tiết về chủ đề này'
  },
  // Thêm topic khác...
];
```

**Lưu ý:**
- Topic name phải unique
- Chọn topics phù hợp với tech trends
- Không quá specific (ví dụ: "React" tốt hơn "React 18.2")

---

## 🔧 SCRIPT MẪU ĐỂ TẠO SEED

### Option 1: Tạo file seed-custom.ts

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting custom seed...\n');

  const hashedPassword = await bcrypt.hash('123456', 10);

  // Get role IDs
  const mentorRole = await prisma.role.findUnique({ where: { name: 'MENTOR' } });
  const menteeRole = await prisma.role.findUnique({ where: { name: 'MENTEE' } });

  // Get topics
  const topics = await prisma.topic.findMany();
  const topicMap = new Map(topics.map(t => [t.name, t.id]));

  // === ĐIỀN DATA TỪ FORM VÀO ĐÂY ===
  
  // Example: Create mentees
  const mentees = [
    {
      email: 'newmentee@example.com',
      fullName: 'Người Học Mới',
      goals: 'Học web development',
      interests: ['Web Development', 'Database']
    }
  ];

  for (const mentee of mentees) {
    await prisma.user.create({
      data: {
        email: mentee.email,
        password: hashedPassword,
        role: 'MENTEE',
        roleId: menteeRole!.id,
        updatedAt: new Date(),
        menteeprofile: {
          create: {
            fullName: mentee.fullName,
            goals: mentee.goals,
            interests: {
              create: mentee.interests
                .map(name => topicMap.get(name))
                .filter(id => id !== undefined)
                .map(topicId => ({ topicId }))
            }
          }
        }
      }
    });
    console.log(`✅ Created mentee: ${mentee.fullName}`);
  }

  // Example: Create posts
  const posts = [
    {
      authorEmail: 'mentor1@example.com',
      title: 'New Tutorial',
      content: 'Content here...',
      isPublic: true
    }
  ];

  for (const post of posts) {
    const author = await prisma.user.findUnique({
      where: { email: post.authorEmail }
    });
    
    if (author) {
      await prisma.post.create({
        data: {
          authorId: author.id,
          title: post.title,
          content: post.content,
          isPublic: post.isPublic,
          updatedAt: new Date()
        }
      });
      console.log(`✅ Created post: ${post.title}`);
    }
  }

  // Example: Create schedules
  const schedules = [
    {
      mentorEmail: 'mentor1@example.com',
      topic: 'Advanced React',
      description: 'Deep dive into React...',
      daysFromNow: 3,
      startHour: 14,
      durationHours: 2,
      capacity: 3
    }
  ];

  for (const schedule of schedules) {
    const mentor = await prisma.user.findUnique({
      where: { email: schedule.mentorEmail }
    });

    if (mentor) {
      const startAt = new Date();
      startAt.setDate(startAt.getDate() + schedule.daysFromNow);
      startAt.setHours(schedule.startHour, 0, 0, 0);

      const endAt = new Date(startAt);
      endAt.setHours(endAt.getHours() + schedule.durationHours);

      await prisma.schedule.create({
        data: {
          mentorId: mentor.id,
          topic: schedule.topic,
          description: schedule.description,
          startAt,
          endAt,
          capacity: schedule.capacity,
          status: 'AVAILABLE'
        }
      });
      console.log(`✅ Created schedule: ${schedule.topic}`);
    }
  }

  console.log('\n✅ Custom seed completed!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Option 2: Cập nhật seed-full.ts

Thêm data mới vào arrays hiện có trong `prisma/seed-full.ts`

---

## 📝 CHECKLIST TRƯỚC KHI SEED

- [ ] Đã chạy `npm run seed:rbac` (tạo roles)
- [ ] Đã chạy `npm run seed:topics` (tạo topics)
- [ ] Đã kiểm tra email không trùng với users hiện có
- [ ] Topics trong interests/expertise phải tồn tại trong database
- [ ] Schedule dates phải hợp lý (trong tương lai)
- [ ] Đã test với một vài records trước khi seed nhiều

---

## 🚀 CHẠY SEED

### Thêm script vào package.json:
```json
{
  "scripts": {
    "seed:full": "ts-node prisma/seed-full.ts",
    "seed:custom": "ts-node prisma/seed-custom.ts"
  }
}
```

### Chạy:
```bash
# Seed đầy đủ (recommended for first time)
npm run seed:full

# Seed custom data
npm run seed:custom

# Hoặc seed theo thứ tự:
npm run seed:rbac
npm run seed:topics
npm run seed:full
```

---

## 🎯 EXAMPLES & TEMPLATES

### Example 1: Thêm 5 mentors về AI/ML

```typescript
const aiMentors = [
  {
    email: 'ai.mentor1@example.com',
    fullName: 'Dr. Nguyễn Văn AI',
    school: 'Stanford University',
    degree: 'PhD in Machine Learning',
    yearsExp: 10,
    bio: 'AI researcher with 10 years experience in deep learning, computer vision, and NLP. Published 20+ papers in top conferences.',
    expertise: ['Data Science', 'Software Architecture', 'Testing & QA']
  },
  // ... 4 more
];
```

### Example 2: Tạo series bài viết về React

```typescript
const reactSeries = [
  {
    authorEmail: 'mentor1@example.com',
    title: 'React Basics - Part 1: Components',
    content: 'Introduction to React components...',
    isPublic: true
  },
  {
    authorEmail: 'mentor1@example.com',
    title: 'React Basics - Part 2: Props & State',
    content: 'Understanding props and state...',
    isPublic: true
  },
  // ... more parts
];
```

### Example 3: Tạo lịch dạy cho tuần tới

```typescript
const weekSchedules = [
  { mentorEmail: 'mentor1@example.com', topic: 'React', daysFromNow: 1, startHour: 14, durationHours: 2, capacity: 3 },
  { mentorEmail: 'mentor2@example.com', topic: 'Python', daysFromNow: 2, startHour: 10, durationHours: 3, capacity: 2 },
  { mentorEmail: 'mentor3@example.com', topic: 'DevOps', daysFromNow: 3, startHour: 15, durationHours: 2, capacity: 4 },
  // ... rest of week
];
```

---

## 💡 TIPS & BEST PRACTICES

1. **Realistic Data**: Tạo data giống thực tế, không quá generic
2. **Variety**: Mix different topics, experience levels, writing styles
3. **Relationships**: Đảm bảo foreign keys hợp lệ (mentorId, menteeId, etc.)
4. **Dates**: Schedule dates phải logical (không book schedule trong quá khứ)
5. **Validation**: Test với ít records trước, sau đó scale up
6. **Backup**: Backup database trước khi seed large data
7. **Idempotency**: Sử dụng `upsert` thay vì `create` khi có thể
8. **Transactions**: Wrap related creates trong transaction để đảm bảo consistency

---

## 🐛 TROUBLESHOOTING

### Error: "Unique constraint failed"
→ Email hoặc combination đã tồn tại. Đổi email hoặc xóa data cũ.

### Error: "Foreign key constraint failed"  
→ Topic/User/Schedule ID không tồn tại. Kiểm tra lại IDs hoặc emails.

### Error: "Invalid date"
→ Date format không đúng. Dùng `new Date()` hoặc ISO string.

### Seed chậm
→ Giảm số lượng records, hoặc dùng `createMany()` thay vì loop `create()`.

---

## 📚 RESOURCES

- [Prisma Seeding Docs](https://www.prisma.io/docs/guides/database/seed-database)
- [Faker.js](https://fakerjs.dev/) - Generate fake data
- [Mockaroo](https://www.mockaroo.com/) - Online data generator

---

## ✅ SUBMISSION

Sau khi điền form, tạo file seed và test:

1. Tạo file `prisma/seed-custom.ts` với data từ form
2. Add script vào `package.json`
3. Test: `npm run seed:custom`
4. Verify data trong database
5. Document những gì đã seed trong README

**Good luck! 🚀**
