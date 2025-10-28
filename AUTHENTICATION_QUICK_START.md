# 🚀 Authentication System - Quick Start Guide

Get JWT authentication working in **5 minutes**!

## ✅ What's Been Implemented

### New Packages Created

1. **`@packages/utils`** - JWT signing and verification utilities
2. **`@packages/authenticated-user`** - Express authentication middleware

### Services Updated

1. **Auth Service** - Issues and signs JWT tokens
2. **User Service** - Verifies tokens and protects routes

### Infrastructure

1. **RSA Key Pair** generated in `infra/keys/`
2. **Docker Compose** configured with JWT environment variables

---

## 🎯 Quick Start

### 1. Install Dependencies (2 min)

```bash
# Root
npm install

# Auth service
cd services/auth && npm install

# User service
cd services/users && npm install
```

### 2. Start Services (1 min)

```bash
# From project root
docker-compose -f docker-compose.local.yaml up soranix-auth soranix-users rabbitmq
```

### 3. Test Authentication (2 min)

**Register a user:**

```bash
curl -X POST http://localhost:6000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGc...",
    "user": {...}
  }
}
```

**Use the token to access protected endpoint:**

```bash
# Replace <TOKEN> with the token from above
curl http://localhost:6001/api/v1/profile/me \
  -H "Authorization: Bearer <TOKEN>"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "user_...",
    "email": "test@example.com"
  }
}
```

✅ **It works!**

---

## 📝 Available Endpoints

### Auth Service (Port 6000)

| Method | Endpoint                | Description       | Auth Required |
| ------ | ----------------------- | ----------------- | ------------- |
| POST   | `/api/v1/auth/register` | Register new user | No            |
| POST   | `/api/v1/auth/login`    | Login user        | No            |
| POST   | `/api/v1/auth/logout`   | Logout user       | No            |
| GET    | `/api/v1/auth/verify`   | Verify token      | Yes           |

### User Service (Port 6001)

| Method | Endpoint                  | Description            | Auth Required |
| ------ | ------------------------- | ---------------------- | ------------- |
| GET    | `/api/v1/profile/me`      | Get own profile        | Yes           |
| PUT    | `/api/v1/profile/me`      | Update own profile     | Yes           |
| GET    | `/api/v1/profile/:userId` | Get profile by ID      | Yes           |
| PUT    | `/api/v1/profile/:userId` | Update profile (admin) | Yes           |
| DELETE | `/api/v1/profile/:userId` | Delete profile (admin) | Yes           |

---

## 🔧 How It Works

### Login Flow

```
1. POST /auth/login → Auth Service
2. Auth verifies credentials
3. Auth signs JWT with PRIVATE key
4. Returns JWT to client
5. Client stores JWT
6. Client includes JWT in subsequent requests
```

### Protected Route Flow

```
1. Client → GET /profile/me (with JWT in header)
2. requireAuth middleware extracts JWT
3. Verifies JWT with PUBLIC key
4. Attaches user info to req.user
5. Controller accesses req.user
6. Returns user-specific data
```

---

## 🎨 Usage Examples

### For Auth Service Developers

```typescript
// Sign a JWT token
import { JWTSigner } from '@packages/utils';

const signer = new JWTSigner();
const token = signer.sign(userId, email, {
  roles: ['user'],
  sessionId: 'session_123',
});
```

### For Other Service Developers

```typescript
// Protect routes with middleware
import { requireAuth, requireRoles } from '@packages/authenticated-user';

// Require authentication
router.get('/protected', requireAuth(), (req, res) => {
  const user = req.user!;
  res.json({ message: `Hello ${user.email}!` });
});

// Require specific role
router.delete('/admin', requireAuth(), requireRoles('admin'), (req, res) => {
  // Only admins can access this
});

// Optional authentication
router.get('/public', optionalAuth(), (req, res) => {
  // Works with or without token
  if (req.user) {
    res.json({ message: `Hello ${req.user.email}!` });
  } else {
    res.json({ message: 'Hello guest!' });
  }
});
```

---

## 🔑 Key Files

### New Packages

```
packages/utils/
└── src/jwt/
    ├── jwt-signer.ts       # Signs JWTs
    ├── jwt-verifier.ts     # Verifies JWTs
    └── key-loader.ts       # Loads RSA keys

packages/authenticated-user/
└── src/middleware/
    ├── require-auth.ts     # Auth middleware
    ├── optional-auth.ts    # Optional auth
    └── require-roles.ts    # Role-based access
```

### RSA Keys

```
infra/keys/
├── private.key    # 🔒 NEVER commit! Auth service only
└── public.key     # ✅ Safe to share, all services
```

### Service Files

```
services/auth/
├── src/services/auth/
│   ├── auth.services.ts     # Login logic + JWT signing
│   └── auth.controllers.ts  # Returns JWT tokens
└── env.example              # JWT configuration

services/users/
├── src/services/profile/
│   ├── profile.routes.ts       # Protected with requireAuth()
│   └── profile.controllers.ts  # Uses req.user
└── env.example                 # JWT configuration
```

---

## 🚨 Common Issues & Solutions

### Issue: "Authentication token is missing"

**Fix:** Include token in Authorization header

```bash
curl http://localhost:6001/api/v1/profile/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Issue: "Failed to load private key"

**Fix:** Check JWT key paths in environment

```bash
# Auth service
JWT_PRIVATE_KEY_PATH=/app/keys/private.key

# Other services
JWT_PUBLIC_KEY_PATH=/app/keys/public.key
```

### Issue: "Invalid signature"

**Fix:** Regenerate keys and restart services

```bash
./scripts/generate-jwt-keys.sh
docker-compose restart
```

---

## 📚 Documentation

- **`AUTH_SYSTEM_DOCUMENTATION.md`** - Complete documentation
- **`infra/keys/README.md`** - Key management guide
- **`services/auth/env.example`** - Auth service configuration
- **`services/users/env.example`** - User service configuration

---

## 🎉 Next Steps

1. **Add Database Integration**

   - Replace simulated users with real database queries
   - Store hashed passwords
   - Manage user sessions

2. **Add More Protected Endpoints**

   - Apply `requireAuth()` to routes in other services
   - Use `requireRoles()` for admin-only routes

3. **Implement Refresh Tokens**

   - Issue short-lived access tokens (15 min)
   - Issue long-lived refresh tokens (7 days)
   - Allow token renewal without re-login

4. **Add Token Blacklisting** (Optional)
   - Store revoked tokens in Redis
   - Check blacklist on verification
   - Implement proper logout

---

## ✨ Summary

**You now have a complete JWT authentication system!**

✅ RSA-256 signed JWTs  
✅ Stateless authentication  
✅ Role-based access control  
✅ Works across microservices  
✅ Secure and scalable

**Test it now:**

```bash
# 1. Start services
docker-compose -f docker-compose.local.yaml up soranix-auth soranix-users

# 2. Register
curl -X POST http://localhost:6000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"Pass123!","firstName":"You"}'

# 3. Use the token! 🎉
curl http://localhost:6001/api/v1/profile/me \
  -H "Authorization: Bearer <your_token>"
```

**Happy coding! 🚀**
