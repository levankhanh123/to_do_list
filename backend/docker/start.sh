#!/bin/sh
set -e

: "${PORT:=8000}"

mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

php artisan config:clear --no-interaction
php artisan view:clear --no-interaction

if [ "${RUN_MIGRATIONS:-true}" != "false" ]; then
    php artisan migrate --force --no-interaction
fi

php artisan config:cache --no-interaction

exec php artisan serve --host=0.0.0.0 --port="$PORT"
