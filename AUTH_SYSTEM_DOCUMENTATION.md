# 🔐 Authentication System Documentation

Complete guide to the JWT-based authentication system for Soranix microservices.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Usage Guide](#usage-guide)
5. [API Reference](#api-reference)
6. [Security](#security)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Soranix authentication system uses **JWT (JSON Web Tokens)** with **RSA public/private key** signing for secure, stateless authentication across microservices.

### Key Features

✅ **Stateless** - No session storage required  
✅ **Secure** - RSA-256 encryption with 4096-bit keys  
✅ **Scalable** - Works across multiple services independently  
✅ **Fast** - Tokens verified locally without network calls  
✅ **Flexible** - Supports role-based access control

### How It Works

```
1. User logs in → Auth Service
2. Auth Service verifies credentials
3. Auth Service signs JWT with PRIVATE key
4. JWT returned to client
5. Client includes JWT in requests
6. Other services verify JWT with PUBLIC key
7. Services extract user info from JWT
```

---

## Architecture

### Components

#### 1. **@packages/utils**

JWT signing and verification utilities

- `JWTSigner` - Signs tokens (auth service only)
- `JWTVerifier` - Verifies tokens (all services)
- Key management utilities

#### 2. **@packages/authenticated-user**

Express middleware for authentication

- `requireAuth()` - Requires valid JWT
- `optionalAuth()` - Optional authentication
- `requireRoles()` - Role-based access control

#### 3. **Auth Service**

Issues and signs JWT tokens

- `/login` - Returns JWT on successful login
- `/register` - Creates user and returns JWT
- `/verify` - Validates JWT tokens

#### 4. **Other Services**

Verify JWTs and access user context

- Use `requireAuth()` middleware
- Access `req.user` for authenticated user info

### Key Distribution

```
┌────────────────────────────────────────────┐
│  infra/keys/                               │
│  ├── private.key (NEVER commit!)          │
│  └── public.key (safe to share)           │
└────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ↓                       ↓
┌─────────────┐         ┌──────────────────┐
│ Auth Service│         │ All Other Services│
│ (PRIVATE key)│         │ (PUBLIC key only) │
│             │         │                  │
│ Signs JWTs  │         │ Verifies JWTs    │
└─────────────┘         └──────────────────┘
```

---

## Installation

### 1. Generate RSA Keys

```bash
./scripts/generate-jwt-keys.sh
```

This creates:

- `infra/keys/private.key` - Keep secret!
- `infra/keys/public.key` - Share with all services

### 2. Install Dependencies

```bash
# Root dependencies
npm install

# Auth service
cd services/auth && npm install

# User service (or any other service)
cd services/users && npm install
```

### 3. Configure Environment Variables

**Auth Service (services/auth/.env):**

```env
JWT_PRIVATE_KEY_PATH=../../infra/keys/private.key
JWT_PUBLIC_KEY_PATH=../../infra/keys/public.key
JWT_EXPIRES_IN=7d
JWT_ISSUER=soranix-auth
JWT_AUDIENCE=soranix
```

**Other Services (services/users/.env):**

```env
JWT_PUBLIC_KEY_PATH=../../infra/keys/public.key
JWT_ISSUER=soranix-auth
JWT_AUDIENCE=soranix
```

---

## Usage Guide

### For Auth Service Developers

#### Sign JWT Tokens

```typescript
import { JWTSigner } from '@packages/utils';

const signer = new JWTSigner({
  expiresIn: '7d',
  issuer: 'soranix-auth',
});

// Sign a token
const token = signer.sign(userId, email, {
  roles: ['user', 'admin'],
  sessionId: 'session_123',
});

// Return to client
res.json({ token, user });
```

### For Other Service Developers

#### Protect Routes with Middleware

```typescript
import { requireAuth, requireRoles } from '@packages/authenticated-user';

// Protect all routes in this router
router.use(requireAuth());

// Specific route protection
router.get('/profile', requireAuth(), getProfile);

// Role-based protection
router.delete('/user/:id', requireAuth(), requireRoles('admin'), deleteUser);

// Optional authentication
router.get('/public', optionalAuth(), getPublicData);
```

#### Access Authenticated User

```typescript
import { Request, Response } from 'express';

function getMyProfile(req: Request, res: Response) {
  // req.user is set by requireAuth() middleware
  const user = req.user!;

  console.log(user.userId); // "user_123"
  console.log(user.email); // "john@example.com"
  console.log(user.roles); // ["user"]

  // Fetch user's data using their ID
  const profile = await db.findProfile(user.userId);
  res.json(profile);
}
```

---

## API Reference

### Authentication Endpoints

#### POST `/api/v1/auth/register`

Register a new user and receive JWT token.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

#### POST `/api/v1/auth/login`

Login and receive JWT token.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "user_123",
      "email": "user@example.com"
    }
  }
}
```

#### GET `/api/v1/auth/verify`

Verify if a token is valid.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "userId": "user_123",
      "email": "user@example.com"
    }
  }
}
```

### Protected Endpoints

#### GET `/api/v1/profile/me`

Get authenticated user's profile.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "email": "user@example.com",
    "message": "Profile retrieved successfully"
  }
}
```

### JWT Token Structure

```json
{
  "sub": "user_123", // User ID
  "email": "user@example.com", // User email
  "roles": ["user"], // User roles
  "iat": 1234567890, // Issued at (timestamp)
  "exp": 1234999999, // Expires at (timestamp)
  "iss": "soranix-auth", // Issuer
  "aud": ["soranix"] // Audience
}
```

---

## Security

### Best Practices

#### 1. **Private Key Security**

❌ **NEVER:**

- Commit private key to git
- Share private key via insecure channels
- Log private key
- Include in error messages
- Store in plaintext in production

✅ **ALWAYS:**

- Use environment variables or secrets manager
- Restrict file permissions (`chmod 600`)
- Rotate keys periodically
- Keep in auth service only

#### 2. **Token Expiration**

```typescript
// Short-lived tokens (recommended)
JWT_EXPIRES_IN=1h

// With refresh tokens
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

#### 3. **HTTPS Only**

Always use HTTPS in production to prevent token interception.

#### 4. **Token Storage**

**Client-side:**

- ✅ HttpOnly cookies (recommended)
- ⚠️ LocalStorage (XSS vulnerable)
- ❌ Regular cookies (CSRF vulnerable)

#### 5. **Password Requirements**

Current implementation requires:

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Key Rotation

To rotate keys without downtime:

1. Generate new key pair
2. Keep old public key available
3. Update auth service with new private key
4. Gradually update services with new public key
5. After grace period, remove old public key

---

## Troubleshooting

### Error: "Authentication token is missing"

**Cause:** No token in request

**Solution:** Include token in Authorization header:

```
Authorization: Bearer <your_token>
```

### Error: "Authentication token is invalid"

**Causes:**

- Wrong public key
- Token tampered with
- Token format incorrect

**Solution:**

- Verify public key matches private key
- Check token is properly formatted
- Ensure token hasn't been modified

### Error: "Authentication token has expired"

**Cause:** Token expired

**Solution:**

- Login again to get new token
- Implement refresh token mechanism

### Error: "Failed to load private key"

**Causes:**

- File doesn't exist
- Wrong file path
- Permission denied

**Solution:**

```bash
# Check file exists
ls -la infra/keys/private.key

# Fix permissions
chmod 600 infra/keys/private.key

# Verify environment variable
echo $JWT_PRIVATE_KEY_PATH
```

### Error: "Invalid signature"

**Cause:** Public key doesn't match private key

**Solution:**

- Regenerate keys
- Ensure same public key distributed to all services
- Check keys weren't corrupted during copy

### JWT Not Working in Docker

**Cause:** Key paths incorrect in containers

**Solution:** Use volumes in docker-compose:

```yaml
volumes:
  - ./infra/keys:/app/keys:ro
environment:
  - JWT_PRIVATE_KEY_PATH=/app/keys/private.key
```

---

## Examples

### Complete Authentication Flow

```typescript
// 1. Register user
const registerResponse = await fetch('/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
    firstName: 'John',
  }),
});

const { data } = await registerResponse.json();
const token = data.token;

// 2. Store token
localStorage.setItem('token', token);

// 3. Make authenticated request
const profileResponse = await fetch('/api/v1/profile/me', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const profile = await profileResponse.json();
console.log(profile);
```

### Adding Authentication to New Service

```typescript
// 1. Add dependencies to package.json
{
  "dependencies": {
    "@packages/authenticated-user": "*",
    "@packages/utils": "*"
  }
}

// 2. Protect routes
import { requireAuth } from '@packages/authenticated-user';

router.get('/protected', requireAuth(), (req, res) => {
  const user = req.user!;
  res.json({ message: `Hello ${user.email}!` });
});

// 3. Add public key to environment
JWT_PUBLIC_KEY_PATH=../../infra/keys/public.key
JWT_ISSUER=soranix-auth
JWT_AUDIENCE=soranix
```

---

## Additional Resources

- **Packages:**

  - `@packages/utils` - JWT utilities
  - `@packages/authenticated-user` - Auth middleware

- **Documentation:**

  - [JWT.io](https://jwt.io/) - JWT debugger
  - [RSA Cryptography](<https://en.wikipedia.org/wiki/RSA_(cryptosystem)>)

- **Tools:**
  - `./scripts/generate-jwt-keys.sh` - Generate key pairs
  - `infra/keys/README.md` - Key management guide

---

## Summary

✅ **Setup Complete! You now have:**

1. ✅ `@packages/utils` with JWT signing/verification
2. ✅ `@packages/authenticated-user` middleware
3. ✅ RSA key pair generated
4. ✅ Auth service issuing JWTs
5. ✅ User service verifying JWTs
6. ✅ Docker compose configured
7. ✅ Complete documentation

**Start using authentication:**

```bash
# Start services
docker-compose -f docker-compose.local.yaml up

# Register user
curl -X POST http://localhost:6000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!","firstName":"Test"}'

# Use token to access protected endpoint
curl http://localhost:6001/api/v1/profile/me \
  -H "Authorization: Bearer <your_token>"
```

🎉 **Happy authenticating!**
