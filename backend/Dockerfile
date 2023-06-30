FROM python:3.8.13-buster

ARG BUILDING=True

RUN mkdir /tmp/uwsgi
COPY app /app
COPY q_hamstery_backend.uwsgi.ini /app/q_hamstery_backend.uwsgi.ini
WORKDIR /app

# Install backend dependency
RUN pip3 install -r requirements.txt --no-cache-dir
RUN pip3 install uwsgi

# Run Django setup
RUN python3 ./manage.py collectstatic --no-input

COPY start.sh /usr/local/bin/start.sh
RUN chmod 777 /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
