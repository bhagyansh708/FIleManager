# FileManager - Security Architecture Documentation

## Overview

This document details the security architecture of the FileManager API, built on a Zero-Trust principle where every operation is verified and scoped to the authenticated user.

## 1. Authentication Layer

### JWT-Based Authentication

**File**: `src/middleware/auth.js`

The `authenticateUser` middleware implements the following security measures:

#### Token Extraction & Validation
```javascript
- Validates Authorization header format: "Bearer <token>"
- Extracts JWT token
- Verifies signature using JWT_SECRET
- Handles token expiration & malformation
```

#### Error Handling
```javascript
- TokenExpiredError: Return 401 with "Token has expired"
- JsonWebTokenError: Return 401 with "Invalid token"
- Generic auth failures: Return 401 with "Authentication failed"
```

#### User Context Attachment
```javascript
req.user = {
  id: decoded.userId,      // User's MongoDB ObjectId
  email: decoded.email     // User's email
}
```

This `req.user` object is used throughout the application to enforce Zero-Trust access control.

### Password Security

**File**: `src/models/User.js`

- Bcrypt hashing with 10 salt rounds
- Pre-save hook automatically hashes passwords
- `matchPassword()` method for secure comparison
- Passwords excluded from responses (select: false)

## 2. Zero-Trust Data Access

### Core Principle
**Every database query must include `{ user_id: req.user.id }`**

### Implementation

#### Search Endpoint Example
```javascript
// src/routes/files.js
router.get('/search', authenticateUser, async (req, res) => {
  const query = { user_id: req.user.id }; // ZERO-TRUST ENFORCEMENT
  
  if (file_name) {
    query.file_name = { $regex: file_name, $options: 'i' };
  }
  if (file_number) {
    query.file_number = file_number;
  }
  
  const files = await File.find(query);
  // ...
});
```

#### Ownership Verification
```javascript
// GET /api/files/:id - Verify user owns the file
if (file.user_id.toString() !== req.user.id) {
  return res.status(403).json({ message: 'Access denied.' });
}
```

### Benefits
- **IDOR Prevention**: Users cannot access other users' files
- **Data Isolation**: Complete separation of user data at query level
- **Auditability**: All queries traced to authenticated user

## 3. HTTP Security

### Helmet Middleware

**File**: `src/config/security.js`

Configures HTTP headers to prevent common attacks:

```javascript
Content-Security-Policy: Restricts resource loading
X-Content-Type-Options: Prevents MIME sniffing
X-Frame-Options: Prevents clickjacking
Strict-Transport-Security: Enforces HTTPS (1 year)
```

## 4. Rate Limiting

### Tiered Rate Limiting Strategy

#### Global Rate Limiter
- **Limit**: 100 requests per 15 minutes
- **Applied to**: All routes
- **Purpose**: General DDoS protection

#### Search Rate Limiter
- **Limit**: 30 requests per minute
- **Applied to**: `/api/files/search`
- **Purpose**: Prevent search enumeration attacks

#### Authentication Rate Limiter
- **Limit**: 5 failed attempts per 15 minutes
- **Applied to**: `/api/auth/register`, `/api/auth/login`
- **Purpose**: Brute-force protection
- **Configuration**: Only counts failed requests (`skipSuccessfulRequests: true`)

## 5. NoSQL Injection Prevention

### Express Mongo Sanitize

**File**: `src/config/security.js`

```javascript
app.use(mongoSanitize({
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized field: ${key}`);
  }
}));
```

**Protection Against**:
```
// Blocked attempts
{ email: { $ne: null } }      // Returns all users
{ password: { $regex: "" } }  // Pattern matching attack
```

**Result**:
```
// Sanitized to
{ email: "\"{ $ne: null }\"" } // String literal
```

## 6. Input Validation

### Search Endpoint Validation
```javascript
// At least one parameter required
if (!file_name && !file_number) {
  return res.status(400).json({
    message: 'Please provide at least one search parameter.'
  });
}

// Pattern matching (case-insensitive)
query.file_name = { $regex: file_name, $options: 'i' };

// Exact match
query.file_number = file_number;
```

### Database Schema Validation
```javascript
// Mongoose validates types and required fields
file_name: { type: String, required: true, trim: true }
file_number: { type: String, required: true }
user_id: { type: ObjectId, required: true }
```

## 7. Error Handling & Logging

**File**: `src/middleware/errorHandler.js`

### Client-Side Error Messages
```javascript
// Always generic
"Internal Server Error"
"Authentication failed."
"File not found."
```

### Server-Side Logging
```javascript
console.error('Error Details:', {
  message: err.message,
  stack: err.stack,
  timestamp: new Date().toISOString(),
  url: req.originalUrl,
  method: req.method
});
```

### Security Event Logging
```javascript
// IDOR attempt detection
console.warn(`IDOR Attempt: User ${req.user.id} tried to access file ${fileId}`);

// Failed login tracking
console.warn(`Failed login attempt for email: ${email}`);

// Sanitization events
console.warn(`Sanitized field: ${key}`);
```

## 8. Database Security

### Indexes for Performance & Security

```javascript
// Single field indexes
fileSchema.index({ user_id: 1 });         // Fast user lookups
fileSchema.index({ file_name: 1 });       // Fast name searches
fileSchema.index({ file_number: 1 });     // Fast number lookups
fileSchema.index({ created_at: 1 });      // Fast date sorting

// Compound indexes (Zero-Trust optimization)
fileSchema.index({ user_id: 1, file_name: 1 });
fileSchema.index({ user_id: 1, file_number: 1 });
```

### Data Retention
- Automatic timestamp creation on file creation
- Track updates with `updated_at` field
- Enable audit trails via timestamps

## 9. CORS Configuration

```javascript
cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
})
```

**Protection**:
- Only specified origin can access API
- Credentials included in cross-origin requests
- Other origins receive CORS errors

## 10. Environment Security

### Sensitive Configuration
```
JWT_SECRET       → Never exposed
DB_URI           → Specific to environment
CORS_ORIGIN      → Locked to frontend domain
RATE_LIMIT_*     → Tunable per environment
```

### Development vs Production
```javascript
if (isDevelopment) {
  // Include stack traces
  errorResponse.stack = err.stack;
} else {
  // Hide implementation details
  errorResponse.message = 'Internal Server Error';
}
```

## 11. Attack Vectors Mitigated

| Attack Vector | Mitigation |
|---|---|
| SQL/NoSQL Injection | mongo-sanitize, Mongoose validation |
| IDOR | Zero-Trust user_id scoping, ownership verification |
| Brute Force | Rate limiting on auth endpoints |
| Search Enumeration | Rate limiting on search endpoint |
| Clickjacking | Helmet X-Frame-Options |
| MIME Sniffing | Helmet X-Content-Type-Options |
| XSS | Helmet CSP, input validation |
| CSRF | CORS restrictions |
| Token Hijacking | HTTPS (via Helmet HSTS), short expiry |
| Password Attacks | Bcrypt hashing, rate limiting |
| Unauthorized Access | JWT authentication on all protected routes |

## 12. Deployment Checklist

- [ ] Set `JWT_SECRET` to strong random value (min 32 chars)
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS/TLS in production
- [ ] Set `DB_URI` to production MongoDB instance
- [ ] Configure `CORS_ORIGIN` to production frontend domain
- [ ] Enable MongoDB authentication
- [ ] Set up monitoring & alerting
- [ ] Configure log aggregation
- [ ] Enable request logging (Morgan/Winston)
- [ ] Implement backup strategy
- [ ] Set up CI/CD with security scanning
- [ ] Regular security audits & penetration testing

## 13. Recommended Enhancements

1. **Logging & Monitoring**
   - Implement Winston for structured logging
   - Set up ELK stack or CloudWatch

2. **Audit Trails**
   - Log all file operations with user context
   - Track failed access attempts

3. **2FA/MFA**
   - Add optional two-factor authentication
   - Support TOTP or SMS verification

4. **API Documentation**
   - Add Swagger/OpenAPI documentation
   - Document all security headers

5. **Security Headers**
   - Add X-API-Version header
   - Implement signature verification for webhook payloads

6. **Testing**
   - Add unit tests for auth middleware
   - Integration tests for Zero-Trust enforcement
   - Security test suite for attack vectors

7. **Encryption**
   - Encrypt sensitive file metadata
   - Consider field-level encryption for PII

8. **API Versioning**
   - Implement API versioning strategy
   - Maintain backward compatibility
