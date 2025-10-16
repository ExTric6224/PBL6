# Email OTP Registration System

Hệ thống đăng ký tài khoản với xác thực email qua mã OTP 6 số.

## Flow đăng ký mới

### 1. Request OTP Code
```http
POST /api/auth/register/request-code
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "MENTEE"
}
```

**Response:**
```json
{
  "data": {
    "email": "user@example.com",
    "ttlMinutes": 10
  }
}
```

### 2. Verify OTP Code
```http
POST /api/auth/register/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "MENTEE",
      "createdAt": "2025-10-13T...",
      "updatedAt": "2025-10-13T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Resend OTP Code (nếu cần)
```http
POST /api/auth/register/resend
Content-Type: application/json

{
  "email": "user@example.com"
}
```

## Bảo mật & Giới hạn

- **Mã OTP**: 6 số, hết hạn sau 10 phút
- **Attempts**: Tối đa 5 lần nhập sai → phải request mã mới
- **Resend throttle**: Chỉ được gửi lại sau 60 giây
- **Rate limiting**: Áp dụng cho tất cả endpoint OTP
- **Hash**: Mã OTP được hash trước khi lưu DB

## Development Setup

### 1. Chạy migration
```bash
npx prisma migrate dev --name add-email-verification
npx prisma generate
```

### 2. Cấu hình email trong .env
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM="MentorMentee <no-reply@yourapp.com>"
APP_NAME=MentorMentee
```

### 3. Development mode
Trong development, nếu gửi email thất bại, mã OTP sẽ được log ra console:
```
🔐 Verification code for user@example.com: 123456
```

## Error Codes

| Status | Code | Message |
|--------|------|---------|
| 409 | CONFLICT | Email already registered |
| 429 | VALIDATION_ERROR | Please wait before requesting again |
| 400 | VALIDATION_ERROR | Please request a code first |
| 400 | VALIDATION_ERROR | Code expired, please request a new one |
| 429 | VALIDATION_ERROR | Too many attempts, request a new code later |
| 400 | VALIDATION_ERROR | Invalid code |

## Backward Compatibility

Endpoint cũ `/api/auth/register` vẫn hoạt động bình thường để đảm bảo tương thích ngược.

## Database Schema

```sql
CREATE TABLE EmailVerification (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(191) UNIQUE NOT NULL,
  codeHash VARCHAR(191) NOT NULL,
  expiresAt DATETIME NOT NULL,
  attempts INT DEFAULT 0,
  lastSentAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  role ENUM('MENTOR', 'MENTEE') NOT NULL,
  passwordHash VARCHAR(191) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_expiresAt (expiresAt)
);
```