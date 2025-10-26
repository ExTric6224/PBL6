# 🧪 Testing Guide - Mentor-Mentee Frontend

## Chuẩn bị môi trường test

### 1. Start Backend API

```bash
cd mentor-mentee-api
npm run dev
```

Backend sẽ chạy tại: `http://localhost:3000`

### 2. Start Frontend

```bash
cd mentor-mentee-frontend
npm start
```

Frontend sẽ chạy tại: `http://localhost:3001`

---

## 📋 Test Cases

### 1️⃣ Authentication Flow

#### Test Case 1.1: Register New User

**Steps:**

1. Mở `http://localhost:3001/register`
2. Nhập thông tin:
   - Email: `mentor1@test.com`
   - Password: `Password123`
   - Confirm Password: `Password123`
   - Role: chọn "Mentor"
3. Click "Register"

**Expected:**

- ✅ Redirect về `/dashboard`
- ✅ Hiển thị Navigation bar
- ✅ Thấy "Welcome, mentor1@test.com" trong dashboard

#### Test Case 1.2: Login Existing User

**Steps:**

1. Logout nếu đang login
2. Mở `http://localhost:3001/login`
3. Nhập:
   - Email: `mentor1@test.com`
   - Password: `Password123`
4. Click "Login"

**Expected:**

- ✅ Redirect về `/dashboard`
- ✅ Navigation bar hiển thị
- ✅ Dashboard show correct user info

#### Test Case 1.3: Logout

**Steps:**

1. Click "Logout" button trong Navigation
2. Confirm logout

**Expected:**

- ✅ Redirect về `/login`
- ✅ Navigation bar biến mất
- ✅ LocalStorage cleared (check DevTools)

---

### 2️⃣ Navigation Component

#### Test Case 2.1: Navigation Not Shown Before Login

**Steps:**

1. Logout hoàn toàn
2. Mở `http://localhost:3001/login`

**Expected:**

- ✅ Không thấy Navigation bar
- ✅ Chỉ thấy Login form

#### Test Case 2.2: Navigation Shown After Login

**Steps:**

1. Login thành công
2. Check navigation bar

**Expected:**

- ✅ Navigation bar hiển thị
- ✅ Logo + menu items visible
- ✅ Logout button có mặt

#### Test Case 2.3: Role-Based Menu Items

**Mentor login:**

- ✅ Thấy: Dashboard, Posts, Schedules, Bookings, Feedbacks, Profile
- ❌ Không thấy: Admin

**Admin login:**

- ✅ Thấy: Dashboard, Posts, Schedules, Bookings, Feedbacks, Profile, Admin

---

### 3️⃣ Posts Feature

#### Test Case 3.1: Create New Post

**Steps:**

1. Login as any user
2. Navigate to `/posts`
3. Click "Create New Post"
4. Fill:
   - Title: "My First Post"
   - Content: "This is a test post"
5. Click "Create Post"

**Expected:**

- ✅ Form đóng lại
- ✅ Post mới xuất hiện ở đầu list
- ✅ Author name hiển thị đúng
- ✅ Created date hiển thị đúng

#### Test Case 3.2: Edit Post

**Steps:**

1. Click "Edit" button trên post của mình
2. Sửa title thành "Updated Title"
3. Click "Update Post"

**Expected:**

- ✅ Form đóng
- ✅ Post title update ngay lập tức
- ✅ Không reload page

#### Test Case 3.3: Delete Post

**Steps:**

1. Click "Delete" button
2. Confirm deletion

**Expected:**

- ✅ Post biến mất khỏi list
- ✅ Success message (nếu có)

#### Test Case 3.4: Like/Unlike Post

**Steps:**

1. Click heart icon trên post
2. Check like count
3. Click lại để unlike

**Expected:**

- ✅ Heart đổi màu khi like (🤍 → ❤️)
- ✅ Like count tăng/giảm
- ✅ State persist khi reload

---

### 4️⃣ Schedules Feature

#### Test Case 4.1: Create Schedule (Mentor Only)

**Steps:**

1. Login as mentor
2. Navigate to `/schedules`
3. Click "Create New Schedule"
4. Fill:
   - Start Time: chọn ngày giờ trong tương lai
   - End Time: sau start time 1 tiếng
5. Click "Create Schedule"

**Expected:**

- ✅ Schedule mới xuất hiện
- ✅ Status = "AVAILABLE"
- ✅ DateTime format có năm: "Dec 25, 2024, 10:30 AM"

#### Test Case 4.2: DateTime Format Check

**Steps:**

1. Xem bất kỳ schedule nào
2. Check start/end time display

**Expected:**

- ✅ Format: "MMM DD, YYYY, HH:MM AM/PM"
- ✅ Ví dụ: "Jan 15, 2024, 02:30 PM"
- ✅ Có cả năm (năm 2024, 2025,...)

#### Test Case 4.3: Book Schedule (Mentee)

**Steps:**

1. Logout mentor
2. Login as mentee
3. Navigate to `/schedules`
4. Click "Book" trên schedule available

**Expected:**

- ✅ Success message
- ✅ Button đổi thành "Booked" (disabled)
- ✅ Schedule status update

---

### 5️⃣ Bookings Feature

#### Test Case 5.1: View Bookings (Mentee)

**Steps:**

1. Login as mentee (đã book schedule)
2. Navigate to `/bookings`

**Expected:**

- ✅ Hiển thị list bookings
- ✅ Show mentor info
- ✅ Show schedule time
- ✅ Show booking status

#### Test Case 5.2: Confirm Booking (Mentor)

**Steps:**

1. Login as mentor
2. Navigate to `/bookings`
3. Click "Confirm" trên booking pending

**Expected:**

- ✅ Status → "CONFIRMED"
- ✅ Button đổi thành "Cancel"
- ✅ Mentee nhìn thấy update

#### Test Case 5.3: Cancel Booking

**Steps:**

1. Click "Cancel" button
2. Confirm cancellation

**Expected:**

- ✅ Status → "CANCELLED"
- ✅ Button disabled hoặc biến mất

---

### 6️⃣ Feedback Feature

#### Test Case 6.1: Submit Feedback (Mentee)

**Steps:**

1. Login as mentee
2. Navigate to `/feedbacks`
3. Fill form:
   - Select mentor từ dropdown
   - Click stars (chọn 5⭐)
   - Comment: "Great mentor!"
4. Click "Submit Feedback"

**Expected:**

- ✅ Form reset
- ✅ Feedback xuất hiện trong "My Feedbacks" list
- ✅ Stars hiển thị đúng (5 active stars)

#### Test Case 6.2: Star Rating Interactive

**Steps:**

1. Click từng star từ 1-5
2. Check visual feedback

**Expected:**

- ✅ Stars highlight khi hover
- ✅ Click star 3 → 3 stars active
- ✅ Click star 5 → 5 stars active

---

### 7️⃣ Profile Feature

#### Test Case 7.1: Create Mentor Profile

**Steps:**

1. Login as mentor (chưa có profile)
2. Navigate to `/profile`
3. Fill:
   - Bio: "Experienced software engineer"
   - Expertise: type "React" → Enter, "Node.js" → Enter
   - Years of Experience: 5
4. Click "Create Profile"

**Expected:**

- ✅ Success message
- ✅ Form populated với data vừa nhập
- ✅ Button đổi thành "Update Profile"
- ✅ Tags hiển thị đẹp

#### Test Case 7.2: Tag Input (Expertise/Interests)

**Steps:**

1. Focus vào expertise input
2. Type "Python"
3. Press Enter

**Expected:**

- ✅ Tag "Python" xuất hiện
- ✅ Input clear
- ✅ X button để remove tag

#### Test Case 7.3: Remove Tag

**Steps:**

1. Click X button trên tag
2. Check tag list

**Expected:**

- ✅ Tag removed
- ✅ Không affect tags khác

---

### 8️⃣ Permission Management (Admin Only)

#### Test Case 8.1: Access Control

**Steps:**

1. Login as non-admin user
2. Try to access `/admin/permissions`

**Expected:**

- ✅ Redirect về dashboard hoặc 403 error

#### Test Case 8.2: View Permissions (Admin)

**Steps:**

1. Login as admin
2. Navigate to `/admin/permissions`
3. Check permission list

**Expected:**

- ✅ Thấy all 52 permissions
- ✅ Grouped by resource (Posts, Schedules,...)
- ✅ Each có code, description, resource

---

## 🔍 Edge Cases Testing

### EC1: API Server Down

**Steps:**

1. Stop backend server
2. Try any API call (create post, etc.)

**Expected:**

- ✅ Error message hiển thị
- ✅ App không crash
- ✅ Loading state kết thúc

### EC2: Invalid Token

**Steps:**

1. Login thành công
2. Mở DevTools → Application → LocalStorage
3. Sửa `accessToken` thành gibberish
4. Refresh page hoặc call API

**Expected:**

- ✅ Auto-redirect về `/login`
- ✅ LocalStorage cleared

### EC3: Empty States

**Steps:**

1. Login as new user (chưa có data)
2. Check từng page: Posts, Schedules, Bookings,...

**Expected:**

- ✅ Posts: "No posts yet. Be the first to create one!"
- ✅ Schedules: "No schedules yet. Create your first schedule!"
- ✅ Bookings: "No bookings yet."
- ✅ Feedbacks: "No feedbacks yet."

### EC4: Network Slow

**Steps:**

1. Mở DevTools → Network → Throttling → Slow 3G
2. Try load Posts page

**Expected:**

- ✅ "Loading posts..." hiển thị
- ✅ Spinner hoặc loading indicator
- ✅ Không show stale data

---

## 🐛 Known Issues Check

### ✅ Fixed Issues (should NOT appear)

1. **Navigation showing before login**
   - Go to `/login` → should NOT see navigation

2. **React Hook dependency warning**
   - Open console → should be clean (no warnings)

3. **DateTime missing year**
   - Check any schedule → should see "2024" or "2025"

4. **useCallback not used**
   - No infinite re-renders
   - No performance issues

5. **Missing key props**
   - Console clean (no "key" warnings)

---

## 📊 Test Results Checklist

### Authentication ✅
- [ ] Register works
- [ ] Login works
- [ ] Logout works
- [ ] Token persistence works

### Navigation ✅
- [ ] Not shown before login
- [ ] Shown after login
- [ ] Role-based menu correct

### Posts ✅
- [ ] Create post
- [ ] Edit post
- [ ] Delete post
- [ ] Like/Unlike post

### Schedules ✅
- [ ] Create schedule (mentor)
- [ ] DateTime format có năm
- [ ] Book schedule (mentee)

### Bookings ✅
- [ ] View bookings
- [ ] Confirm booking
- [ ] Cancel booking

### Feedback ✅
- [ ] Submit feedback
- [ ] Star rating works
- [ ] View feedbacks

### Profile ✅
- [ ] Create profile
- [ ] Update profile
- [ ] Tag input works

### Edge Cases ✅
- [ ] API down handled
- [ ] Invalid token handled
- [ ] Empty states shown
- [ ] Loading states shown

---

## 🎯 Final Checklist

### Code Quality
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] No console errors

### UX
- [ ] All buttons work
- [ ] All forms validate
- [ ] All error messages clear
- [ ] All loading states visible

### Performance
- [ ] No lag when typing
- [ ] No infinite loops
- [ ] Smooth animations
- [ ] Fast page loads

### Security
- [ ] Protected routes work
- [ ] Invalid token → redirect
- [ ] Role-based access enforced

---

## 📝 Bug Report Template

If you find a bug, report using this format:

```markdown
**Bug:** [Brief description]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** [What should happen]
**Actual:** [What actually happens]
**Severity:** [Critical/High/Medium/Low]
**Screenshot:** [If applicable]
```

---

## ✅ Test Complete!

Sau khi complete tất cả test cases:

1. ✅ All features work as expected
2. ✅ No critical bugs
3. ✅ Good UX/UI
4. ✅ Ready for production? **Yes/No**

---

**Happy Testing! 🎉**
