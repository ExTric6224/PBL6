# Hướng Dẫn Sử Dụng Tính Năng Quên Mật Khẩu

## Tổng Quan

Tính năng quên mật khẩu cho phép người dùng đặt lại mật khẩu của họ thông qua email verification với mã OTP 6 số.

## Quy Trình

### 1. Request Reset Code (Yêu Cầu Mã Đặt Lại)
- Người dùng nhập địa chỉ email đã đăng ký
- Hệ thống gửi mã OTP 6 số đến email
- Mã có hiệu lực trong 10 phút

### 2. Verify Code (Xác Thực Mã)
- Người dùng nhập mã OTP 6 số nhận được từ email
- Hệ thống xác thực mã
- Nếu mã đúng, chuyển sang bước đặt lại mật khẩu

### 3. Reset Password (Đặt Lại Mật Khẩu)
- Người dùng nhập mật khẩu mới
- Xác nhận mật khẩu mới
- Hệ thống cập nhật mật khẩu và chuyển về trang đăng nhập

## Các Tính Năng

### Resend Code (Gửi Lại Mã)
- Nếu không nhận được mã, người dùng có thể yêu cầu gửi lại
- Có thời gian chờ 60 giây giữa các lần gửi lại
- Mã cũ sẽ bị vô hiệu hóa khi gửi mã mới

### Validation (Xác Thực)
- Email phải đúng định dạng
- Mã OTP phải là 6 chữ số
- Mật khẩu mới phải có ít nhất 6 ký tự
- Mật khẩu xác nhận phải khớp với mật khẩu mới

### Error Handling (Xử Lý Lỗi)
- Email không tồn tại trong hệ thống
- Mã OTP không đúng
- Mã OTP đã hết hạn
- Quá nhiều lần thử sai
- Mã đã được sử dụng

## API Endpoints

### POST /api/forgot-password/request-code
Request body:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "ttlMinutes": 10
  }
}
```

### POST /api/forgot-password/verify-code
Request body:
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "valid": true
  }
}
```

### POST /api/forgot-password/reset-password
Request body:
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newpassword123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

### POST /api/forgot-password/resend
Request body:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "ttlMinutes": 10
  }
}
```

## Cách Sử Dụng

### 1. Truy Cập Trang Forgot Password
- Từ trang đăng nhập, click vào link "Forgot your password?"
- Hoặc truy cập trực tiếp: `http://localhost:3001/forgot-password`

### 2. Nhập Email
- Nhập địa chỉ email đã đăng ký
- Click "Send Verification Code"
- Kiểm tra email để lấy mã OTP

### 3. Nhập Mã OTP
- Nhập mã 6 số nhận được từ email
- Click "Verify Code"
- Nếu không nhận được mã, click "Resend Code"

### 4. Đặt Lại Mật Khẩu
- Nhập mật khẩu mới (tối thiểu 6 ký tự)
- Xác nhận mật khẩu mới
- Click "Reset Password"
- Chờ chuyển hướng về trang đăng nhập

## UI/UX Features

### Step Indicator
- Hiển thị 3 bước: Request Code → Verify Code → Reset Password
- Bước hiện tại được highlight
- Các bước đã hoàn thành có dấu check

### Loading States
- Buttons disabled khi đang xử lý
- Text thay đổi khi loading: "Sending...", "Verifying...", "Resetting..."

### Error Messages
- Hiển thị rõ ràng lỗi từ server
- Tự động clear khi người dùng thay đổi input

### Success Messages
- Hiển thị thông báo thành công sau mỗi bước
- Thông báo countdown khi redirect

### Timer
- Countdown 60 giây cho nút Resend
- Disable nút khi đang trong thời gian chờ

## Testing

### Test với Email Thật
1. Đảm bảo backend đã cấu hình SMTP đúng
2. Sử dụng email thật để nhận OTP
3. Test toàn bộ flow từ request đến reset

### Test Cases
- ✅ Request code với email hợp lệ
- ✅ Request code với email không tồn tại
- ✅ Verify với mã đúng
- ✅ Verify với mã sai
- ✅ Verify với mã đã hết hạn
- ✅ Reset password thành công
- ✅ Reset password với mật khẩu không khớp
- ✅ Resend code functionality
- ✅ Rate limiting (quá nhiều requests)

## Security Features

- Mã OTP có thời gian hết hạn (10 phút)
- Rate limiting để tránh spam
- Mã chỉ dùng được 1 lần
- Giới hạn số lần thử sai
- Password validation
- HTTPS cho production

## Responsive Design

- Mobile-friendly
- Tablet-friendly
- Desktop-friendly
- Adaptive layout cho các kích thước màn hình

## Files Created/Modified

### New Files:
- `src/components/Auth/ForgotPassword.tsx` - Main component

### Modified Files:
- `src/services/api.ts` - Added forgotPasswordAPI endpoints
- `src/App.tsx` - Added forgot-password route
- `src/components/Auth/Login.tsx` - Added forgot password link
- `src/components/Auth/AuthForm.css` - Added forgot password styles

## Next Steps

1. Test thoroughly với real email service
2. Add analytics tracking
3. Add multi-language support
4. Add password strength indicator
5. Add remember me functionality
