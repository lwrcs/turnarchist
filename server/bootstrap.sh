#!/bin/bash

# Terminate script on error
set -e

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running. Please start Docker and try again."
    exit 1
fi

echo -e "\n\033[36mStarting PostgreSQL container...\033[0m"
# Check if the Postgres container exists (running or not)
if docker ps -a --filter "name=postgres" | grep -w "postgres" >/dev/null 2>&1; then
    # If it exists, but isn't running, start it
    if ! docker ps --filter "name=postgres" | grep -w "postgres" >/dev/null 2>&1; then
        docker start postgres > /dev/null
        echo "PostgreSQL container 'postgres' has been started."
    else
        echo "PostgreSQL container 'postgres' is already running."
    fi
else
    # If it doesn't exist, create and start it
    docker run -d --name postgres -e POSTGRES_PASSWORD=informationshouldbefree -p 5432:5432 postgres -c log_statement=all
    echo "PostgreSQL container 'postgres' has been created and started."
fi

# Wait for PostgreSQL to start
echo -e "\n\033[36mWaiting for PostgreSQL to be ready...\033[0m"
until docker exec postgres pg_isready -U postgres; do
    echo "Waiting for PostgreSQL..."
    sleep 1
done

echo -e "\n\033[36mCreating 'turnarchist' user...\033[0m"

# Check if the 'turnarchist' user already exists
USER_EXISTS=$(docker exec postgres psql -U postgres -t -c "SELECT 1 FROM pg_roles WHERE rolname = 'turnarchist';" | tr -d '[:space:]')

if [ "$USER_EXISTS" = "1" ]; then
    echo "User 'turnarchist' already exists."
else
    docker exec postgres psql -U postgres -c "CREATE ROLE turnarchist WITH LOGIN SUPERUSER PASSWORD 'informationshouldbefree';"
    echo "User 'turnarchist' has been created."
fi

echo -e "\n\033[36mCreating 'turnarchist' database...\033[0m"

# Check if the 'turnarchist' database already exists
DATABASE_EXISTS=$(docker exec postgres psql -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname = 'turnarchist';" | tr -d '[:space:]')

if [ "$DATABASE_EXISTS" = "1" ]; then
    echo "Database 'turnarchist' already exists."
else
    docker exec postgres psql -U postgres -c "CREATE DATABASE turnarchist WITH OWNER = turnarchist;"
    echo "Database 'turnarchist' has been created."
fi

echo -e "\n\033[36mCreating 'turnarchist' schema...\033[0m"

# Check if the 'turnarchist' schema already exists
SCHEMA_EXISTS=$(docker exec postgres psql -U turnarchist -d turnarchist -t -c "SELECT 1 FROM information_schema.schemata WHERE schema_name = 'turnarchist';" | tr -d '[:space:]')

if [ "$SCHEMA_EXISTS" = "1" ]; then
    echo "Schema 'turnarchist' already exists."
else
    docker exec postgres psql -U turnarchist -d turnarchist -c "CREATE SCHEMA turnarchist;"
    echo "Schema 'turnarchist' has been created."
fi

echo -e "\n\033[36mFinished bootstrapping development environment for turnarchist server!\033[0m"