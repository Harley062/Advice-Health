#!/bin/sh
set -e

echo "Waiting for database..."
until python -c "
import os, psycopg2

database_url = os.environ.get('DATABASE_URL')
if database_url:
  if 'sslmode=' not in database_url:
    database_url = database_url + ('&' if '?' in database_url else '?') + 'sslmode=require'
  psycopg2.connect(database_url)
else:
  psycopg2.connect(
    host=os.environ.get('DB_HOST', 'localhost'),
    dbname=os.environ.get('DB_NAME', 'todoapp'),
    user=os.environ.get('DB_USER', 'postgres'),
    password=os.environ.get('DB_PASSWORD', 'postgres'),
    port=os.environ.get('DB_PORT', '5432'),
    sslmode=os.environ.get('DB_SSLMODE', 'prefer'),
  )
" 2>/dev/null; do
  echo "Database unavailable — retrying in 1s..."
  sleep 1
done

echo "Database is ready."
python manage.py migrate --noinput
exec "$@"
