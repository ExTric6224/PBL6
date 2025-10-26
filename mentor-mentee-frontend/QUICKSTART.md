# 🚀 Quick Start Guide - Mentor-Mentee Platform

## Chạy dự án trong 5 phút!

### Bước 1: Cài đặt dependencies

#### Backend
```powershell
cd d:\Documents\PBL6\mentor-mentee-api
npm install
```

#### Frontend
```powershell
cd d:\Documents\PBL6\mentor-mentee-frontend
npm install
```

### Bước 2: Setup Database (nếu chưa có)

```powershell
cd d:\Documents\PBL6\mentor-mentee-api
npx prisma migrate dev
npx prisma db seed
```

### Bước 3: Chạy Backend

```powershell
cd d:\Documents\PBL6\mentor-mentee-api
npm run dev
```

Backend sẽ chạy tại: http://localhost:3000

### Bước 4: Chạy Frontend (Terminal mới)

```powershell
cd d:\Documents\PBL6\mentor-mentee-frontend
npm start
```

Frontend sẽ tự động mở tại: http://localhost:3001

### Bước 5: Đăng nhập và Test

#### Tài khoản mặc định (nếu đã seed):
- **Admin**: admin@example.com / password
- **Mentor**: mentor@example.com / password  
- **Mentee**: mentee@example.com / password

#### Hoặc đăng ký tài khoản mới:
1. Click "Register"
2. Nhập email và password
3. Chọn role (MENTOR hoặc MENTEE)
4. Xác thực OTP (nếu có)

## 🎯 Test các tính năng

### Test 1: Posts (Mentor/Admin)
1. Login với mentor/admin account
2. Navigate to "Posts" 
3. Click "Create Post"
4. Nhập title và content → Submit
5. Like/Unlike posts
6. Edit/Delete posts của mình

### Test 2: Schedules & Bookings
1. **Mentor**: Login → Schedules → Create Schedule (chọn start/end time)
2. **Mentee**: Login → Schedules → Click "Book Now" trên schedule available
3. **Mentor**: Bookings → Confirm booking
4. **Mentee**: Bookings → Xem booking đã confirmed

### Test 3: Feedback
1. **Mentee**: Login → Feedback → Click "Give Feedback"
2. Nhập Session ID, chọn rating (1-5 stars)
3. Viết comment → Submit
4. View feedback history

### Test 4: Profile
1. Login → Profile
2. **Mentor**: Nhập Bio, add Expertise tags (press Enter), set Experience
3. **Mentee**: Add Interests tags, nhập Goals
4. Click "Create Profile" hoặc "Update Profile"

### Test 5: Admin - Permissions
1. Login với admin account
2. Navigate to "Permissions"
3. **Tab User**: Tìm user ID → Grant/Revoke permissions
4. **Tab Role**: Select role → Bulk edit permissions → Save Changes

## 🐛 Troubleshooting

### Lỗi kết nối API
```
Error: Network Error
```
**Solution**: Kiểm tra backend đã chạy tại http://localhost:3000

### CORS Error
```
Access-Control-Allow-Origin error
```
**Solution**: Đảm bảo backend có cấu hình CORS trong `src/app.ts`

### Token expired
```
Error: Unauthorized
```
**Solution**: Logout và login lại

### Database connection failed
```
Error: Can't reach database server
```
**Solution**: 
- Kiểm tra MySQL đã chạy
- Kiểm tra `.env` file có đúng DATABASE_URL

## 📋 Checklist hoàn thành

- [ ] Backend running on port 3000
- [ ] Frontend running on port 3001
- [ ] Database connected và seeded
- [ ] Đăng nhập thành công
- [ ] Navigation bar hiển thị đúng
- [ ] Có thể tạo posts
- [ ] Có thể tạo schedules (Mentor)
- [ ] Có thể book schedules (Mentee)
- [ ] Có thể give feedback
- [ ] Profile được tạo/update thành công
- [ ] Admin có thể manage permissions

## 🎨 UI Features

✅ Responsive navigation với mobile menu
✅ Beautiful gradient designs
✅ Smooth animations và transitions
✅ Loading states
✅ Error handling
✅ Form validation
✅ Toast notifications

## 📱 Test Responsive

1. Mở Developer Tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test trên các màn hình:
   - Mobile: 375px
   - Tablet: 768px
   - Desktop: 1920px

## 🔐 Permission System

### Test RBAC:
1. Login as **ADMIN**
2. Go to Permissions → User Permissions
3. Find a MENTEE user
4. Grant "post:create" permission
5. Logout và login lại với MENTEE account
6. Kiểm tra: MENTEE giờ có thể tạo post!

### Test Revoke:
1. Admin revoke "post:create" từ MENTEE
2. Logout và login lại với MENTEE
3. MENTEE không còn thấy button "Create Post"

## 🎉 Xong!

Bây giờ bạn có:
- ✅ Full-featured Mentor-Mentee platform
- ✅ Complete UI với 7 main features
- ✅ Admin permission management
- ✅ Responsive design
- ✅ Beautiful gradients và animations
- ✅ Type-safe TypeScript code

Happy coding! 🚀
