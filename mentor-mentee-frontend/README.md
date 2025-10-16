# MentorMentee Frontend

Frontend React.js application for the MentorMentee platform.

## Features

- 🔐 User Authentication (Login/Register)
- 👥 Role-based access (Mentor/Mentee)
- 🛡️ Protected routes
- 📱 Responsive design
- 🎨 Modern UI with animations
- ⚡ TypeScript support
- 🔄 Automatic token refresh
- 🧪 Test accounts included

## Tech Stack

- React 18
- TypeScript
- React Router v6
- Axios for API calls
- Context API for state management
- CSS3 with modern features

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
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