# Email Configuration Guide

## 📧 Cấu hình Email cho OTP System

### 1. Development Mode (Khuyến nghị cho phát triển)

Thêm vào `.env`:
```env
DEV_MODE_LOG_OTP=true
```

Khi ở development mode, OTP codes sẽ được log ra console thay vì gửi email thật:
```
============================================================
📧 EMAIL VERIFICATION CODE (DEVELOPMENT MODE)
============================================================
📨 To: user@example.com
🔐 Code: 123456
⏰ Expires: 10 minutes from now
📱 Use this code in the verification form
============================================================
```

### 2. Production Mode - Gmail SMTP (Khuyến nghị)

#### Bước 1: Tạo App-Specific Password
1. Đăng nhập Gmail → Google Account Settings
2. Security → 2-Step Verification (bật nếu chưa có)
3. App passwords → Generate password for "Mail"
4. Copy password được tạo

#### Bước 2: Cấu hình .env
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-character-app-password
MAIL_FROM="MentorMentee <your-gmail@gmail.com>"
APP_NAME=MentorMentee
DEV_MODE_LOG_OTP=false
```

### 3. Alternative - Outlook/Hotmail SMTP

```env
SMTP_HOST=smtp.live.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
MAIL_FROM="MentorMentee <your-email@outlook.com>"
```

### 4. Alternative - Yahoo SMTP

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
MAIL_FROM="MentorMentee <your-email@yahoo.com>"
```

### 5. Alternative - Custom SMTP

```env
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
MAIL_FROM="MentorMentee <noreply@yourdomain.com>"
```

## 🧪 Testing Email Configuration

### Test 1: Start Server
```bash
npm run dev
```

### Test 2: Send OTP Request
```bash
curl -X POST http://localhost:3000/api/auth/register/request-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "MENTEE"
  }'
```

### Test 3: Check Logs
- **Development mode**: Xem console để lấy OTP code
- **Production mode**: Kiểm tra email inbox

## 🔒 Security Best Practices

### Email Security
- ✅ Sử dụng App-Specific Passwords (không dùng password chính)
- ✅ Enable 2FA trên email account
- ✅ Sử dụng dedicated email cho system (noreply@yourdomain.com)
- ✅ Cấu hình SPF/DKIM records để tránh spam

### OTP Security
- ✅ OTP codes được hash trước khi lưu DB
- ✅ TTL 10 phút cho mỗi code
- ✅ Maximum 5 attempts
- ✅ Resend throttling (60 seconds)
- ✅ Rate limiting per IP

## 🚨 Troubleshooting

### Problem: "Failed to send email"
**Solutions:**
1. Kiểm tra SMTP credentials
2. Kiểm tra firewall/network
3. Enable "Less secure app access" (Gmail legacy)
4. Sử dụng App-Specific Password
5. Check SMTP server status

### Problem: Email vào spam
**Solutions:**
1. Cấu hình SPF record: `v=spf1 include:_spf.google.com ~all`
2. Cấu hình DKIM
3. Sử dụng domain riêng thay vì Gmail
4. Warm up email domain trước khi production

### Problem: OTP không work
**Solutions:**
1. Check server logs
2. Verify database connection
3. Check if migration ran successfully
4. Verify API endpoints are accessible

## 📝 Environment Variables Summary

```env
# Database
DATABASE_URL="mysql://user:pass@localhost:3306/myapp"

# Server  
PORT=3000

# JWT
JWT_SECRET="your-secret-key"

# Email (Development)
DEV_MODE_LOG_OTP=true

# Email (Production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM="MentorMentee <your-email@gmail.com>"
APP_NAME=MentorMentee
DEV_MODE_LOG_OTP=false
```