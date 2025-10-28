# PostgreSQL Configuration

## Database Architecture

We use **one PostgreSQL instance with multiple databases** for development. Each microservice gets its own logical database, providing:

- ✅ Logical separation (database per service)
- ✅ Data isolation between services
- ✅ Easier local development
- ✅ Simple to split into separate instances later

## Database Layout

```
PostgreSQL Instance (localhost:5432)
├── auth_db           → Auth Service
├── users_db          → Users Service
├── banking_db        → Banking Service
├── payments_db       → Payments Service
├── bills_db          → Bills Payment Service
├── portfolio_db      → Portfolio Service
├── transfers_db      → Transfers Service
├── notification_db   → Notification Service
└── analytics_db      → Analytics/Reporting
```

## Connection Strings

Each service connects to its own database:

```env
# Auth Service
DATABASE_URL=postgresql://soranix:soranix@localhost:5432/auth_db

# Users Service
DATABASE_URL=postgresql://soranix:soranix@localhost:5432/users_db

# Banking Service
DATABASE_URL=postgresql://soranix:soranix@localhost:5432/banking_db

# Payments Service
DATABASE_URL=postgresql://soranix:soranix@localhost:5432/payments_db
```

## Docker Compose Setup

The PostgreSQL container automatically creates all databases on first start using the initialization script in `init-databases.sh`.

```yaml
services:
  postgres:
    image: postgres:15-alpine
    volumes:
      - ./infra/postgres/init-databases.sh:/docker-entrypoint-initdb.d/init-databases.sh
    environment:
      POSTGRES_USER: soranix
      POSTGRES_PASSWORD: soranix
      POSTGRES_DB: postgres
```

## Accessing Databases

### Via Docker

```bash
# Connect to PostgreSQL
docker exec -it soranix-postgres psql -U soranix

# List all databases
\l

# Connect to specific database
\c auth_db

# List tables
\dt
```

### Via psql (Local)

```bash
# Auth database
psql -h localhost -U soranix -d auth_db

# Users database
psql -h localhost -U soranix -d users_db
```

### Via GUI Tools

- **pgAdmin**: http://localhost:5050
- **DBeaver**: localhost:5432
- **DataGrip**: localhost:5432

Connection details:

- Host: `localhost`
- Port: `5432`
- User: `soranix`
- Password: `soranix`
- Database: `auth_db`, `users_db`, etc.

## Migrations

Each service manages its own migrations:

```bash
# Auth service migrations
cd services/auth
npm run db:generate
npm run db:migrate

# Users service migrations
cd services/users
npm run db:generate
npm run db:migrate
```

## Production Deployment

For production, split into separate PostgreSQL instances:

### Option 1: Managed Databases (Recommended)

```yaml
# AWS RDS, Azure Database, GCP Cloud SQL
auth-service:
  DATABASE_URL: postgresql://user:pass@auth-db.region.rds.amazonaws.com:5432/auth

users-service:
  DATABASE_URL: postgresql://user:pass@users-db.region.rds.amazonaws.com:5432/users
```

### Option 2: Kubernetes StatefulSets

```yaml
# Separate PostgreSQL pods per service
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres-auth
spec:
  serviceName: postgres-auth
  replicas: 1
  template:
    spec:
      containers:
        - name: postgres
          image: postgres:15
          env:
            - name: POSTGRES_DB
              value: auth_db
```

## Backup & Restore

### Backup All Databases

```bash
# Backup all databases
docker exec soranix-postgres pg_dumpall -U soranix > backup_all.sql

# Backup specific database
docker exec soranix-postgres pg_dump -U soranix auth_db > backup_auth.sql
```

### Restore Database

```bash
# Restore all
docker exec -i soranix-postgres psql -U soranix < backup_all.sql

# Restore specific
docker exec -i soranix-postgres psql -U soranix auth_db < backup_auth.sql
```

## Monitoring

### Check Database Sizes

```sql
SELECT
  datname as database_name,
  pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database
WHERE datname LIKE '%_db'
ORDER BY pg_database_size(datname) DESC;
```

### Active Connections

```sql
SELECT
  datname,
  count(*) as connections
FROM pg_stat_activity
WHERE datname LIKE '%_db'
GROUP BY datname;
```

## Best Practices

1. **One Database Per Service** - Never share databases
2. **Service Owns Schema** - Only the owning service can modify schema
3. **No Cross-Database Queries** - Use APIs or events to get data from other services
4. **Migrations in Source Control** - Track all schema changes
5. **Test Migrations** - Always test migrations before production

## Troubleshooting

### Database Not Created

```bash
# Check if init script ran
docker logs soranix-postgres | grep "Creating database"

# Manually create database
docker exec -it soranix-postgres psql -U soranix -c "CREATE DATABASE auth_db;"
```

### Connection Refused

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs soranix-postgres
```

### Permission Denied

```bash
# Grant permissions
docker exec -it soranix-postgres psql -U soranix -c "GRANT ALL PRIVILEGES ON DATABASE auth_db TO soranix;"
```

## Migration to Separate Instances

When ready to split into separate instances:

1. Export each database
2. Create new PostgreSQL instances
3. Import databases
4. Update connection strings
5. Test each service independently
6. Deploy

No code changes needed - just connection string updates!
