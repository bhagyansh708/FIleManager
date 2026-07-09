# FileManager Project Structure

```
FileManager/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection configuration
│   │   └── security.js          # Security middleware (helmet, rate-limit, sanitize)
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware (authenticateUser)
│   │   └── errorHandler.js      # Global error handler & async wrapper
│   ├── models/
│   │   ├── User.js              # User schema with bcrypt password hashing
│   │   └── File.js              # File schema with user_id scoping
│   ├── routes/
│   │   ├── auth.js              # Authentication routes (register, login)
│   │   └── files.js             # File routes (search, create, read, delete)
│   └── server.js                # Express app setup & server initialization
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore configuration
├── package.json                 # Dependencies & scripts
└── PROJECT_STRUCTURE.md         # This file
```

## Key Security Features

### 1. **Zero-Trust Architecture**
- Every database query includes `{ user_id: req.user.id }`
- User_id is extracted from JWT payload via `authenticateUser` middleware
- IDOR (Insecure Direct Object Reference) prevention on all endpoints

### 2. **Authentication & Encryption**
- JWT-based authentication with configurable expiry
- Bcrypt password hashing (salt rounds: 10)
- Passwords never returned in responses (select: false)

### 3. **Security Middleware**
- **Helmet**: HTTP headers security (CSP, HSTS, etc.)
- **Express Rate Limit**: Brute-force protection
  - Global: 100 requests/15 minutes
  - Search: 30 requests/minute
  - Auth: 5 attempts/15 minutes
- **MongoDB Sanitize**: NoSQL injection prevention

### 4. **Data Protection**
- Generic error messages to clients
- Detailed error logging server-side
- CORS configuration for frontend security
- Input validation on all endpoints

### 5. **Database Optimization**
- Indexed fields: user_id, file_name, file_number, created_at
- Compound indexes for efficient user-scoped queries
- Automatic timestamps management

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
PORT=5000
NODE_ENV=development
DB_URI=mongodb://localhost:27017/filemanager
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRY=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3000
```

⚠️ **IMPORTANT**: Change JWT_SECRET in production!

## Installation & Setup

```bash
# Install dependencies
npm install

# Start MongoDB locally (if using local instance)
mongod

# Development server (with auto-restart)
npm run dev

# Production server
npm start
```

## API Usage Examples

### 1. Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "confirmPassword": "securepassword123"
}
```

### 2. Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response:
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "email": "user@example.com" }
}
```

### 3. Search Files (Authenticated)
```bash
GET /api/files/search?file_name=document&file_number=12345
Authorization: Bearer <token>
```

### 4. Get All Files
```bash
GET /api/files?page=1&limit=20
Authorization: Bearer <token>
```

### 5. Create File
```bash
POST /api/files
Authorization: Bearer <token>
Content-Type: application/json

{
  "file_name": "Important Document",
  "file_number": "DOC-2024-001",
  "file_path": "/uploads/doc.pdf",
  "file_size": 2048576,
  "mime_type": "application/pdf"
}
```

### 6. Delete File
```bash
DELETE /api/files/60d5ec49c1234567890abcde
Authorization: Bearer <token>
```

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Generic error message for client"
}
```

Detailed errors are logged server-side:
```
Error Details: {
  message: "Actual error message",
  stack: "Full stack trace",
  timestamp: "2024-01-15T10:30:00.000Z",
  url: "/api/files/search",
  method: "GET"
}
```

## Security Best Practices Implemented

✅ Zero-Trust architecture (user_id scoping on all queries)
✅ JWT-based authentication
✅ Bcrypt password hashing
✅ Helmet security headers
✅ Rate limiting (global + endpoint-specific)
✅ NoSQL injection prevention
✅ CORS configuration
✅ Generic error messages to clients
✅ Detailed server-side logging
✅ IDOR prevention via ownership verification
✅ Input validation
✅ Async/await patterns
✅ Environment variable management (.env)
✅ Database indexing for performance
✅ Automatic timestamp management

## Next Steps

1. Configure MongoDB connection string
2. Set JWT_SECRET to a strong, random value
3. Deploy with HTTPS only
4. Implement request logging (Morgan, Winston)
5. Add unit & integration tests
6. Set up CI/CD pipeline
7. Configure monitoring & alerting
8. Implement audit logging for sensitive operations
