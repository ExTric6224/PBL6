# 🎓 MentorMentee Frontend - Complete Platform

Beautiful, responsive React.js application for the MentorMentee platform with full feature set.

## ✨ Features

### 🔐 Authentication & Security
- User Authentication (Login/Register with OTP)
- Forgot Password flow
- JWT token management
- Role-based access control (RBAC)
- Protected routes

### 📝 Posts Management
- View all community posts
- Create posts (Mentor/Admin)
- Edit/Delete own posts
- Like/Unlike posts
- Pagination support

### 🗓️ Schedules System
- **Mentors**: Create and manage availability schedules
- **Mentees**: Browse available mentors and time slots
- Filter by status (Available/Booked/Cancelled)
- Real-time status updates

### 📅 Bookings Management
- **Mentees**: Book mentor sessions with notes
- **Mentors**: View, confirm, or cancel bookings
- Track booking status (Pending/Confirmed/Cancelled/Completed)
- Complete booking history

### ⭐ Feedback System
- Star rating (1-5 stars) with interactive UI
- Written feedback/comments
- View feedback history
- Mentee can give feedback after completed sessions

### 👤 Profile Management
- **Mentor Profile**: Bio, expertise tags, years of experience
- **Mentee Profile**: Interest tags, learning goals
- Create and update profiles anytime
- Beautiful tag input interface

### � Admin - Permission Management
- Grant/Revoke user permissions
- Manage role-based permissions
- Bulk edit role permissions
- Visual override indicators (green/red)
- Complete RBAC system with 52 permissions

### � Navigation
- Responsive navigation bar with mobile menu
- Quick access to all features
- User info display
- Role-based menu items

## 🚀 Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe code
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **Context API** - State management
- **CSS3** - Gradients, animations, flexbox, grid

## 📁 Project Structure

```
src/
├── components/
│   ├── Auth/              # Authentication components
│   ├── Navigation/        # Navigation bar
│   ├── Posts/             # Posts management
│   ├── Schedules/         # Schedule management
│   ├── Bookings/          # Booking system
│   ├── Feedbacks/         # Feedback system
│   ├── Profile/           # Profile management
│   ├── Permissions/       # Admin permission management
│   └── Dashboard.tsx      # Main dashboard
├── services/              # API integration layer
├── types/                 # TypeScript definitions
├── context/               # React Context
└── App.tsx                # Main app with routes
```

## 🎯 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on port 3000
- MentorMentee API running on http://localhost:3000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
```
REACT_APP_API_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
npm start
```

The app will open at http://localhost:3001

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── AuthForm.css
│   ├── Dashboard.tsx
│   └── ProtectedRoute.tsx
├── context/
│   └── AuthContext.tsx
├── services/
│   └── api.ts
├── types/
│   └── auth.ts
├── App.tsx
├── App.css
├── index.tsx
└── index.css
```

## API Integration

The frontend integrates with the MentorMentee API endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/health` - Health check

## Authentication Flow

1. User registers/logs in through the auth forms
2. JWT token is stored in localStorage
3. Token is automatically included in API requests
4. User state is managed through AuthContext
5. Protected routes redirect to login if not authenticated

## Test Accounts

For testing purposes, you can use these demo accounts:

**Mentor Account:**
- Email: mentor@example.com
- Password: mentor123

**Mentee Account:**
- Email: mentee@example.com
- Password: mentee123

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.