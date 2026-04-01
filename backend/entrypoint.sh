#!/bin/sh
set -e

echo "Waiting for database..."
until python -c "
import os, psycopg2
psycopg2.connect(
    host=os.environ.get('DB_HOST', 'localhost'),
    dbname=os.environ.get('DB_NAME', 'todoapp'),
    user=os.environ.get('DB_USER', 'postgres'),
    password=os.environ.get('DB_PASSWORD', 'postgres'),
    port=os.environ.get('DB_PORT', '5432'),
)
" 2>/dev/null; do
  echo "Database unavailable — retrying in 1s..."
  sleep 1
done

echo "Database is ready."
python manage.py migrate --noinput
exec "$@"
