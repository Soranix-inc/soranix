# 🔐 Authentication System - Complete Implementation Plan

Comprehensive authentication system for Soranix fintech platform with enterprise-grade security.

---

## 🎯 **Core Requirements (Your Specifications)**

### **1. Token Management** ✅

- ✅ **Refresh Token Rotation** - New refresh token on each use
- ✅ **Token Reuse Detection** - Detect stolen/reused tokens
- ✅ **Access Tokens** - Short-lived (15 minutes)
- ✅ **Refresh Tokens** - Longer-lived (7 days)
- ✅ **Cookie Transport** - HTTP-only, Secure, SameSite

### **2. Core Routes** ✅

- ✅ **Login** - Email/password authentication
- ✅ **Signup** - User registration
- ✅ **Forgot Password** - Password reset flow
- ✅ **Verify Email** - Email verification
- ✅ **Logout** - Session termination
- ✅ **Refresh Token** - Token renewal

### **3. Device Detection** ✅

- ✅ **Device Fingerprinting** - Browser, OS, screen resolution
- ✅ **New Device Alerts** - Email notifications
- ✅ **Device Management** - View/revoke device sessions

---

## 🚀 **Additional Features (Recommended for Fintech)**

### **4. Multi-Factor Authentication (MFA)** 🔒

- ✅ **TOTP (Time-based OTP)** - Google Authenticator, Authy
- ✅ **SMS OTP** - Fallback method
- ✅ **Email OTP** - Additional fallback
- ✅ **Backup Codes** - 10 one-time use codes
- ✅ **Recovery Email** - Account recovery mechanism
- ⚠️ **Mandatory for:**
  - Admins (always)
  - High-value transactions (>$10,000)
  - Sensitive operations (password change, email change)

### **5. Security Features** 🛡️

- ✅ **Rate Limiting** - Prevent brute force (5 attempts/minute)
- ✅ **Account Lockout** - Lock after 5 failed attempts (30 min)
- ✅ **Password Strength** - Min 12 chars, uppercase, lowercase, number, special
- ✅ **Password History** - Prevent reuse of last 5 passwords
- ✅ **Session Timeout** - Auto logout after 30 min inactivity
- ✅ **Concurrent Session Limit** - Max 3 active sessions per user
- ✅ **IP Whitelisting** - Optional for admins
- ✅ **Geolocation Tracking** - Detect suspicious locations
- ✅ **Suspicious Activity Detection** - Flag unusual patterns

### **6. Audit & Compliance** 📊

- ✅ **Login History** - Track all login attempts (success/failure)
- ✅ **Security Events Log** - Password changes, MFA setup, etc.
- ✅ **Device History** - Track all devices used
- ✅ **IP History** - Track all IPs used
- ✅ **Session History** - Track all active/expired sessions
- ✅ **Admin Activity Log** - Separate audit trail for admins
- ✅ **GDPR Compliance** - Data export, account deletion

### **7. Session Management** 🔄

- ✅ **Active Sessions View** - List all active sessions
- ✅ **Revoke Session** - Terminate specific session
- ✅ **Revoke All Sessions** - Logout all devices
- ✅ **Session Details** - Device, IP, location, last active
- ✅ **Session Renewal** - Extend expiry on activity

### **8. Account Security** 🔐

- ✅ **Email Change Verification** - Verify both old and new email
- ✅ **Password Change** - Require current password
- ✅ **Account Deactivation** - Soft delete (recoverable)
- ✅ **Account Deletion** - Hard delete (permanent)
- ✅ **Security Questions** - Account recovery fallback
- ✅ **Trusted Devices** - Remember device for 30 days

### **9. Notifications** 📧

- ✅ **Login from New Device** - Email alert
- ✅ **Login from New Location** - Email alert
- ✅ **Password Changed** - Email alert
- ✅ **Email Changed** - Email to both old and new
- ✅ **MFA Enabled/Disabled** - Email alert
- ✅ **Account Locked** - Email notification
- ✅ **Suspicious Activity** - Email + SMS alert

### **10. Advanced Features** 🌟

- ✅ **OAuth/Social Login** - Google, Apple (optional)
- ✅ **Biometric Authentication** - Face ID, Touch ID (mobile)
- ✅ **WebAuthn/FIDO2** - Passwordless authentication
- ✅ **Magic Links** - Email-based passwordless login
- ✅ **Passkeys** - Modern passwordless auth

---

## 🔥 **Admin vs User Auth - SEPARATE!**

### **Why Separate?**

**YES, admin authentication MUST be separate for security:**

1. **Different Security Requirements**

   - Admins have more privileges → need stronger auth
   - Different token lifetimes
   - Different MFA requirements

2. **Compliance & Audit**

   - Regulatory requirements (SOC 2, PCI-DSS)
   - Separate audit trails
   - Different retention policies

3. **Attack Surface Reduction**
   - Separate endpoints reduce risk
   - Admin panel not exposed to public
   - Different rate limits

---

## 📋 **Implementation Structure**

### **User Authentication**

```
services/auth/src/
├── services/
│   ├── auth/
│   │   ├── auth.service.ts          # Core auth logic
│   │   ├── auth.controllers.ts      # Request handlers
│   │   ├── auth.routes.ts           # Public routes
│   │   └── auth.modules.ts          # Module aggregation
│   │
│   ├── token/
│   │   ├── token.service.ts         # JWT & refresh token logic
│   │   ├── token.controllers.ts     # Token endpoints
│   │   └── token.routes.ts          # /auth/refresh, /auth/logout
│   │
│   ├── password/
│   │   ├── password.service.ts      # Password hashing, reset
│   │   ├── password.controllers.ts  # Forgot/reset handlers
│   │   └── password.routes.ts       # /auth/forgot, /auth/reset
│   │
│   ├── email/
│   │   ├── email.service.ts         # Email verification
│   │   ├── email.controllers.ts     # Verify email handler
│   │   └── email.routes.ts          # /auth/verify-email
│   │
│   ├── mfa/
│   │   ├── mfa.service.ts           # TOTP, OTP generation
│   │   ├── mfa.controllers.ts       # MFA setup, verify
│   │   └── mfa.routes.ts            # /auth/mfa/*
│   │
│   ├── session/
│   │   ├── session.service.ts       # Session management
│   │   ├── session.controllers.ts   # View/revoke sessions
│   │   └── session.routes.ts        # /auth/sessions
│   │
│   ├── device/
│   │   ├── device.service.ts        # Device fingerprinting
│   │   ├── device.controllers.ts    # Device management
│   │   └── device.routes.ts         # /auth/devices
│   │
│   ├── security/
│   │   ├── security.service.ts      # Rate limiting, lockout
│   │   ├── security.controllers.ts  # Security settings
│   │   └── security.routes.ts       # /auth/security
│   │
│   └── audit/
│       ├── audit.service.ts         # Audit logging
│       └── audit.routes.ts          # /auth/audit (admin only)
│
├── db/
│   └── schema/
│       ├── users.ts                 # User accounts
│       ├── sessions.ts              # Active sessions
│       ├── refresh-tokens.ts        # Refresh token storage
│       ├── devices.ts               # Trusted devices
│       ├── login-history.ts         # Login attempts
│       ├── security-events.ts       # Security audit log
│       ├── mfa-secrets.ts           # TOTP secrets
│       ├── backup-codes.ts          # MFA backup codes
│       └── password-history.ts      # Password history
│
└── middleware/
    ├── rate-limiter.ts              # Rate limiting
    ├── device-fingerprint.ts        # Device detection
    ├── ip-whitelist.ts              # IP filtering
    └── session-validator.ts         # Session validation
```

### **Admin Authentication**

```
services/auth/src/
├── services/
│   └── admin/
│       ├── admin-auth.service.ts    # Admin auth logic
│       ├── admin-auth.controllers.ts
│       ├── admin-auth.routes.ts     # /admin/auth/*
│       ├── admin-session.service.ts # Admin sessions
│       ├── admin-mfa.service.ts     # Admin MFA (mandatory)
│       └── admin-audit.service.ts   # Admin audit trail
│
├── db/
│   └── schema/
│       ├── admin-users.ts           # Admin accounts
│       ├── admin-sessions.ts        # Admin sessions
│       ├── admin-audit.ts           # Admin activity log
│       └── admin-permissions.ts     # Role-based access
│
└── middleware/
    ├── require-admin.ts             # Admin-only routes
    ├── admin-ip-whitelist.ts        # Restrict admin IPs
    └── admin-mfa-required.ts        # Enforce MFA
```

---

## 🔐 **Token Strategy**

### **Access Token (JWT)**

```typescript
{
  userId: string;
  email: string;
  sessionId: string;
  deviceId: string;
  roles: string[];
  type: 'access';
  iat: number;
  exp: number; // 15 minutes
}
```

### **Refresh Token (JWT + Database)**

```typescript
{
  userId: string;
  sessionId: string;
  deviceId: string;
  tokenFamily: string; // For rotation detection
  type: 'refresh';
  iat: number;
  exp: number; // 7 days
}

// Stored in database:
{
  id: uuid;
  userId: uuid;
  sessionId: uuid;
  tokenFamily: string;
  tokenHash: string; // Hashed token
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: timestamp;
  isRevoked: boolean;
  revokedAt?: timestamp;
  createdAt: timestamp;
}
```

### **Token Rotation Flow**

```
1. User logs in
   → Generate access token (15 min)
   → Generate refresh token (7 days)
   → Store refresh token in DB
   → Set both as HTTP-only cookies

2. Access token expires
   → Client sends refresh token
   → Server validates refresh token
   → If valid: Generate NEW access + refresh tokens
   → Revoke old refresh token
   → Store new refresh token in DB
   → Return new tokens

3. Refresh token reused (ATTACK!)
   → Server detects token already used
   → Revoke ENTIRE token family (all sessions)
   → Force user to login again
   → Send security alert email
```

---

## 🛡️ **Security Configuration**

### **User Auth**

```typescript
{
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  sessionTimeout: '30m',
  maxActiveSessions: 3,
  passwordMinLength: 12,
  passwordRequirements: {
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: true,
  },
  mfaRequired: false, // Optional for users
  rateLimit: {
    login: { max: 5, window: '1m' },
    signup: { max: 3, window: '1h' },
    forgotPassword: { max: 3, window: '1h' },
  },
  accountLockout: {
    maxAttempts: 5,
    lockDuration: '30m',
  },
}
```

### **Admin Auth**

```typescript
{
  accessTokenExpiry: '10m', // Shorter!
  refreshTokenExpiry: '1d', // Shorter!
  sessionTimeout: '15m', // Shorter!
  maxActiveSessions: 2,
  passwordMinLength: 16, // Longer!
  passwordRequirements: {
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: true,
    minSpecialChars: 2,
  },
  mfaRequired: true, // MANDATORY!
  mfaType: 'totp', // Enforced TOTP
  ipWhitelist: true, // Optional IP restrictions
  rateLimit: {
    login: { max: 3, window: '1m' }, // Stricter!
  },
  accountLockout: {
    maxAttempts: 3, // Stricter!
    lockDuration: '1h', // Longer!
  },
}
```

---

## 📊 **Database Schema**

### **1. Users Table**

```typescript
{
  id: uuid;
  email: string (unique);
  emailVerified: boolean;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  phoneVerified: boolean;

  // MFA
  mfaEnabled: boolean;
  mfaMethod?: 'totp' | 'sms' | 'email';

  // Security
  accountLocked: boolean;
  lockedUntil?: timestamp;
  failedLoginAttempts: number;
  lastLoginAt?: timestamp;
  lastLoginIp?: string;
  lastLoginDevice?: string;

  // Timestamps
  createdAt: timestamp;
  updatedAt: timestamp;
  deletedAt?: timestamp; // Soft delete
}
```

### **2. Sessions Table**

```typescript
{
  id: uuid;
  userId: uuid;
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';

  // Location
  ipAddress: string;
  country?: string;
  city?: string;

  // Status
  isActive: boolean;
  expiresAt: timestamp;
  lastActivityAt: timestamp;

  createdAt: timestamp;
  revokedAt?: timestamp;
}
```

### **3. Refresh Tokens Table**

```typescript
{
  id: uuid;
  userId: uuid;
  sessionId: uuid;
  tokenFamily: string; // For rotation detection
  tokenHash: string; // Hashed token

  deviceId: string;
  ipAddress: string;
  userAgent: string;

  isRevoked: boolean;
  revokedAt?: timestamp;
  revokedReason?: string; // 'manual' | 'reuse' | 'expired'

  expiresAt: timestamp;
  createdAt: timestamp;
}
```

### **4. Devices Table**

```typescript
{
  id: uuid;
  userId: uuid;
  deviceId: string (unique per user);
  deviceName: string;

  // Fingerprint
  userAgent: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';

  // Trust
  isTrusted: boolean;
  trustedUntil?: timestamp; // 30 days

  // Tracking
  firstSeenAt: timestamp;
  lastSeenAt: timestamp;
  lastIpAddress: string;

  createdAt: timestamp;
}
```

### **5. Login History Table**

```typescript
{
  id: uuid;
  userId: uuid;

  // Attempt details
  success: boolean;
  failureReason?: string;

  // Device & location
  deviceId?: string;
  ipAddress: string;
  userAgent: string;
  country?: string;
  city?: string;

  // Security flags
  isNewDevice: boolean;
  isNewLocation: boolean;
  isSuspicious: boolean;

  createdAt: timestamp;
}
```

### **6. Security Events Table**

```typescript
{
  id: uuid;
  userId: uuid;

  eventType: 'password_changed' | 'email_changed' | 'mfa_enabled' |
             'mfa_disabled' | 'account_locked' | 'suspicious_login' |
             'session_revoked' | 'device_trusted';

  // Details
  metadata: jsonb; // Event-specific data
  ipAddress: string;
  deviceId?: string;

  // Alert
  alertSent: boolean;
  alertMethod?: 'email' | 'sms';

  createdAt: timestamp;
}
```

### **7. MFA Secrets Table**

```typescript
{
  id: uuid;
  userId: uuid (unique);

  // TOTP
  secret: string (encrypted);
  backupCodes: string[] (encrypted); // 10 codes
  backupCodesUsed: string[];

  // Status
  isEnabled: boolean;
  verifiedAt?: timestamp;

  createdAt: timestamp;
  updatedAt: timestamp;
}
```

### **8. Password History Table**

```typescript
{
  id: uuid;
  userId: uuid;
  passwordHash: string;

  createdAt: timestamp;
}
// Keep last 5 passwords
```

---

## 🔄 **API Endpoints**

### **Public Routes** (No Auth Required)

```
POST   /auth/signup              # Register new user
POST   /auth/login               # Login with email/password
POST   /auth/logout              # Logout (revoke tokens)
POST   /auth/refresh             # Refresh access token
POST   /auth/forgot-password     # Send password reset email
POST   /auth/reset-password      # Reset password with token
GET    /auth/verify-email/:token # Verify email address
POST   /auth/resend-verification # Resend verification email
```

### **Protected Routes** (Require Auth)

```
# Session Management
GET    /auth/sessions            # List active sessions
DELETE /auth/sessions/:id        # Revoke specific session
DELETE /auth/sessions/all        # Revoke all sessions

# Device Management
GET    /auth/devices             # List trusted devices
DELETE /auth/devices/:id         # Remove device
POST   /auth/devices/:id/trust   # Trust device for 30 days

# MFA
POST   /auth/mfa/setup           # Generate TOTP secret + QR
POST   /auth/mfa/verify          # Verify & enable MFA
POST   /auth/mfa/disable         # Disable MFA
GET    /auth/mfa/backup-codes    # Get backup codes
POST   /auth/mfa/regenerate      # Regenerate backup codes

# Account Security
PUT    /auth/password            # Change password
PUT    /auth/email               # Change email (requires verification)
GET    /auth/security            # Security settings
GET    /auth/login-history       # Login attempts history
GET    /auth/security-events     # Security events log

# Account Management
DELETE /auth/account             # Deactivate account
DELETE /auth/account/permanent   # Permanently delete
```

### **Admin Routes** (Require Admin Auth + MFA)

```
POST   /admin/auth/login         # Admin login (requires MFA)
POST   /admin/auth/verify-mfa    # Verify MFA code
POST   /admin/auth/logout        # Admin logout

# User Management (Admin)
GET    /admin/users              # List all users
GET    /admin/users/:id          # Get user details
PUT    /admin/users/:id/lock     # Lock user account
PUT    /admin/users/:id/unlock   # Unlock user account
DELETE /admin/users/:id          # Delete user (hard delete)

# Audit (Admin)
GET    /admin/audit/logins       # All login attempts
GET    /admin/audit/security     # All security events
GET    /admin/audit/admin        # Admin activity log
```

---

## 🎯 **Implementation Priority**

### **Phase 1: Core Auth** (Week 1)

1. ✅ Basic signup/login/logout
2. ✅ JWT access tokens
3. ✅ Password hashing (bcrypt)
4. ✅ Email verification
5. ✅ Forgot/reset password

### **Phase 2: Token Rotation** (Week 2)

6. ✅ Refresh token generation
7. ✅ Refresh token rotation
8. ✅ Token reuse detection
9. ✅ Cookie-based transport
10. ✅ Session management

### **Phase 3: Security** (Week 3)

11. ✅ Device fingerprinting
12. ✅ Device management
13. ✅ Rate limiting
14. ✅ Account lockout
15. ✅ Login history

### **Phase 4: MFA** (Week 4)

16. ✅ TOTP setup
17. ✅ MFA verification
18. ✅ Backup codes
19. ✅ MFA enforcement for admins

### **Phase 5: Advanced** (Week 5+)

20. ✅ Admin authentication
21. ✅ Audit logging
22. ✅ Geolocation tracking
23. ✅ Suspicious activity detection
24. ✅ Security notifications

---

## 🎨 **Technology Stack**

### **Core Dependencies**

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1", // Password hashing
    "jsonwebtoken": "^9.0.2", // JWT tokens
    "otplib": "^12.0.1", // TOTP generation
    "qrcode": "^1.5.3", // QR codes for MFA
    "ua-parser-js": "^1.0.37", // User agent parsing
    "geoip-lite": "^1.4.7", // IP geolocation
    "express-rate-limit": "^7.1.5", // Rate limiting
    "cookie-parser": "^1.4.6", // Cookie parsing
    "crypto": "built-in", // Token generation
    "nanoid": "^5.0.4" // ID generation
  }
}
```

---

## ✅ **Summary**

### **What You Get:**

✅ **Robust Token System** - Rotation + reuse detection  
✅ **Multi-Factor Auth** - TOTP, SMS, Email, backup codes  
✅ **Device Management** - Fingerprinting + trusted devices  
✅ **Session Control** - View/revoke all sessions  
✅ **Security Monitoring** - Login history + audit logs  
✅ **Admin Separation** - Dedicated admin auth with stricter rules  
✅ **Compliance Ready** - GDPR, SOC 2, PCI-DSS compliant  
✅ **Fintech-Grade** - Enterprise security standards

### **Separate Admin Auth:**

✅ **YES!** Separate admin authentication because:

- Different security requirements
- Mandatory MFA for admins
- Shorter token lifetimes
- Stricter rate limits
- IP whitelisting
- Separate audit trail
- Reduced attack surface
- Regulatory compliance

**Ready to implement! Would you like me to start building this?** 🚀
