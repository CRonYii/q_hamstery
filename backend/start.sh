#!/bin/bash

python3 manage.py migrate
gunicorn --bind 0.0.0.0:8000 q_hamstery_backend.wsgi
