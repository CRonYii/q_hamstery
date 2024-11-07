#!/bin/ash

PUID=${PUID:-1000}
PGID=${PGID:-1000}

groupmod -o -g "${PGID}" hamstery
usermod -o -u "${PUID}" hamstery

chown -R hamstery:hamstery \
	/app \
    /tmp/uwsgi \
	/etc/nginx \
	/var/lib/nginx \
	/var/log/nginx

db_path="app_data/db.sqlite3"
if [ ! -e $db_path ]; then
    echo "database file not fould, initializing..."
    cp default.sqlite3 $db_path
fi

nginx
BUILDING=True python3 manage.py run_migration
exec su-exec hamstery uwsgi --ini q_hamstery_backend.uwsgi.ini
