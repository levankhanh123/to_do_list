#!/bin/sh
set -e

: "${PORT:=8000}"

mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

if [ -n "${MYSQL_ATTR_SSL_CA_CONTENT:-}" ]; then
    mkdir -p storage/certs
    printf '%s' "$MYSQL_ATTR_SSL_CA_CONTENT" > storage/certs/aiven-ca.pem
    export MYSQL_ATTR_SSL_CA=/app/storage/certs/aiven-ca.pem
fi

php artisan config:clear --no-interaction
php artisan view:clear --no-interaction

if [ "${RUN_MIGRATIONS:-true}" != "false" ]; then
    php artisan migrate --force --no-interaction
fi

php artisan config:cache --no-interaction

exec php artisan serve --host=0.0.0.0 --port="$PORT"
