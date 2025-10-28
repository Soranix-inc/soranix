# 🚀 Setup Guide - User Registration Event System

This guide will help you get the event system up and running.

## 📋 Prerequisites

- Docker & Docker Compose installed
- Node.js 18+ installed
- Terminal access

## 🔧 Step-by-Step Setup

### Step 1: Create Environment Files

#### Auth Service `.env`

Create a file at `services/auth/.env`:

```env
# Server Configuration
PORT=6000
NODE_ENV=development

# RabbitMQ Configuration
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/

# Event Encryption (Generate a 64-character hex string)
EVENT_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Service Info
SERVICE_NAME=soranix-auth
SERVICE_VERSION=1.0.0

# Tracing (Optional)
JAEGER_ENDPOINT=http://localhost:14268/api/traces
OTLP_ENDPOINT=http://localhost:4318/v1/traces
TRACING_ENABLED=true
TRACING_SAMPLING_RATIO=1.0
```

#### User Service `.env`

Create a file at `services/users/.env`:

```env
# Server Configuration
PORT=6001
NODE_ENV=development

# RabbitMQ Configuration
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/

# Event Encryption (Must match the key used in auth service)
EVENT_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Service Info
SERVICE_NAME=soranix-users
SERVICE_VERSION=1.0.0

# Tracing (Optional)
JAEGER_ENDPOINT=http://localhost:14268/api/traces
OTLP_ENDPOINT=http://localhost:4318/v1/traces
TRACING_ENABLED=true
TRACING_SAMPLING_RATIO=1.0

# Database Configuration (if needed)
# DATABASE_URL=postgresql://user:password@localhost:5432/users_db
```

**🔐 Generate a Secure Encryption Key:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use the same key in **both** services!

### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Auth service
cd services/auth
npm install

# User service
cd ../users
npm install

# Go back to root
cd ../..
```

### Step 3: Start RabbitMQ

```bash
docker-compose -f docker-compose.local.yaml up rabbitmq -d
```

Wait for RabbitMQ to be ready (about 10-20 seconds):

```bash
docker logs soranix-rabbitmq
```

Look for: `Server startup complete`

### Step 4: Start Services

**Option A: Using Docker Compose (Recommended)**

```bash
# Start all services
docker-compose -f docker-compose.local.yaml up soranix-auth soranix-users

# Or in detached mode
docker-compose -f docker-compose.local.yaml up -d soranix-auth soranix-users
```

**Option B: Running Locally (Development)**

Terminal 1 - Auth Service:

```bash
cd services/auth
npm run dev
```

Terminal 2 - User Service:

```bash
cd services/users
npm run dev
```

### Step 5: Verify Services are Running

```bash
# Check Auth service
curl http://localhost:6000/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "auth",
#   "timestamp": "...",
#   "eventBus": "connected"
# }

# Check User service
curl http://localhost:6001/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "users",
#   "timestamp": "...",
#   "eventBus": "connected"
# }
```

Both should show `"eventBus": "connected"` ✅

### Step 6: Test Event Flow

Register a new user:

```bash
curl -X POST http://localhost:6000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "user_1234567890_abc123",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Step 7: Verify Logs

**Auth Service logs should show:**

```
User registered { userId: 'user_...', email: 'john.doe@example.com' }
User registered event published { eventId: 'evt_...', userId: '...' }
Event published successfully { eventType: 'user.registered', encrypted: true }
```

**User Service logs should show:**

```
Received user.registered event { eventId: 'evt_...', userId: '...', email: '...' }
Processing new user registration { userId: '...', email: '...', firstName: 'John' }
User registration handler executed { userId: '...', email: '...' }
User registration processed successfully { userId: '...' }
```

### Step 8: Monitor RabbitMQ (Optional)

Open RabbitMQ Management UI:

```
http://localhost:15672
Username: guest
Password: guest
```

Check:

- **Exchanges**: `soranix.user` should exist
- **Queues**: `user.registration` should exist
- **Bindings**: `user.registration` bound to `soranix.user` with routing key `user.registered`

## 🎯 What Happens When You Register a User

```
1. POST /api/v1/auth/register
   ↓
2. Auth Service creates user
   ↓
3. Publishes 'user.registered' event to RabbitMQ
   ↓
4. RabbitMQ routes to 'user.registration' queue
   ↓
5. User Service receives event
   ↓
6. User Service processes registration
```

## 🔍 Troubleshooting

### Issue: "eventBus": "disconnected"

**Solution:**

1. Check RabbitMQ is running:
   ```bash
   docker ps | grep rabbitmq
   ```
2. Check RabbitMQ logs:
   ```bash
   docker logs soranix-rabbitmq
   ```
3. Verify environment variables in both services

### Issue: Event not received by User Service

**Solution:**

1. Check both services are running
2. Verify they're using the same `EVENT_ENCRYPTION_KEY`
3. Check RabbitMQ queues in management UI
4. Check service logs for errors

### Issue: Connection refused

**Solution:**

1. If using Docker: Use `RABBITMQ_HOST=rabbitmq`
2. If running locally: Use `RABBITMQ_HOST=localhost`
3. Ensure RabbitMQ is listening on port 5672

### Issue: Cannot find module '@packages/...'

**Solution:**

```bash
# In project root
npm install

# In each service
cd services/auth && npm install
cd services/users && npm install
```

## 📦 Port Assignments

| Service             | Port  | Health Check                 |
| ------------------- | ----- | ---------------------------- |
| Auth                | 6000  | http://localhost:6000/health |
| Users               | 6001  | http://localhost:6001/health |
| RabbitMQ AMQP       | 5672  | -                            |
| RabbitMQ Management | 15672 | http://localhost:15672       |

## 🎨 Next Steps

1. **Add Database Integration**

   - Implement actual user creation in auth service
   - Implement profile creation in user service

2. **Add More Events**

   - `user.login`
   - `user.logout`
   - `user.profile.updated`

3. **Add More Subscribers**

   - Notification service (send welcome email)
   - Analytics service (track metrics)
   - Audit service (log events)

4. **Production Considerations**
   - Use secrets management for encryption keys
   - Set up monitoring and alerting
   - Configure proper logging
   - Add authentication/authorization

## 📚 Related Documentation

- [USER_REGISTRATION_EVENT_SETUP.md](./USER_REGISTRATION_EVENT_SETUP.md) - Detailed implementation guide
- [RABBITMQ_IMPLEMENTATION.md](./RABBITMQ_IMPLEMENTATION.md) - RabbitMQ architecture
- [EVENT_USAGE_EXAMPLES.md](./EVENT_USAGE_EXAMPLES.md) - Event patterns

## ✅ Quick Checklist

- [ ] Created `.env` files in both services
- [ ] Installed dependencies (`npm install`)
- [ ] Started RabbitMQ (`docker-compose up rabbitmq`)
- [ ] Started Auth service
- [ ] Started User service
- [ ] Verified health endpoints show "connected"
- [ ] Tested user registration
- [ ] Checked logs in both services
- [ ] Verified event in RabbitMQ UI

**Happy coding! 🎉**
