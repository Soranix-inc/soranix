# 🎉 User Registration Event System Setup

This document describes the implementation of the `user.registered` event flow between the **Auth Service** (publisher) and **User Service** (subscriber).

## 📋 Overview

When a user registers through the Auth Service, it publishes a `user.registered` event to RabbitMQ. The User Service listens for this event and can perform actions like:

- Creating a user profile
- Initializing user preferences
- Setting up user resources (wallet, portfolio, etc.)
- Sending notifications

## 🏗️ Architecture

```
User Registration Request
         ↓
  Auth Service (/api/v1/auth/register)
         ↓
  Save User (TODO: Add your DB logic)
         ↓
  Publish 'user.registered' Event
         ↓
  RabbitMQ (soranix.user exchange)
         ↓
  User Service (subscribed to 'users.registration' queue)
         ↓
  Process User Registration
         ↓
  Create Profile, Initialize Resources, etc.
```

## 📁 Files Created

### Auth Service

1. **`services/auth/src/events/event-bus.ts`**

   - Manages RabbitMQ connection and event publisher
   - Singleton pattern for easy access across the service

2. **`services/auth/src/events/publishers/user-event-publisher.ts`**

   - Publishes `user.registered` events
   - Handles event metadata and encryption

3. **Updated: `services/auth/src/services/auth/auth.controllers.ts`**

   - Added user registration logic
   - Publishes event after successful registration

4. **Updated: `services/auth/src/app.ts`**

   - Initializes event bus on startup
   - Added event bus status to health check

5. **Updated: `services/auth/package.json`**
   - Added `@packages/events` and `@packages/rabbitmq` dependencies

### User Service

1. **`services/users/src/events/event-bus.ts`**

   - Manages RabbitMQ connection and event subscriber
   - Singleton pattern for easy access

2. **`services/users/src/events/subscribers/user-event-subscriber.ts`**

   - Subscribes to `user.registered` events
   - Handles incoming user registration events

3. **Updated: `services/users/src/app.ts`**
   - Initializes event bus on startup
   - Added event bus status to health check

## 🚀 Getting Started

### 1. Install Dependencies

In both services, run:

```bash
# Auth service
cd services/auth
npm install

# User service
cd services/users
npm install
```

### 2. Set Up Environment Variables

Create `.env` files in both services with the following variables:

**Auth Service (`services/auth/.env`):**

```env
PORT=6000
NODE_ENV=development

# RabbitMQ Configuration
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/

# Event Encryption (64-character hex string)
EVENT_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

**User Service (`services/users/.env`):**

```env
PORT=6001
NODE_ENV=development

# RabbitMQ Configuration
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/

# Event Encryption (Must match the key in auth service)
EVENT_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/users_db
```

### 3. Start RabbitMQ

Using Docker Compose:

```bash
docker-compose -f docker-compose.local.yaml up rabbitmq
```

Or using Docker directly:

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

### 4. Start Services

**Terminal 1 - Auth Service:**

```bash
cd services/auth
npm run dev
```

**Terminal 2 - User Service:**

```bash
cd services/users
npm run dev
```

### 5. Verify Health

Check both services are healthy:

```bash
# Auth service
curl http://localhost:6000/health

# User service
curl http://localhost:6001/health
```

Both should show `"eventBus": "connected"`.

## 🧪 Testing the Flow

### 1. Register a New User

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

### 2. Check Service Logs

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
User registration processed successfully { userId: '...' }
```

### 3. Monitor RabbitMQ

Open RabbitMQ Management UI: http://localhost:15672

- Username: `guest`
- Password: `guest`

Check:

- **Exchanges**: `soranix.user` should exist
- **Queues**: `users.registration` should exist
- **Message flow**: Watch messages being published and consumed

## 🔧 Customization

### Add Database Logic in Auth Service

Update `services/auth/src/services/auth/auth.controllers.ts`:

```typescript
register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phoneNumber } = req.body;

  // ✅ Add your database logic here
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = await authService.createUser({
    email,
    password: hashedPassword,
    firstName,
    lastName,
    phoneNumber,
  });

  // ... rest of the code
});
```

### Add User Profile Creation in User Service

Update `services/users/src/events/subscribers/user-event-subscriber.ts`:

```typescript
private async handleUserRegistration(data: UserRegisteredData): Promise<void> {
  // ✅ Add your profile creation logic
  await userRepository.createProfile({
    userId: data.userId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    phoneNumber: data.phoneNumber,
    createdAt: new Date(),
  });

  // ✅ Initialize user preferences
  await preferencesService.initializeDefaults(data.userId);

  // ✅ Create user wallet
  await walletService.createWallet(data.userId);
}
```

## 📊 Event Configuration

The `user.registered` event has these settings:

- **Priority**: HIGH
- **Delivery Guarantee**: AT_LEAST_ONCE
- **Encryption**: ENABLED (sensitive data)
- **TTL**: 7 days
- **Max Retries**: 3

Configuration is in `packages/events/src/types/user-events.ts`.

## 🔍 Monitoring

### Health Checks

```bash
# Check auth service
curl http://localhost:6000/health

# Check user service
curl http://localhost:6001/health
```

### RabbitMQ Management

Access the UI at http://localhost:15672 to monitor:

- Queue depths
- Message rates
- Consumer status
- Failed messages in dead letter queues

### Service Logs

Both services use `@packages/logging` for structured logging:

- Event publishing logs
- Event consumption logs
- Error logs with context

## 🚨 Troubleshooting

### Event Not Being Received

1. **Check RabbitMQ connection**:

   ```bash
   curl http://localhost:6000/health
   curl http://localhost:6001/health
   ```

   Both should show `"eventBus": "connected"`.

2. **Check RabbitMQ queues**:

   - Open http://localhost:15672
   - Go to "Queues" tab
   - Check if `users.registration` queue exists
   - Check if there are unprocessed messages

3. **Check service logs**:
   - Auth service should log "Event published successfully"
   - User service should log "Received user.registered event"

### Connection Errors

1. **RabbitMQ not running**:

   ```bash
   docker ps | grep rabbitmq
   ```

   If not running, start it:

   ```bash
   docker-compose -f docker-compose.local.yaml up rabbitmq
   ```

2. **Wrong credentials**:

   - Check `.env` files in both services
   - Verify `RABBITMQ_USERNAME` and `RABBITMQ_PASSWORD`

3. **Port conflicts**:
   - Ensure ports 5672 (AMQP) and 15672 (Management UI) are available

### Event Encryption Issues

- Ensure `EVENT_ENCRYPTION_KEY` is the **same** in both services
- Key must be exactly 64 hexadecimal characters
- Generate a new key:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

## 🎯 Next Steps

1. **Add more event types**:

   - `user.login`
   - `user.logout`
   - `user.profile.updated`
   - `user.password.changed`

2. **Add more subscribers**:

   - Notification service (send welcome email)
   - Analytics service (track user metrics)
   - Audit service (log registration events)

3. **Add database integration**:

   - Implement actual user creation in auth service
   - Implement profile creation in user service

4. **Add validation**:

   - Validate email format
   - Check for duplicate emails
   - Enforce password requirements

5. **Add error handling**:
   - Implement retry logic
   - Handle dead letter queue messages
   - Add circuit breakers

## 📚 Related Documentation

- [RABBITMQ_IMPLEMENTATION.md](./RABBITMQ_IMPLEMENTATION.md) - Complete RabbitMQ setup guide
- [EVENT_USAGE_EXAMPLES.md](./EVENT_USAGE_EXAMPLES.md) - Event patterns and examples
- [packages/events/README.md](./packages/events/README.md) - Events package documentation
- [packages/rabbitmq/README.md](./packages/rabbitmq/README.md) - RabbitMQ package documentation

## ✅ Summary

You now have a fully functional event-driven communication between services:

- ✅ Auth service publishes `user.registered` events
- ✅ User service subscribes and processes these events
- ✅ Encrypted event data for security
- ✅ Automatic reconnection on failures
- ✅ Dead letter queues for failed messages
- ✅ Health checks for monitoring
- ✅ Comprehensive logging

**Happy eventing! 🎉**
