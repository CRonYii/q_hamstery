FROM python:3.8.13-buster

ARG BUILDING=True

COPY app /app
WORKDIR /app

# Install backend dependency
RUN pip3 install -r requirements.txt --no-cache-dir
RUN pip3 install gunicorn

# Run Django setup
RUN python3 ./manage.py collectstatic --no-input

ADD start.sh /usr/local/bin/start.sh
RUN chmod 777 /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
