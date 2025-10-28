#!/bin/bash
set -e

# Script to initialize multiple databases in a single PostgreSQL instance
# This runs automatically when the PostgreSQL container starts for the first time

echo "🔧 Creating databases for Soranix microservices..."

# Function to create database if it doesn't exist
create_database() {
    local database=$1
    echo "📦 Creating database: $database"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        SELECT 'CREATE DATABASE $database'
        WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$database')\gexec
EOSQL
    echo "✅ Database $database created/verified"
}

# Create databases for each microservice
create_database "auth_db"
create_database "users_db"
create_database "ledger_db"
create_database "banking_db"
create_database "payments_db"
create_database "bills_db"
create_database "portfolio_db"
create_database "transfers_db"
create_database "notification_db"
create_database "analytics_db"

echo ""
echo "✨ All databases created successfully!"
echo ""
echo "📋 Available databases:"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -c "\l" | grep "_db"
echo ""

