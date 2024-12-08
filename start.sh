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

if [ "$#" -ne 0 ]; then
	command="$1"
	if [[ $command == "downgrade" ]];  then
		if [ ! -e $db_path ]; then
			echo "Failed to downgrade: database file not fould. Make sure you have mount the database file to docker."
			exit 1
		fi
		version="$2"
		BUILDING=True python3 manage.py downgrade $version
		exit 0
	fi
	echo "Unknown command."
	exit 1
fi

if [ ! -e $db_path ]; then
    echo "database file not fould, initializing..."
    cp default.sqlite3 $db_path
fi

envsubst '${HOST},${HAMSTERY_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
nginx

BUILDING=True python3 manage.py run_migration
exec su-exec hamstery uwsgi --ini q_hamstery_backend.uwsgi.ini
