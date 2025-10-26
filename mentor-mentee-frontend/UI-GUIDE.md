# 🎓 Mentor-Mentee Platform - Complete UI Guide

## 📋 Tổng quan dự án

Giao diện hoàn chỉnh cho hệ thống Mentor-Mentee với đầy đủ tính năng:

### ✨ Tính năng đã hoàn thành

1. **🔐 Authentication**
   - Login / Register
   - OTP Registration
   - Forgot Password
   - Protected Routes

2. **📝 Posts Management**
   - Xem danh sách bài viết
   - Tạo bài viết (Mentor/Admin)
   - Chỉnh sửa/Xóa bài viết của mình
   - Like/Unlike bài viết
   - Phân trang

3. **🗓️ Schedules Management**
   - Mentor: Tạo và quản lý lịch rảnh
   - Mentee: Xem lịch available và đặt lịch
   - Filter theo status (Available/Booked/Cancelled)
   - Xóa lịch (Mentor only)

4. **📅 Bookings Management**
   - Mentee: Tạo booking từ schedule
   - Mentor: Xem bookings đã nhận, confirm/cancel
   - Theo dõi trạng thái booking (Pending/Confirmed/Cancelled/Completed)
   - Ghi chú cho mỗi booking

5. **⭐ Feedback System**
   - Mentee: Đánh giá sau session (rating 1-5 sao)
   - Xem feedback history
   - Comment chi tiết

6. **👤 Profile Management**
   - Mentor Profile: Bio, Expertise (tags), Years of Experience
   - Mentee Profile: Interests (tags), Goals
   - Update profile anytime

7. **🔐 Admin - Permission Management**
   - Quản lý permissions cho users
   - Quản lý permissions cho roles
   - Grant/Revoke/Remove permissions
   - Bulk edit role permissions

8. **🧭 Navigation**
   - Responsive navigation bar
   - Quick access to all features
   - Mobile-friendly hamburger menu
   - User info display

## 🚀 Cài đặt và chạy

### Prerequisites
```bash
Node.js >= 16.x
npm hoặc yarn
```

### Backend API
```bash
cd mentor-mentee-api
npm install
npm run dev
```

### Frontend
```bash
cd mentor-mentee-frontend
npm install
npm start
```

## 📁 Cấu trúc thư mục

```
src/
├── components/
│   ├── Auth/              # Login, Register, OTP, ForgotPassword
│   ├── Navigation/        # Navigation bar
│   ├── Posts/             # Post management
│   ├── Schedules/         # Schedule management
│   ├── Bookings/          # Booking management
│   ├── Feedbacks/         # Feedback system
│   ├── Profile/           # Profile management
│   ├── Permissions/       # Admin permission management
│   ├── Dashboard.tsx      # Main dashboard
│   └── ProtectedRoute.tsx # Route protection
├── services/
│   ├── api.ts            # Base axios config
│   ├── postApi.ts        # Posts API
│   ├── scheduleApi.ts    # Schedules API
│   ├── bookingApi.ts     # Bookings API
│   ├── sessionApi.ts     # Sessions API
│   ├── feedbackApi.ts    # Feedbacks API
│   ├── profileApi.ts     # Profiles API
│   ├── notificationApi.ts # Notifications API
│   └── permissionApi.ts  # Permissions API
├── types/
│   ├── auth.ts           # Auth types
│   ├── common.ts         # Common types
│   ├── post.ts           # Post types
│   ├── schedule.ts       # Schedule types
│   ├── booking.ts        # Booking types
│   ├── session.ts        # Session types
│   ├── feedback.ts       # Feedback types
│   ├── profile.ts        # Profile types
│   ├── notification.ts   # Notification types
│   └── permission.ts     # Permission types
├── context/
│   └── AuthContext.tsx   # Authentication context
└── App.tsx               # Main app with routes
```

## 🎨 Design System

### Colors
- **Primary Gradient**: `#667eea → #764ba2` (Purple)
- **Success**: `#10b981` (Green)
- **Warning**: `#fbbf24` (Yellow)
- **Danger**: `#ef4444` (Red)
- **Info**: `#4facfe` (Blue)

### Components
- **Cards**: White background, rounded corners, subtle shadows
- **Buttons**: Gradient backgrounds, hover effects
- **Forms**: Clean inputs with focus states
- **Navigation**: Gradient background, sticky top

## 🔑 User Roles & Permissions

### ADMIN
- Full access to all features
- Manage permissions
- View all data

### MENTOR
- Create and manage schedules
- Confirm/cancel bookings
- Start/end sessions
- Create posts
- View feedbacks

### MENTEE
- Browse schedules
- Book sessions
- Give feedback
- Like posts
- View own bookings

## 🌐 Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/` | Redirect to Dashboard | All |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/register-otp` | OTP Registration | Public |
| `/forgot-password` | Forgot Password | Public |
| `/dashboard` | Dashboard | Protected |
| `/posts` | Post List | Protected |
| `/schedules` | Schedule List | Protected |
| `/bookings` | Booking List | Protected |
| `/feedback` | Feedback Form | Protected |
| `/profile` | Profile Form | Protected |
| `/admin/permissions` | Permission Dashboard | Admin only |

## 📱 Responsive Design

- **Desktop**: Full featured layout
- **Tablet**: Optimized grid layouts
- **Mobile**: Hamburger menu, stacked layouts

## 🔧 API Integration

Tất cả components đã tích hợp đầy đủ với backend API:
- GET, POST, PUT, DELETE operations
- Error handling
- Loading states
- Success/Error messages

## 🎯 Workflow Examples

### Mentor tạo lịch và nhận booking
1. Mentor login → Navigate to Schedules
2. Click "Create Schedule" → Set start/end time
3. Mentee xem schedules → Click "Book Now"
4. Mentor vào Bookings → Confirm booking
5. Session diễn ra → Mentee give feedback

### Admin quản lý permissions
1. Admin login → Navigate to Permissions
2. Tab "User Permissions": Tìm user → Grant/Revoke permissions
3. Tab "Role Permissions": Select role → Bulk edit permissions

## 🐛 Debugging

### Common Issues
1. **API connection failed**: Kiểm tra backend đã chạy chưa
2. **CORS error**: Đảm bảo backend config CORS đúng
3. **Token expired**: Logout và login lại
4. **Permission denied**: Kiểm tra role và permissions

## 📝 Notes

- Tất cả form đều có validation
- Loading states được hiển thị khi fetch data
- Error messages được hiển thị rõ ràng
- Responsive trên mọi thiết bị
- Clean code với TypeScript typing đầy đủ

## 🎉 Features Highlights

✅ **52 Permissions** system hoàn chỉnh
✅ **RBAC** (Role-Based Access Control)
✅ **Real-time** booking status
✅ **Rating system** với stars
✅ **Tag input** cho skills/interests
✅ **Responsive navigation**
✅ **Beautiful gradients**
✅ **Smooth animations**
✅ **Mobile-first** design

---

**Developed with ❤️ by PBL6 Team**
