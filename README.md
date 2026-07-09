# FileManager - Secure Web Application

A production-ready FileManager API built with **Node.js, Express, MongoDB**, and featuring a **Zero-Trust Security Architecture**.

## 🔐 Security First

This project implements enterprise-grade security practices:
- **Zero-Trust Architecture**: Every query scoped to authenticated user
- **JWT Authentication**: Secure token-based auth with bcrypt password hashing
- **HTTP Security**: Helmet for secure headers (CSP, HSTS, etc.)
- **Rate Limiting**: Protection against brute-force & enumeration attacks
- **NoSQL Injection Prevention**: MongoDB sanitization
- **IDOR Prevention**: Strict ownership verification on all resources

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14
- MongoDB >= 4.0

### Installation

```bash
# Clone repository
git clone https://github.com/bhagyansh708/FIleManager.git
cd FIleManager

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT_SECRET

# Start development server
npm run dev
```

### Production Build
```bash
npm start
```

## 📚 Documentation

- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Complete project layout, API endpoints, and usage examples
- **[SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md)** - Deep dive into security implementation and attack vector mitigation

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Files (Authenticated)
- `GET /api/files/search?file_name=...&file_number=...` - Search files
- `GET /api/files?page=1&limit=20` - List all files
- `GET /api/files/:id` - Get file details
- `POST /api/files` - Create file
- `DELETE /api/files/:id` - Delete file

### Health Check
- `GET /health` - API status

## 🛡️ Security Features

| Feature | Description |
|---------|-------------|
| **Zero-Trust** | Every DB query includes `user_id` from JWT |
| **JWT Auth** | Token-based authentication with expiry |
| **Bcrypt** | Password hashing with 10 salt rounds |
| **Helmet** | HTTP security headers (CSP, HSTS, clickjacking prevention) |
| **Rate Limiting** | Global (100/15min), Search (30/min), Auth (5/15min) |
| **NoSQL Sanitize** | Blocks injection attempts |
| **CORS** | Configurable origin restriction |
| **Error Handling** | Generic messages to clients, detailed server logging |
| **Input Validation** | Schema validation on all endpoints |
| **Timestamps** | Automatic tracking of create/update times |

## 📋 Environment Variables

```env
PORT=5000                          # Server port
NODE_ENV=development               # development/production
DB_URI=mongodb://localhost:27017/filemanager  # MongoDB connection
JWT_SECRET=your_secret_key         # ⚠️ CHANGE IN PRODUCTION
JWT_EXPIRY=7d                      # Token expiry time
RATE_LIMIT_WINDOW_MS=900000        # Rate limit window (ms)
RATE_LIMIT_MAX_REQUESTS=100        # Max requests per window
CORS_ORIGIN=http://localhost:3000  # Allowed CORS origin
```

## 🧪 Testing

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Search Files (with token)
```bash
curl -X GET "http://localhost:5000/api/files/search?file_name=document" \
  -H "Authorization: Bearer <your_token_here>"
```

## 📁 Project Structure

```
src/
├── config/
│   ├── database.js          # MongoDB configuration
│   └── security.js          # Security middleware setup
├── middleware/
│   ├── auth.js              # JWT authentication
│   └── errorHandler.js      # Error handling
├── models/
│   ├── User.js              # User schema
│   └── File.js              # File schema
├── routes/
│   ├── auth.js              # Auth endpoints
│   └── files.js             # File CRUD endpoints
└── server.js                # Express app setup
```

## ⚙️ Architecture Highlights

### Zero-Trust Data Access
```javascript
// Every query automatically scoped to user
const query = { user_id: req.user.id };
```

### Ownership Verification
```javascript
// Prevents IDOR attacks
if (file.user_id.toString() !== req.user.id) {
  return res.status(403).json({ message: 'Access denied.' });
}
```

### Secure Error Handling
```javascript
// Client receives generic message
res.status(500).json({ message: 'Internal Server Error' });

// Server logs details
console.error(`Actual error: ${err.message}`, err.stack);
```

## 🚀 Production Deployment

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random value (32+ chars)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/TLS
- [ ] Enable MongoDB authentication
- [ ] Configure `CORS_ORIGIN` to your frontend domain
- [ ] Set up monitoring and alerting
- [ ] Configure log aggregation
- [ ] Run security audit & penetration testing
- [ ] Set up automated backups

## 📊 Performance Optimizations

- **Database Indexes**: Optimized for user-scoped queries
- **Pagination**: Built-in support on file listing
- **Query Caching**: Via indexes on frequently searched fields
- **Connection Pooling**: Mongoose connection optimization

## 🔄 Development Workflow

```bash
# Start development with auto-reload
npm run dev

# Production build
npm start

# Run tests (when implemented)
npm test
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues or questions, please create a GitHub issue or refer to the documentation files.

---

**Built with Security First Principles** 🔒
