# 🔐 Stateless Auth Service Architecture

## ✅ **Correct Architecture - Refactored**

The auth service has been **completely refactored** to be **stateless** as you correctly pointed out.

---

## 📐 **Service Responsibilities**

### **Auth Service (Stateless)** ✅

**Location:** `services/auth/`

**What it does:**

- ✅ JWT token generation & verification
- ✅ Session management (Redis-based)
- ✅ Refresh token rotation (Redis-based)
- ✅ Device fingerprinting
- ✅ Delegates user operations to Users Service

**What it does NOT do:**

- ❌ Store user data in database
- ❌ Password hashing/validation
- ❌ Email verification
- ❌ MFA management
- ❌ Login history tracking
- ❌ Device persistence

**Storage:**

- ✅ Redis for sessions
- ✅ Redis for refresh tokens
- ❌ NO PostgreSQL database

---

### **Users Service (Owns User Data)**

**Location:** `services/users/`

**Should implement:**

- User registration
- Password hashing & validation
- Email verification
- Password reset
- MFA setup & verification
- Login history
- Security events
- Device tracking (persistent)
- User profile management

**Database Schema:**

```sql
-- users table
users {
  id
  email
  passwordHash
  firstName
  lastName
  emailVerified
  mfaEnabled
  mfaSecret (encrypted)
  devices (jsonb or separate table)
  failedLoginAttempts
  accountLocked
  lockedUntil
  lastLoginAt
  createdAt
  updatedAt
}

-- login_history table
login_history {
  id
  userId
  success
  ipAddress
  deviceId
  userAgent
  timestamp
}

-- password_history table (optional)
password_history {
  id
  userId
  passwordHash
  createdAt
}
```

---

## 🔄 **Communication Flow**

### **1. Signup Flow**

```
Client → Auth Service → Users Service
                      ↓
                   Create User
                   Send Verification Email
                      ↓
Client ← Auth Service ← Success Response
```

### **2. Login Flow**

```
Client → Auth Service → Users Service (validate credentials)
                      ↓
                   Verify password
                   Check MFA
                   Log attempt
                      ↓
      Auth Service ← User data
           ↓
      Create session in Redis
      Generate JWT tokens
      Store refresh token in Redis
           ↓
Client ← Tokens (HTTP-only cookies)
```

### **3. Token Refresh Flow**

```
Client → Auth Service
           ↓
      Verify refresh token (Redis)
      Rotate token (delete old, create new)
      Generate new access token
           ↓
Client ← New tokens
```

---

## 🗄️ **Storage Architecture**

### **Redis (Auth Service)**

```
Key Pattern                    | Value                          | TTL
------------------------------ | ------------------------------ | --------
session:{sessionId}            | SessionData (JSON)             | 30 min
refresh_token:{tokenHash}      | Token metadata (JSON)          | 7 days
token_family:{familyId}        | Set of token hashes            | 7 days
user_sessions:{userId}         | Set of session IDs             | 30 min
```

### **PostgreSQL (Users Service)**

```
Tables:
- users
- login_history
- security_events
- password_history (optional)
```

---

## 📦 **What's in Auth Service Now**

### **Services:**

```
services/
├── auth/
│   ├── auth.service.ts        # Delegates to Users Service
│   ├── auth.controllers.ts    # HTTP handlers
│   ├── auth.routes.ts         # Route definitions
│   └── auth.modules.ts        # Module aggregator
├── token/
│   └── token.service.ts       # JWT + Redis token management
├── session/
│   └── session.service.ts     # Redis session management
└── device/
    └── device.service.ts      # Device fingerprinting (no persistence)
```

### **Config:**

```
config/
├── redis.config.ts            # Redis connection
└── security.config.ts         # JWT, cookies, rate limits
```

### **Types:**

```
types/
└── auth-types.ts              # Request/response types
```

### **No Database:**

- ❌ No `db/` folder
- ❌ No Drizzle schemas
- ❌ No PostgreSQL connection

---

## 🔌 **API Integration**

### **Auth Service → Users Service**

**Endpoints Auth Service calls:**

```typescript
// Signup
POST {USERS_SERVICE_URL}/api/v1/users/register
Body: { email, password, firstName, lastName }

// Validate login
POST {USERS_SERVICE_URL}/api/v1/users/validate
Body: { email, password }
Response: { success, user }

// Verify email
POST {USERS_SERVICE_URL}/api/v1/users/verify-email
Body: { token }

// Forgot password
POST {USERS_SERVICE_URL}/api/v1/users/forgot-password
Body: { email }

// Reset password
POST {USERS_SERVICE_URL}/api/v1/users/reset-password
Body: { token, newPassword }
```

---

## 🔑 **Token Management**

### **Access Token (JWT Only)**

- Short-lived (15 minutes)
- NOT stored anywhere
- Verified using JWT signature
- Contains: userId, email, sessionId, deviceId, roles

### **Refresh Token (JWT + Redis)**

- Long-lived (7 days)
- Stored in Redis (hashed)
- Rotated on each use
- Family tracking for reuse detection

### **Session (Redis Only)**

- 30-minute TTL
- Extends on activity
- Max 3 per user
- Contains device info

---

## 🚀 **Environment Variables**

### **Auth Service:**

```bash
# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ISSUER=soranix-auth
JWT_AUDIENCE=soranix-platform

# Tokens
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Session
SESSION_TIMEOUT=1800000
MAX_ACTIVE_SESSIONS=3

# Users Service
USERS_SERVICE_URL=http://localhost:3001

# CORS
CORS_ORIGIN=http://localhost:3000
```

### **Users Service:**

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=soranix_users
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Security
PASSWORD_MIN_LENGTH=12
MAX_FAILED_ATTEMPTS=5
LOCKOUT_DURATION=1800000

# Email (for verification)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
```

---

## 📊 **Dependencies**

### **Auth Service (Minimal):**

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "redis": "^4.6.13",
    "axios": "^1.9.0",
    "cookie-parser": "^1.4.7",
    "ua-parser-js": "^1.0.37",
    "geoip-lite": "^1.4.7"
  }
}
```

### **Users Service:**

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "bcrypt": "^5.1.1",
    "drizzle-orm": "^0.44.2",
    "pg": "^8.16.0",
    "nodemailer": "^6.9.8",
    "otplib": "^12.0.1",
    "qrcode": "^1.5.3"
  }
}
```

---

## ✅ **What We Fixed**

### **Before (Wrong):**

- ❌ Auth service had its own database
- ❌ User schema in auth service
- ❌ Sessions in PostgreSQL
- ❌ Refresh tokens in PostgreSQL
- ❌ Devices in PostgreSQL
- ❌ Password management in auth service

### **After (Correct):**

- ✅ Auth service is stateless
- ✅ Redis for sessions & tokens
- ✅ No PostgreSQL in auth service
- ✅ Users Service owns all user data
- ✅ Auth service delegates to Users Service via HTTP
- ✅ Clean separation of concerns

---

## 🎯 **Key Benefits**

1. **Scalability:** Auth service can scale independently
2. **Simplicity:** Each service has one clear responsibility
3. **Performance:** Redis for fast session lookups
4. **Security:** Tokens can't leak from database breaches
5. **Maintenance:** Changes to user schema don't affect auth
6. **Microservices:** True service independence

---

## 📝 **Next Steps**

### **1. Complete Users Service**

- [ ] Create user registration endpoint
- [ ] Create validate credentials endpoint
- [ ] Implement password hashing (bcrypt)
- [ ] Add email verification
- [ ] Add password reset
- [ ] Create database schemas

### **2. Set Up Redis**

```bash
# Docker
docker run -d --name redis -p 6379:6379 redis:alpine

# Or in docker-compose
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
```

### **3. Test Integration**

- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test token refresh
- [ ] Test token reuse detection
- [ ] Test session management

---

## 🔥 **Architecture Summary**

```
┌─────────────────┐
│     Client      │
└────────┬────────┘
         │
         ↓ (HTTP-only cookies)
┌─────────────────┐     ┌─────────────┐
│  Auth Service   │────→│   Redis     │
│  (Stateless)    │     │  Sessions   │
└────────┬────────┘     │  Tokens     │
         │              └─────────────┘
         │ (HTTP API)
         ↓
┌─────────────────┐     ┌─────────────┐
│  Users Service  │────→│  PostgreSQL │
│  (Stateful)     │     │  Users DB   │
└─────────────────┘     └─────────────┘
```

**Perfect separation of concerns!** ✅

---

## 🎉 **Status: Refactoring Complete**

The auth service is now properly stateless and follows microservices best practices!
