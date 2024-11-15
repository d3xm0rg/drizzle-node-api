# Node.js Authentication API with Drizzle ORM

A robust, secure authentication API built with Node.js, Express, and Drizzle ORM. This project implements best practices for user authentication, session management, and security.

## Features

- 🔐 **Secure Authentication**

  - User registration and login
  - Password hashing with bcrypt
  - Session-based authentication
  - Password reset functionality
  - Rate limiting for security
  - Brute force protection

- 📦 **Modern Stack**

  - Node.js with Express
  - TypeScript for type safety
  - Drizzle ORM for database operations
  - PostgreSQL database
  - Zod for validation

- 🛡️ **Security Features**

  - CSRF protection
  - Session management
  - IP tracking
  - User agent tracking
  - Login attempt monitoring
  - Secure password reset flow

- 🔄 **Session Management**
  - PostgreSQL session store
  - Configurable session expiration
  - Multiple device session tracking
  - Session termination capability

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

## Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd node-drizzle-api
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# Create a .env file and add the following variables
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SESSION_SECRET=your-secure-session-secret
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
APP_URL=http://localhost:3000
```

4. Run database migrations:

```bash
npm run migrate
```

5. Seed the database (optional):

```bash
npm run seed
```

## Development

Start the development server:

```bash
npm run dev
```

Generate database migrations:

```bash
npm run generate
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile

### Password Management

- `POST /api/auth/password-reset` - Request password reset
- `POST /api/auth/password-reset/:token` - Reset password

### Session Management

- `GET /api/auth/sessions` - Get all active sessions
- `DELETE /api/auth/sessions/:sessionId` - Terminate specific session

## Database Schema

### Users Table

- `id` - Serial Primary Key
- `firstName` - VARCHAR(50)
- `lastName` - VARCHAR(50)
- `email` - VARCHAR(255) Unique
- `password` - Text (Hashed)
- `createdAt` - Timestamp

### Sessions Table

- `sid` - VARCHAR Primary Key
- `sess` - JSON
- `expire` - Timestamp
- `userId` - Integer (Foreign Key)
- `userAgent` - Text
- `ipAddress` - VARCHAR(45)
- `lastActivity` - Timestamp
- `createdAt` - Timestamp

### Password Resets Table

- `id` - Serial Primary Key
- `userId` - Integer (Foreign Key)
- `token` - Text
- `expiresAt` - Timestamp
- `used` - Boolean
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

## Security Considerations

- Passwords are hashed using bcrypt
- Session tokens are securely stored
- Rate limiting is implemented for sensitive endpoints
- Login attempts are monitored and tracked
- Sessions expire after 24 hours of inactivity
- Password reset tokens expire after 1 hour
- All input is validated using Zod schemas

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
