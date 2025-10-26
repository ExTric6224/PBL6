# Manual Testing Checklist - Bug Verification

## 🎯 Purpose
This checklist helps verify all 12 bug fixes are working correctly.

---

## 🔴 Critical Bugs - Must Test First

### ✅ Bug #1: Schedule API Mismatch

**Test Case 1.1:** Create schedule with all required fields
- [ ] Login as MENTOR
- [ ] Navigate to Schedules
- [ ] Click "Create New Schedule"
- [ ] Fill in:
  - Topic: "Python Programming Basics"
  - Start time: Tomorrow at 2 PM
  - End time: Tomorrow at 3 PM
  - Capacity: 5
- [ ] Click "Create Schedule"
- [ ] **Expected:** ✅ Success message, schedule appears in list
- [ ] **If fails:** 🔴 Check browser console for errors

**Test Case 1.2:** Verify schedule displays correctly
- [ ] Check created schedule shows:
  - ✅ Topic as heading
  - ✅ Capacity badge (e.g., "0/5 bookings")
  - ✅ Start and End times with year (2024)

---

### ✅ Bug #2: Profile API Mismatch

**Test Case 2.1:** Create Mentor profile
- [ ] Login as MENTOR (or register new mentor account)
- [ ] Navigate to Profile
- [ ] Fill in:
  - **Full Name:** "John Doe" *(required!)*
  - School: "Harvard University"
  - Expertise: Add tags like "Python", "JavaScript"
  - Degree: "Master of Computer Science"
  - Years of Experience: 5
  - Bio: "Experienced software engineer..."
- [ ] Click "Save Profile"
- [ ] **Expected:** ✅ Success message
- [ ] **If fails:** 🔴 Check if fullName is missing

**Test Case 2.2:** Create Mentee profile
- [ ] Login as MENTEE
- [ ] Navigate to Profile
- [ ] Fill in:
  - **Full Name:** "Jane Smith" *(required!)*
  - Interests: Add tags like "Web Dev", "AI"
  - Goals: "Learn full-stack development"
- [ ] Click "Save Profile"
- [ ] **Expected:** ✅ Success message

---

## 🟠 High Priority Bugs - Input Validation

### ✅ Bug #3: parseInt NaN - Feedback sessionId

**Test Case 3.1:** Empty sessionId input
- [ ] Navigate to Feedback page
- [ ] Leave "Session ID" field empty
- [ ] **Expected:** Field shows value 0 (not NaN)

**Test Case 3.2:** Invalid sessionId
- [ ] Type letters "abc" in Session ID field
- [ ] **Expected:** Field rejects or shows 0

**Test Case 3.3:** Negative sessionId
- [ ] Try to enter "-5"
- [ ] **Expected:** Prevented by `min="1"` attribute

---

### ✅ Bug #4: parseInt NaN - Schedule capacity

**Test Case 4.1:** Empty capacity
- [ ] Create schedule, leave Capacity empty
- [ ] **Expected:** Defaults to 1

**Test Case 4.2:** Capacity over limit
- [ ] Try to enter "200" in Capacity
- [ ] **Expected:** Prevented by `max="100"`

---

### ✅ Bug #5: parseInt NaN - Profile yearsExp

**Test Case 5.1:** Empty years of experience
- [ ] Edit Mentor profile
- [ ] Clear "Years of Experience" field
- [ ] **Expected:** Defaults to 0

**Test Case 5.2:** Excessive years
- [ ] Try to enter "99"
- [ ] **Expected:** Prevented by `max="50"`

---

### ✅ Bug #6: DateTime Validation

**Test Case 6.1:** End time before start time
- [ ] Create schedule
- [ ] Set Start: Tomorrow 3 PM
- [ ] Set End: Tomorrow 2 PM (before start!)
- [ ] Click Create
- [ ] **Expected:** ⚠️ Alert: "End time must be after start time!"

**Test Case 6.2:** Schedule in the past
- [ ] Set Start: Yesterday 2 PM
- [ ] **Expected:** ⚠️ Alert: "Start time must be in the future!"

**Test Case 6.3:** Valid schedule
- [ ] Set Start: Tomorrow 2 PM
- [ ] Set End: Tomorrow 3 PM
- [ ] **Expected:** ✅ Schedule created successfully

---

### ✅ Bug #7: Post Content Validation

**Test Case 7.1:** Empty title
- [ ] Create new post
- [ ] Leave Title empty
- [ ] **Expected:** ⚠️ Alert: "Title must be at least 3 characters"

**Test Case 7.2:** Short title
- [ ] Enter title: "Ab" (2 chars)
- [ ] **Expected:** ⚠️ Alert

**Test Case 7.3:** Short content
- [ ] Enter content: "Hi" (2 chars)
- [ ] **Expected:** ⚠️ Alert: "Content must be at least 10 characters"

**Test Case 7.4:** Valid post
- [ ] Title: "My First Post" (13 chars)
- [ ] Content: "This is my first post about mentoring" (37 chars)
- [ ] **Expected:** ✅ Post created

---

## 🟡 Medium Priority Bugs - Stability

### ✅ Bug #8-11: React Hook Warnings

**Test Case 8.1:** Check browser console
- [ ] Open browser DevTools (F12)
- [ ] Navigate through all pages:
  - [ ] Schedules
  - [ ] Posts
  - [ ] Bookings
  - [ ] Profile
- [ ] **Expected:** No React warnings about missing dependencies

---

### ✅ Bug #12: Array Null Safety

**Test Case 12.1:** Profile with null arrays
- [ ] Create new profile without any expertise tags
- [ ] Save and reload page
- [ ] **Expected:** No crash, empty tag list shows

**Test Case 12.2:** Edit existing profile
- [ ] Load profile with expertise
- [ ] Remove all tags
- [ ] **Expected:** No errors when all tags removed

---

## 🧪 Browser Console Checks

### What to look for in console:
- ❌ **Bad:** "Cannot read property 'map' of undefined"
- ❌ **Bad:** "NaN" in network requests
- ❌ **Bad:** React Hook dependency warnings
- ✅ **Good:** Clean console with no errors

---

## 📊 Test Results Template

```
## Test Session: [Date]
**Tester:** [Your Name]
**Browser:** Chrome/Firefox/Safari
**Environment:** Development/Production

### Critical Bugs (2)
- [ ] Bug #1: Schedule API Mismatch - PASS/FAIL
- [ ] Bug #2: Profile API Mismatch - PASS/FAIL

### High Priority (5)
- [ ] Bug #3: parseInt NaN (Feedback) - PASS/FAIL
- [ ] Bug #4: parseInt NaN (Schedule) - PASS/FAIL
- [ ] Bug #5: parseInt NaN (Profile) - PASS/FAIL
- [ ] Bug #6: DateTime Validation - PASS/FAIL
- [ ] Bug #7: Post Validation - PASS/FAIL

### Medium Priority (5)
- [ ] Bug #8-11: React Hook Warnings - PASS/FAIL
- [ ] Bug #12: Array Null Safety - PASS/FAIL

### Overall Status
- Total Tests: 12
- Passed: __
- Failed: __
- Notes: [Any issues found]
```

---

## 🚨 If Tests Fail

### Schedule Creation Fails (Bug #1)
1. Open Browser DevTools → Network tab
2. Try to create schedule
3. Find POST request to `/api/schedules`
4. Check Request Payload contains:
   - ✅ `topic`
   - ✅ `startAt` (ISO 8601 format)
   - ✅ `endAt` (ISO 8601 format)
   - ✅ `capacity`
5. If missing any field → Bug not fixed properly

### Profile Creation Fails (Bug #2)
1. Network tab → POST to `/api/profiles/mentor`
2. Check Request Payload contains:
   - ✅ `fullName` (required!)
   - ✅ `yearsExp` (not `experience`)
   - ✅ `expertise` (array)
3. If `fullName` missing → Bug not fixed

### DateTime Validation Not Working (Bug #6)
1. Check `ScheduleList.tsx` line ~50-70
2. Verify `handleCreateSchedule` has validation:
   ```typescript
   if (end <= start) { alert(...); return; }
   if (start < new Date()) { alert(...); return; }
   ```

---

## 🎓 Testing Tips

1. **Test with empty inputs first** - Most bugs happen with missing data
2. **Check browser console** - Errors show up there before UI breaks
3. **Test edge cases:**
   - Minimum values (0, empty string)
   - Maximum values (999, very long text)
   - Invalid values (negative numbers, past dates)
4. **Test as different roles:**
   - ADMIN
   - MENTOR
   - MENTEE

---

**Last Updated:** 2024-12-25  
**Total Test Cases:** 24
