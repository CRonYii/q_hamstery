#!/bin/ash

nginx
BUILDING=True python3 manage.py run_migration
uwsgi --ini q_hamstery_backend.uwsgi.ini
