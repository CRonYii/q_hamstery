#!/bin/ash

db_path="app_data/db.sqlite3"
if [ ! -e $db_path ]; then
    echo "database file not fould, initializing..."
    cp default.sqlite3 $db_path
fi

nginx
BUILDING=True python3 manage.py run_migration
uwsgi --ini q_hamstery_backend.uwsgi.ini
