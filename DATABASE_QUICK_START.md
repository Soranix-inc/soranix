# 🗄️ Database Quick Start - One PostgreSQL, Multiple Databases

## ✅ What's Been Set Up

### Infrastructure

- ✅ **One PostgreSQL 15 container** (`soranix-postgres`)
- ✅ **9 separate databases** automatically created on startup:
  - `auth_db` → Auth Service
  - `users_db` → Users Service
  - `banking_db` → Banking Service
  - `payments_db` → Payments Service
  - `bills_db` → Bills Payment Service
  - `portfolio_db` → Portfolio Service
  - `transfers_db` → Transfers Service
  - `notification_db` → Notification Service
  - `analytics_db` → Analytics Service

### Configuration

- ✅ Docker Compose configured with PostgreSQL
- ✅ Automatic database initialization script
- ✅ Services configured with DATABASE_URL
- ✅ Health checks for PostgreSQL
- ✅ Persistent data volumes

---

## 🚀 Start Using It (3 Steps)

### 1. Start PostgreSQL

```bash
docker-compose -f docker-compose.local.yaml up postgres -d
```

Wait 5-10 seconds for databases to be created.

### 2. Verify Databases

```bash
# Check logs (should show all 9 databases created)
docker logs soranix-postgres | grep "Creating database"

# List databases
docker exec -it soranix-postgres psql -U soranix -c "\l" | grep "_db"
```

### 3. Start Your Services

```bash
# Auth service (connects to auth_db)
docker-compose up soranix-auth -d

# Users service (connects to users_db)
docker-compose up soranix-users -d
```

**That's it!** Each service automatically connects to its own database. 🎉

---

## 🔌 Connection Details

### Credentials

- **Host:** `localhost` (or `postgres` from inside Docker)
- **Port:** `5432`
- **Username:** `soranix`
- **Password:** `soranix`

### Connection Strings (Already Configured)

```env
# Auth Service
DATABASE_URL=postgresql://soranix:soranix@postgres:5432/auth_db

# Users Service
DATABASE_URL=postgresql://soranix:soranix@postgres:5432/users_db

# Banking Service
DATABASE_URL=postgresql://soranix:soranix@postgres:5432/banking_db

# Add more as needed...
```

---

## 💻 Quick Commands

```bash
# Connect to any database
docker exec -it soranix-postgres psql -U soranix -d auth_db

# List all databases
docker exec -it soranix-postgres psql -U soranix -c "\l"

# Check database sizes
docker exec -it soranix-postgres psql -U soranix -c "
  SELECT datname, pg_size_pretty(pg_database_size(datname))
  FROM pg_database WHERE datname LIKE '%_db';
"

# Backup all databases
docker exec soranix-postgres pg_dumpall -U soranix > backup.sql

# Stop PostgreSQL
docker-compose stop postgres

# Remove data (CAUTION!)
docker-compose down -v
```

---

## 📊 Database Per Service

Each service has its own database. **Never query across databases!**

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Auth Service │      │ Users Service│      │Banking Svc   │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       ↓                     ↓                     ↓
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   auth_db    │      │   users_db   │      │  banking_db  │
└──────────────┘      └──────────────┘      └──────────────┘
           ↖                  ↑                     ↗
            ╲                 │                    ╱
             ╲                │                   ╱
              ╲               │                  ╱
               ┌──────────────────────────────┐
               │  Single PostgreSQL Instance  │
               │    (soranix-postgres)        │
               └──────────────────────────────┘
```

### Communication Between Services

❌ **Don't do this:**

```sql
-- DON'T JOIN ACROSS DATABASES!
SELECT * FROM auth_db.users
JOIN users_db.profiles ON ...;  -- ❌ This won't work!
```

✅ **Do this instead:**

```typescript
// Use events or API calls
const user = await authService.getUser(userId);
const profile = await usersService.getProfile(userId);
```

---

## 🔄 Migrations with Drizzle

Each service manages its own migrations:

```bash
# Auth service
cd services/auth
npm run db:generate    # Create migration
npm run db:migrate     # Apply migration
npm run db:studio      # Visual editor

# Users service
cd services/users
npm run db:generate
npm run db:migrate
npm run db:studio
```

---

## 🎯 Why This Approach?

### ✅ Advantages

1. **Logical Separation** - Each service owns its data
2. **Simple Setup** - One container to manage
3. **Low Cost** - Minimal resources for development
4. **Easy Split** - Can separate later with just connection string changes
5. **No Code Changes** - Services don't know they share infrastructure

### 🔮 Future: Separate Instances

When ready for production, just change connection strings:

```env
# Before (shared)
DATABASE_URL=postgresql://soranix:soranix@postgres:5432/auth_db

# After (separate)
DATABASE_URL=postgresql://auth_user:pass@auth-db.region.rds.amazonaws.com:5432/auth
```

**No code changes needed!** ✅

---

## 📚 Documentation

- **`DATABASE_SETUP_GUIDE.md`** - Complete guide with troubleshooting
- **`infra/postgres/README.md`** - Infrastructure details
- **Drizzle docs:** https://orm.drizzle.team/

---

## ✨ Summary

**You now have:**

- ✅ One PostgreSQL instance with 9 databases
- ✅ Automatic database creation on startup
- ✅ Each service configured with its own database
- ✅ Ready for migrations and development
- ✅ Path to split into separate instances later

**Start developing!**

```bash
# 1. Start database
docker-compose up postgres -d

# 2. Start services
docker-compose up soranix-auth soranix-users -d

# 3. Run migrations
cd services/auth && npm run db:migrate

# 4. Code! 🚀
```

**Happy coding!** 🎉
