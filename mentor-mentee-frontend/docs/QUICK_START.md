# Quick Start - Test Forgot Password Feature

## 🚀 Khởi Động Nhanh

### 1. Start Backend
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

### 3. Test Forgot Password Flow

#### Option 1: Từ Login Page
1. Mở `http://localhost:3001/login`
2. Click vào link "Forgot your password?"
3. Theo flow bên dưới

#### Option 2: Direct Access
1. Mở trực tiếp `http://localhost:3001/forgot-password`
2. Theo flow bên dưới

## 📋 Test Flow

### Step 1: Request Reset Code
```
Email: mentor@example.com  (hoặc mentee@example.com)
→ Click "Send Verification Code"
→ Check console hoặc email để lấy OTP
```

### Step 2: Verify Code
```
Code: [6-digit code from email/console]
→ Click "Verify Code"
```

**Nếu không nhận được code:**
- Đợi 60 giây
- Click "Resend Code"

### Step 3: Reset Password
```
New Password: newpassword123
Confirm Password: newpassword123
→ Click "Reset Password"
```

### Step 4: Login với Password Mới
```
→ Auto redirect về /login
Email: mentor@example.com
Password: newpassword123
→ Click "Sign In"
```

## 🔍 Debug Tips

### Xem OTP Code trong Console (Development)
Nếu email service chưa setup, kiểm tra terminal của backend:
```
[Email Service] Code sent to mentor@example.com: 123456
```

### Check Network Requests
Mở DevTools → Network tab để xem:
- POST `/api/forgot-password/request-code`
- POST `/api/forgot-password/verify-code`
- POST `/api/forgot-password/reset-password`
- POST `/api/forgot-password/resend`

### Check State trong Component
Mở React DevTools để xem:
- `currentStep`
- `email`
- `code`
- `error`
- `success`
- `isLoading`

## ✅ Quick Test Cases

### Test 1: Happy Path (2 phút)
```
✓ Request code với mentor@example.com
✓ Verify với code từ console
✓ Reset password thành công
✓ Login với password mới
```

### Test 2: Wrong Code (1 phút)
```
✓ Request code
✓ Verify với code sai (000000)
✓ See error message
✓ Retry với code đúng
```

### Test 3: Password Mismatch (1 phút)
```
✓ Complete step 1 và 2
✓ Nhập password khác nhau
✓ See error message
✓ Retry với password khớp
```

### Test 4: Resend Code (2 phút)
```
✓ Request code
✓ Đợi 60 giây
✓ Click Resend Code
✓ Verify với code mới
```

### Test 5: Responsive Design (2 phút)
```
✓ Open DevTools
✓ Toggle device toolbar
✓ Test: Mobile (375px)
✓ Test: Tablet (768px)
✓ Test: Desktop (1024px)
```

## 🐛 Common Issues

### Issue: "User not found"
**Solution:** Sử dụng email đã tồn tại:
- `mentor@example.com`
- `mentee@example.com`

### Issue: "Code expired"
**Solution:** Request code mới, mã chỉ có hiệu lực 10 phút

### Issue: "Invalid code"
**Solution:** Check console/email để lấy code đúng

### Issue: Email không nhận được
**Solution:** 
1. Check backend console để lấy code
2. Setup SMTP trong `.env` nếu muốn nhận email thật

### Issue: "Too many requests"
**Solution:** Đợi 60 giây trước khi request lại

### Issue: Backend không chạy
**Solution:**
```bash
cd mentor-mentee-api
npm install
npm run dev
```

### Issue: Frontend không chạy
**Solution:**
```bash
cd mentor-mentee-frontend
npm install
npm start
```

## 📸 Screenshots Guide

### Screen 1: Login Page
- Link "Forgot your password?" visible
- Link styled với purple color

### Screen 2: Request Code
- Step indicator: Step 1 active
- Email input field
- "Send Verification Code" button

### Screen 3: Verify Code
- Step indicator: Step 2 active
- Email field (disabled)
- 6-digit code input
- "Verify Code" button
- "Resend Code" button (with timer)

### Screen 4: Reset Password
- Step indicator: Step 3 active
- New password input
- Confirm password input
- "Reset Password" button

### Screen 5: Success
- Green check icon
- Success message
- Auto-redirect countdown

## 🎯 Performance Benchmarks

### Target Times
- Request code: < 2 seconds
- Verify code: < 1 second
- Reset password: < 1 second
- Email delivery: < 30 seconds

### UI Responsiveness
- Page load: < 1 second
- Step transition: instant (no lag)
- Error display: instant
- Success display: instant

## 🎨 UI Elements to Check

### Colors
- ✓ Background: Purple gradient
- ✓ Primary button: Purple gradient
- ✓ Secondary button: Gray with border
- ✓ Error: Red background
- ✓ Success: Green background

### Animations
- ✓ Page slideUp on load
- ✓ Success icon scaleIn
- ✓ Smooth step transitions
- ✓ Button hover effects

### Responsive
- ✓ Mobile: Single column, full width
- ✓ Tablet: Single column, max-width
- ✓ Desktop: Centered card

## 📝 Notes

- OTP code có 6 chữ số
- Mã có hiệu lực 10 phút
- Cooldown giữa các lần resend: 60 giây
- Password tối thiểu 6 ký tự
- Auto-redirect sau reset thành công: 2 giây

## 🎓 Learning Points

### Frontend
- Multi-step form implementation
- State management cho wizard
- Timer/countdown implementation
- Error handling best practices
- Responsive design patterns
- Animation with CSS

### Backend Integration
- RESTful API consumption
- Async/await patterns
- Error response handling
- Loading state management

### UX/UI
- Progressive disclosure
- Clear visual feedback
- Helpful error messages
- Guided user flow
- Accessibility considerations

---

**Happy Testing! 🚀**
