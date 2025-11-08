# Topics Feature - Frontend Quick Start Guide

## Cập nhật hoàn tất ✅

Frontend đã được cập nhật để sử dụng Topics feature:

### Files đã tạo mới:
- ✅ `src/types/topic.ts` - Type definition cho Topic
- ✅ `src/services/topicApi.ts` - API service để fetch topics
- ✅ `src/components/Topics/TopicSelector.tsx` - Component chọn topics
- ✅ `src/components/Topics/TopicSelector.css` - Styles cho TopicSelector

### Files đã cập nhật:
- ✅ `src/types/profile.ts` - Đổi expertise/interests từ string[] sang Topic[]
- ✅ `src/types/schedule.ts` - Đổi mentor expertise sang Topic[]
- ✅ `src/components/Profile/ProfileForm.tsx` - Dùng TopicSelector thay vì text input
- ✅ `src/components/Schedules/ScheduleList.tsx` - Hiển thị mentor expertise dạng tags
- ✅ `src/components/Schedules/ScheduleList.css` - Styles cho expertise tags

## Cách test Frontend

### 1. Chạy Frontend
```bash
cd mentor-mentee-frontend
npm start
```

### 2. Test Mentor Profile với Topics

**Bước 1: Login as Mentor**
- Email: `mentor1@example.com`
- Password: `123456`

**Bước 2: Đi tới Profile**
- Click vào "Profile" trong navigation

**Bước 3: Chọn Topics**
- Click vào "Expertise" selector
- Dropdown sẽ hiện ra với 15 topics có sẵn:
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

**Bước 4: Select multiple topics**
- Check vào các topics bạn muốn (ví dụ: Web Development, Data Science, Database)
- Topics đã chọn sẽ hiện dạng blue tags
- Click ✖ để remove topic

**Bước 5: Submit Profile**
- Điền các trường khác (Full Name, School, Bio, etc.)
- Click "Create Profile" hoặc "Update Profile"
- Verify: Topics được lưu và hiển thị

**Bước 6: Update Topics**
- Mở lại Profile form
- Topics đã chọn sẽ được load tự động
- Thay đổi selection (remove/add topics)
- Submit lại
- Verify: Changes được save

### 3. Test Mentee Profile với Topics

**Bước 1: Login as Mentee**
- Logout mentor
- Login với:
  - Email: `mentee1@example.com`
  - Password: `123456`

**Bước 2: Đi tới Profile**
- Click "Profile"

**Bước 3: Chọn Interests**
- Click vào "Interests" selector
- Chọn các topics bạn quan tâm
- Interests hiện dạng tags

**Bước 4: Submit**
- Điền Full Name và Goals
- Click "Create Profile"
- Verify topics được save

### 4. Test Schedule Display với Mentor Expertise

**Bước 1: Mentor tạo schedule**
- Login as mentor (đã có profile với topics)
- Đi tới "Schedules"
- Click "Create Schedule"
- Điền thông tin và submit

**Bước 2: Mentee xem schedules**
- Login as mentee
- Đi tới "Schedules"
- Xem danh sách schedules

**Bước 3: Verify Expertise Display**
- Mỗi schedule card sẽ hiện:
  - 👨‍🏫 Mentor: [Mentor name]
  - **Expertise:** [Purple gradient tags]
- Hover vào tag để xem description
- Topics được format đẹp với gradient color

## UI Changes

### TopicSelector Component
```
┌─────────────────────────────────────────────┐
│ Expertise *                                  │
├─────────────────────────────────────────────┤
│ ┌──────────┐ ┌────────────┐ ┌─────────┐ ▼  │
│ │Web Dev ✖│ │Data Sci ✖│ │Database✖│    │
│ └──────────┘ └────────────┘ └─────────┘    │
└─────────────────────────────────────────────┘
  (Click để mở dropdown)
```

**Dropdown when opened:**
```
┌─────────────────────────────────────────────┐
│ ☑ Web Development                           │
│   Full-stack web application development    │
├─────────────────────────────────────────────┤
│ ☐ Mobile Development                        │
│   iOS and Android app development           │
├─────────────────────────────────────────────┤
│ ☑ Data Science                              │
│   Machine learning and data analysis        │
└─────────────────────────────────────────────┘
```

### Schedule Card với Mentor Expertise
```
┌─────────────────────────────────────────────┐
│ Backend Development Fundamentals            │
│ 🕒 Nov 8, 2025, 10:00 AM                   │
│ to Nov 8, 2025, 11:30 AM                   │
│ 👥 Capacity: 5                              │
│ ─────────────────────────────────────────── │
│ 👨‍🏫 Mentor: John Doe                       │
│ Expertise:                                   │
│ ┌────────┐ ┌──────────┐ ┌────────┐        │
│ │Web Dev │ │Data Sci │ │Database│        │
│ └────────┘ └──────────┘ └────────┘        │
│           [AVAILABLE]                        │
│              [📅 Book Now]                   │
└─────────────────────────────────────────────┘
```

## Kiểm tra kỹ hơn

### 1. Validate API Calls
Mở Chrome DevTools → Network tab:
- **GET /api/topics**: Should return 15 topics
- **POST /api/profiles/mentor**: Body should include `expertise: [1, 3, 7]` (topic IDs)
- **GET /api/profiles/mentor/:id**: Response should include expertise as Topic objects
- **GET /api/schedules**: Mentor profiles should include expertise as Topic[]

### 2. Console Logs
ProfileForm có debug logs:
```
[DEBUG] Submitting mentee data: {...}
[DEBUG] Interests array: [1, 6, 12]
```

### 3. Error Handling
Test các cases:
- Submit profile không chọn topics → Should work (empty array)
- Select nhiều topics (>5) → Should work
- Update topics nhiều lần → Should replace old selections
- Load profile với topics → Should display correctly

## Troubleshooting

### Issue: Topics không load
**Solution:**
- Check backend đang chạy: `http://localhost:3000`
- Check database có 15 topics: Run `npm run seed:topics` trong backend
- Check console cho API errors

### Issue: Selected topics không save
**Solution:**
- Check Network tab → POST request body
- Verify `expertise` field là array of numbers: `[1, 3, 7]`
- Check backend logs

### Issue: Dropdown không mở
**Solution:**
- Check TopicSelector.css đã được import
- Check z-index conflicts
- Try clicking directly on the selector box

## Next Steps

Frontend đã sẵn sàng! Bạn có thể:
1. Test với user flow thực tế
2. Customize styles trong TopicSelector.css
3. Add topic filtering cho schedules
4. Add topic-based mentor search
