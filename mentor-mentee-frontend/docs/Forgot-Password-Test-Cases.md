# Test Cases cho Tính Năng Quên Mật Khẩu

## Chuẩn Bị Test

### 1. Khởi động Backend
```bash
cd mentor-mentee-api
npm run dev
```

### 2. Khởi động Frontend
```bash
cd mentor-mentee-frontend
npm start
```

### 3. Đảm bảo Email Service hoạt động
- Kiểm tra file `.env` trong backend có cấu hình SMTP
- Test gửi email bằng script test

## Test Cases

### TC01: Request Reset Code - Email Hợp Lệ
**Steps:**
1. Mở http://localhost:3001/forgot-password
2. Nhập email của user đã tồn tại (vd: mentor@example.com)
3. Click "Send Verification Code"

**Expected Result:**
- Hiển thị thông báo thành công
- Chuyển sang bước 2 (Verify Code)
- Email nhận được mã OTP 6 số
- Nút resend bị disable trong 60 giây

### TC02: Request Reset Code - Email Không Tồn Tại
**Steps:**
1. Mở http://localhost:3001/forgot-password
2. Nhập email không tồn tại (vd: notexist@example.com)
3. Click "Send Verification Code"

**Expected Result:**
- Hiển thị lỗi "User not found" hoặc tương tự
- Vẫn ở bước 1
- Không gửi email

### TC03: Request Reset Code - Email Format Sai
**Steps:**
1. Mở http://localhost:3001/forgot-password
2. Nhập email sai format (vd: notanemail)
3. Click "Send Verification Code"

**Expected Result:**
- HTML5 validation hiển thị lỗi
- Không gửi request đến server

### TC04: Verify Code - Mã Đúng
**Steps:**
1. Hoàn thành TC01
2. Nhập mã OTP 6 số nhận được từ email
3. Click "Verify Code"

**Expected Result:**
- Hiển thị thông báo thành công
- Chuyển sang bước 3 (Reset Password)

### TC05: Verify Code - Mã Sai
**Steps:**
1. Hoàn thành TC01
2. Nhập mã OTP sai (vd: 000000)
3. Click "Verify Code"

**Expected Result:**
- Hiển thị lỗi "Invalid code"
- Vẫn ở bước 2
- Có thể thử lại

### TC06: Verify Code - Mã Hết Hạn
**Steps:**
1. Hoàn thành TC01
2. Đợi 10 phút
3. Nhập mã OTP
4. Click "Verify Code"

**Expected Result:**
- Hiển thị lỗi "Code expired"
- Gợi ý request mã mới

### TC07: Reset Password - Thành Công
**Steps:**
1. Hoàn thành TC04
2. Nhập mật khẩu mới (vd: newpassword123)
3. Nhập xác nhận mật khẩu giống mật khẩu mới
4. Click "Reset Password"

**Expected Result:**
- Hiển thị thông báo thành công
- Chuyển sang success screen
- Redirect về trang login sau 2 giây
- Có thể đăng nhập với mật khẩu mới

### TC08: Reset Password - Mật Khẩu Không Khớp
**Steps:**
1. Hoàn thành TC04
2. Nhập mật khẩu mới (vd: newpassword123)
3. Nhập xác nhận mật khẩu khác (vd: different123)
4. Click "Reset Password"

**Expected Result:**
- Hiển thị lỗi "Passwords do not match"
- Vẫn ở bước 3
- Không reset password

### TC09: Reset Password - Mật Khẩu Quá Ngắn
**Steps:**
1. Hoàn thành TC04
2. Nhập mật khẩu mới quá ngắn (vd: 123)
3. Nhập xác nhận mật khẩu
4. Click "Reset Password"

**Expected Result:**
- Hiển thị lỗi "Password must be at least 6 characters"
- Vẫn ở bước 3
- Không reset password

### TC10: Resend Code - Thành Công
**Steps:**
1. Hoàn thành TC01
2. Ở bước 2, đợi 60 giây
3. Click "Resend Code"

**Expected Result:**
- Hiển thị thông báo thành công
- Nhận được email mới với mã OTP mới
- Mã cũ không còn dùng được
- Nút resend bị disable lại trong 60 giây

### TC11: Resend Code - Spam Protection
**Steps:**
1. Hoàn thành TC01
2. Ở bước 2, click "Resend Code" ngay lập tức

**Expected Result:**
- Nút bị disable
- Hiển thị countdown timer
- Không gửi request

### TC12: Rate Limiting
**Steps:**
1. Request code nhiều lần liên tiếp cho cùng 1 email

**Expected Result:**
- Sau số lần nhất định, hiển thị lỗi rate limiting
- Yêu cầu đợi trước khi thử lại

### TC13: Multiple Tabs/Windows
**Steps:**
1. Mở 2 tabs/windows
2. Request code ở cả 2
3. Verify code ở tab 1
4. Thử verify ở tab 2

**Expected Result:**
- Mã chỉ dùng được 1 lần
- Tab 2 hiển thị lỗi "Code already used"

### TC14: Back Button Navigation
**Steps:**
1. Hoàn thành tất cả 3 bước
2. Click back button của browser

**Expected Result:**
- Không thể quay lại các bước trước
- Nên redirect về login hoặc hiện thông báo

### TC15: Direct URL Access
**Steps:**
1. Không qua bước 1, trực tiếp vào URL step 2 hoặc 3

**Expected Result:**
- Redirect về bước 1
- Hoặc hiển thị thông báo cần hoàn thành bước trước

## Performance Tests

### PT01: Response Time
- Request code response < 2s
- Verify code response < 1s
- Reset password response < 1s

### PT02: Email Delivery
- Email được gửi trong vòng 30 giây
- Email chứa đầy đủ thông tin

## Security Tests

### ST01: SQL Injection
**Steps:**
1. Nhập email: `' OR '1'='1`
2. Click submit

**Expected Result:**
- Validation reject input
- Hoặc safely handle

### ST02: XSS Attack
**Steps:**
1. Nhập email: `<script>alert('xss')</script>@test.com`
2. Click submit

**Expected Result:**
- Input được sanitize
- Script không execute

### ST03: Brute Force
**Steps:**
1. Thử nhiều mã OTP sai liên tiếp

**Expected Result:**
- Sau 5 lần sai, block account tạm thời
- Yêu cầu request mã mới

## UI/UX Tests

### UX01: Responsive Design
**Steps:**
1. Test trên mobile (320px - 480px)
2. Test trên tablet (481px - 768px)
3. Test trên desktop (769px+)

**Expected Result:**
- Layout responsive đúng
- Không bị overflow
- Buttons và inputs dễ click/tap

### UX02: Loading States
**Steps:**
1. Quan sát khi submit mỗi form

**Expected Result:**
- Button hiển thị loading state
- Button bị disable khi processing
- Text thay đổi phù hợp

### UX03: Error Messages
**Steps:**
1. Trigger các loại errors khác nhau

**Expected Result:**
- Error messages rõ ràng, dễ hiểu
- Có màu sắc phân biệt
- Tự động clear khi user sửa

### UX04: Success Messages
**Steps:**
1. Complete mỗi bước thành công

**Expected Result:**
- Success messages rõ ràng
- Có màu sắc phân biệt
- Animation smooth

### UX05: Step Indicator
**Steps:**
1. Đi qua tất cả các bước

**Expected Result:**
- Step indicator update đúng
- Active step được highlight
- Completed steps có checkmark

## Accessibility Tests

### A01: Keyboard Navigation
**Steps:**
1. Sử dụng Tab để navigate
2. Sử dụng Enter để submit

**Expected Result:**
- Có thể navigate toàn bộ form bằng keyboard
- Tab order hợp lý
- Enter submit được form

### A02: Screen Reader
**Steps:**
1. Test với screen reader

**Expected Result:**
- Labels được đọc đúng
- Error messages được announce
- Success messages được announce

## Browser Compatibility

Test trên các browsers:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## Regression Tests

Sau mỗi lần update code, chạy lại:
- TC01, TC04, TC07 (Happy path)
- TC02, TC05, TC08 (Error cases)
- TC10 (Resend functionality)
- UX01, UX02 (UI/UX)

## Test Data

### Valid Test Accounts
```
Email: mentor@example.com
Old Password: mentor123

Email: mentee@example.com
Old Password: mentee123
```

### Test Emails
```
Valid: test@example.com, user.name@example.com
Invalid: notanemail, @example.com, user@
```

### Test Codes
```
Valid format: 123456, 000000, 999999
Invalid format: 12345, 1234567, abcdef
```

### Test Passwords
```
Valid: password123, newpass123, test1234
Invalid (too short): pass, 12345
```

## Bug Report Template

```markdown
**Title:** [Brief description]

**Priority:** High / Medium / Low

**Test Case:** TC##

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**


**Actual Result:**


**Environment:**
- Browser: 
- OS: 
- Screen Size: 

**Screenshots/Videos:**


**Additional Notes:**

```

## Test Report Template

```markdown
# Test Report - Forgot Password Feature

**Date:** [Date]
**Tester:** [Name]
**Version:** [Version]

## Summary
- Total Test Cases: 
- Passed: 
- Failed: 
- Blocked: 
- Not Executed: 

## Detailed Results

### Functional Tests
| TC ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| TC01  |             | PASS   |       |
| TC02  |             | FAIL   | [Bug#]|

### Performance Tests
| PT ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| PT01  |             | PASS   |       |

### Security Tests
| ST ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| ST01  |             | PASS   |       |

### UI/UX Tests
| UX ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| UX01  |             | PASS   |       |

## Issues Found
1. [Issue description and severity]
2. 

## Recommendations
1. 
2. 

## Conclusion

```
