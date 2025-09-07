# MentorMentee API

A comprehensive mentoring platform API built with Node.js, TypeScript, Express, and Prisma ORM.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (ADMIN, MENTOR, MENTEE)
- **User Profiles**: Separate profiles for mentors and mentees with detailed information
- **Schedule Management**: Mentors can create and manage mentoring schedules
- **Booking System**: Mentees can book available sessions with capacity management
- **Session Tracking**: Track mentoring sessions from start to end
- **Feedback System**: Mentees can rate and provide feedback on completed sessions
- **Notifications**: In-app notification system for users
- **Security**: Helmet, CORS, rate limiting, input validation
- **Logging**: Structured logging with Pino
- **Database**: MySQL with Prisma ORM

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MySQL 8
- **ORM**: Prisma
- **Authentication**: JWT (HS256)
- **Password Hashing**: bcrypt (12 rounds)
- **Validation**: Zod
- **Logging**: Pino
- **Security**: Helmet, CORS, express-rate-limit
- **Error Handling**: express-async-errors

## System Requirements

- Node.js 18+ 
- MySQL 8+
- npm or yarn
- Docker & Docker Compose (optional)

## Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd mentor-mentee-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Database
DATABASE_URL="mysql://myapp:secret@localhost:3306/myapp?connection_limit=10"

# Server
PORT=3000

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

### 4. Database Setup

#### Using Local MySQL

1. Ensure MySQL is running on your system
2. Create a database named `myapp`
3. Update DATABASE_URL in `.env` with your credentials

#### Using Docker

```bash
# Start MySQL container
docker run --name mysql-dev -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=myapp -e MYSQL_USER=myapp -e MYSQL_PASSWORD=secret -p 3306:3306 -d mysql:8
```

### 5. Database Migration & Seeding

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run migrate

# Seed database with sample data
npm run seed
```

### 6. Development

```bash
# Start development server with hot reload
npm run dev
```

The API will be available at: `http://localhost:3000/api`

### 7. Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker compose up --build

# Run in background
docker compose up -d --build
```

This will start:
- MySQL database on port 3306
- API server on port 3000

### Using Docker only

```bash
# Build image
docker build -t mentor-mentee-api .

# Run container
docker run -p 3000:3000 --env-file .env mentor-mentee-api
```

## API Documentation

### Base URL
- Development: `http://localhost:3000/api`
- Health Check: `http://localhost:3000/api/health`

### Authentication

The API uses JWT Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Test Accounts (After Seeding)

- **Admin**: `admin@example.com` / `admin123`
- **Mentor**: `mentor@example.com` / `mentor123`  
- **Mentee**: `mentee@example.com` / `mentee123`

## Quick Test Flow with curl

### 1. Register a new user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123"
  }'
```

### 2. Login to get token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mentor@example.com",
    "password": "mentor123"
  }'
```

Save the token from the response and use it in subsequent requests.

### 3. Get current user info

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Create mentor profile (MENTOR role only)

```bash
curl -X POST http://localhost:3000/api/profiles/mentor \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "school": "MIT",
    "expertise": ["Backend", "Mobile", "DevOps"],
    "degree": "Master of Computer Science",
    "yearsExp": 5,
    "bio": "Experienced software engineer"
  }'
```

### 5. Create a schedule (MENTOR role only)

```bash
curl -X POST http://localhost:3000/api/schedules \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Backend Development Fundamentals",
    "startAt": "2024-12-01T14:00:00.000Z",
    "endAt": "2024-12-01T15:00:00.000Z",
    "capacity": 3
  }'
```

### 6. Login as mentee and book a session

```bash
# Login as mentee
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mentee@example.com",
    "password": "mentee123"
  }'

# Book a schedule
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer MENTEE_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleId": 1
  }'
```

### 7. Confirm booking (MENTOR role)

```bash
curl -X PATCH http://localhost:3000/api/bookings/1/confirm \
  -H "Authorization: Bearer MENTOR_TOKEN_HERE"
```

### 8. Start session (MENTOR role)

```bash
curl -X POST http://localhost:3000/api/sessions/start \
  -H "Authorization: Bearer MENTOR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": 1
  }'
```

### 9. End session (MENTOR role)

```bash
curl -X POST http://localhost:3000/api/sessions/end \
  -H "Authorization: Bearer MENTOR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": 1,
    "notes": "Great session covering backend fundamentals"
  }'
```

### 10. Provide feedback (MENTEE role)

```bash
curl -X POST http://localhost:3000/api/feedbacks \
  -H "Authorization: Bearer MENTEE_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": 1,
    "rating": 5,
    "comment": "Excellent session! Very informative."
  }'
```

### 11. Check notifications

```bash
curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Postman Collection

Import `MentorMentee.postman_collection.json` into Postman for a complete API testing suite. The collection includes:

- All endpoints with example requests
- Authentication setup with token management
- Test scripts for automated workflows
- Environment variables for easy configuration

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Profiles
- `POST /api/profiles/mentor` - Create/update mentor profile
- `GET /api/profiles/mentor/:userId` - Get mentor profile
- `POST /api/profiles/mentee` - Create/update mentee profile
- `GET /api/profiles/mentee/:userId` - Get mentee profile

### Schedules
- `POST /api/schedules` - Create schedule (MENTOR)
- `GET /api/schedules` - List schedules with filters
- `PATCH /api/schedules/:id` - Update schedule (MENTOR)
- `DELETE /api/schedules/:id` - Cancel schedule (MENTOR)

### Bookings
- `POST /api/bookings` - Create booking (MENTEE)
- `PATCH /api/bookings/:id/confirm` - Confirm booking (MENTOR)
- `PATCH /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/my` - Get user's bookings

### Sessions
- `POST /api/sessions/start` - Start session (MENTOR)
- `POST /api/sessions/end` - End session (MENTOR)
- `GET /api/sessions/my` - Get user's sessions

### Feedbacks
- `POST /api/feedbacks` - Create feedback (MENTEE)
- `GET /api/feedbacks/mentor/:mentorId` - Get mentor's feedbacks
- `GET /api/feedbacks/my` - Get user's feedbacks

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read

### Health Check
- `GET /api/health` - Service health status

## Error Handling

All API responses follow a consistent error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

Error codes:
- `VALIDATION_ERROR` - Input validation failed
- `AUTH_ERROR` - Authentication/authorization failed
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Conflict with existing data
- `INTERNAL` - Internal server error

## Security Features

- **Helmet**: Sets security-related HTTP headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Comprehensive validation with Zod
- **Password Hashing**: Secure bcrypt hashing (12 rounds)
- **JWT Authentication**: Stateless authentication with HS256
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **Sensitive Data Redaction**: Passwords and tokens not logged

## Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check if MySQL is running
mysql -u root -p

# Verify database exists
SHOW DATABASES;

# Check user permissions
SHOW GRANTS FOR 'myapp'@'%';
```

#### Migration Errors

```bash
# Reset database and rerun migrations
npx prisma migrate reset

# Force push schema changes
npx prisma db push
```

#### JWT Token Issues

- Ensure `JWT_SECRET` is set in environment
- Check token expiration (7 days default)
- Verify token format: `Bearer <token>`

#### Rate Limiting

- Auth endpoints: 10 requests per 15 minutes
- Other endpoints: 100 requests per 15 minutes
- Wait for the window to reset or adjust limits in `app.ts`

#### Docker Issues

```bash
# Check container logs
docker compose logs api
docker compose logs db

# Restart services
docker compose restart

# Clean rebuild
docker compose down -v
docker compose up --build
```

### Logs

Application logs are structured JSON with Pino:

```bash
# View logs in development
npm run dev

# In Docker
docker compose logs -f api
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Test with the provided Postman collection
4. Create an issue with detailed information
