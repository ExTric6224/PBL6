# Hướng Dẫn Test Chức Năng Quên Mật Khẩu

## Mô Tả Chức Năng

Chức năng quên mật khẩu cho phép người dùng đặt lại mật khẩu thông qua email với các bước:
1. Yêu cầu mã OTP gửi về email
2. Xác minh mã OTP (tùy chọn)
3. Đặt lại mật khẩu mới
4. Gửi lại mã OTP nếu cần

## Các API Endpoints

- `POST /api/auth/forgot-password/request-code` - Yêu cầu mã reset
- `POST /api/auth/forgot-password/verify-code` - Xác minh mã OTP
- `POST /api/auth/forgot-password/reset-password` - Đặt lại mật khẩu
- `POST /api/auth/forgot-password/resend` - Gửi lại mã OTP

## Cấu Hình Email

Trước khi test, đảm bảo file `.env` có cấu hình email:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

## Cách Test

### 1. Test Bằng Script (Khuyến nghị)

```bash
# Chạy flow đầy đủ
npm run ts-node scripts/test-forgot-password.ts

# Test riêng resend code
npm run ts-node scripts/test-forgot-password.ts resend

# Test các trường hợp lỗi
npm run ts-node scripts/test-forgot-password.ts errors

# Test tất cả (full + errors)
npm run ts-node scripts/test-forgot-password.ts full
```

**Lưu ý**: Sửa `TEST_EMAIL` trong file `scripts/test-forgot-password.ts` thành email có trong database của bạn.

### 2. Test Bằng Postman/Thunder Client

#### Bước 1: Request Reset Code

**Request:**
```http
POST http://localhost:3000/api/auth/forgot-password/request-code
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "email": "test@example.com",
    "ttlMinutes": 10
  }
}
```

**Kiểm tra console server** để lấy mã OTP (trong development mode):
```
🔐 [DEBUG] Generated password reset OTP for test@example.com: 123456
```

#### Bước 2: Verify Reset Code (Optional)

**Request:**
```http
POST http://localhost:3000/api/auth/forgot-password/verify-code
Content-Type: application/json

{
  "email": "test@example.com",
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "email": "test@example.com",
    "valid": true
  }
}
```

#### Bước 3: Reset Password

**Request:**
```http
POST http://localhost:3000/api/auth/forgot-password/reset-password
Content-Type: application/json

{
  "email": "test@example.com",
  "code": "123456",
  "newPassword": "newpassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successful"
  }
}
```

#### Bước 4: Resend Code

**Request:**
```http
POST http://localhost:3000/api/auth/forgot-password/resend
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "email": "test@example.com",
    "ttlMinutes": 10
  }
}
```

### 3. Test Bằng cURL (Windows PowerShell)

```powershell
# Request reset code
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/forgot-password/request-code" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com"}'

# Verify code
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/forgot-password/verify-code" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","code":"123456"}'

# Reset password
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/forgot-password/reset-password" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","code":"123456","newPassword":"newpassword123"}'
```

## Các Trường Hợp Test

### ✅ Happy Path
1. Request code → Nhận mã qua email/console
2. Verify code → Xác nhận mã hợp lệ
3. Reset password → Đặt mật khẩu mới thành công
4. Login với mật khẩu mới → Thành công

### ⚠️ Error Cases

#### 1. Email không tồn tại
```json
// Request với email không có trong database
// Response vẫn success (để tránh leak thông tin)
{
  "success": true,
  "data": {
    "email": "nonexistent@example.com",
    "ttlMinutes": 10
  }
}
// Nhưng không gửi email thực sự
```

#### 2. Rate Limiting (Gửi quá nhanh)
```json
// Gửi lại request trong vòng 60 giây
// Response 429:
{
  "success": false,
  "message": "Please wait before requesting again"
}
```

#### 3. Mã OTP hết hạn
```json
// Sau 10 phút
// Response 400:
{
  "success": false,
  "message": "Code expired, please request a new one"
}
```

#### 4. Mã OTP không đúng
```json
// Response 400:
{
  "success": false,
  "message": "Invalid code"
}
```

#### 5. Mã đã được sử dụng
```json
// Dùng mã lần 2
// Response 400:
{
  "success": false,
  "message": "Code already used, request a new one"
}
```

#### 6. Quá nhiều lần thử sai (5 lần)
```json
// Response 429:
{
  "success": false,
  "message": "Too many attempts, request a new code"
}
```

#### 7. Validation Errors
```json
// Email không hợp lệ
{
  "success": false,
  "message": "Invalid email format"
}

// Code không đúng định dạng (phải 6 chữ số)
{
  "success": false,
  "message": "Code must be 6 digits"
}

// Password quá ngắn (tối thiểu 6 ký tự)
{
  "success": false,
  "message": "Password must be at least 6 characters"
}
```

## Security Features

1. **Rate Limiting**: Chỉ được gửi lại sau 60 giây
2. **Code Expiration**: Mã OTP hết hạn sau 10 phút
3. **Max Attempts**: Tối đa 5 lần thử sai
4. **One-time Use**: Mã chỉ dùng được 1 lần
5. **Password Hashing**: Mật khẩu mới được hash trước khi lưu
6. **Email Validation**: Không leak thông tin email có tồn tại hay không

## Checklist Test

- [ ] Request code với email hợp lệ → Nhận được mã
- [ ] Request code với email không tồn tại → Response success (security)
- [ ] Verify code với mã đúng → Success
- [ ] Verify code với mã sai → Error
- [ ] Reset password với mã đúng → Success
- [ ] Login với mật khẩu mới → Success
- [ ] Resend code → Nhận mã mới
- [ ] Resend quá nhanh (< 60s) → Rate limit error
- [ ] Sử dụng mã đã dùng → Error
- [ ] Sử dụng mã hết hạn → Error
- [ ] Thử sai mã 5 lần → Too many attempts error
- [ ] Validation: email sai format → Error
- [ ] Validation: code không phải 6 số → Error
- [ ] Validation: password quá ngắn → Error

## Troubleshooting

### Không nhận được email
1. Kiểm tra cấu hình SMTP trong `.env`
2. Gmail: Đảm bảo dùng App Password, không phải mật khẩu thường
3. Kiểm tra console server - mã OTP sẽ hiển thị trong development mode
4. Kiểm tra spam folder

### Rate limit error
- Đợi 60 giây trước khi thử lại

### Database errors
```bash
# Reset database nếu cần
npm run prisma:generate
npx prisma migrate reset
npx prisma migrate dev
```

## Tips

1. **Development Mode**: Mã OTP luôn hiện trong console log
2. **Production Mode**: Chỉ gửi qua email thật
3. **Testing**: Tạo nhiều test users với email khác nhau
4. **Monitoring**: Theo dõi logs để debug issues

## Import Postman Collection

File collection đã có sẵn: `MentorMentee.postman_collection.json`

```bash
# Import vào Postman và test theo collection
```
