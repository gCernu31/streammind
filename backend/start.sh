#!/bin/sh
set -e

echo "🔄 Applicazione migrazioni database..."
node /app/backend/migrate.js

echo "🟣 Avvio StreaMind API..."
exec node /app/backend/server.js
