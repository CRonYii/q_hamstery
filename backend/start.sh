#!/bin/bash

python3 manage.py migrate
uwsgi --ini q_hamstery_backend.uwsgi.ini
