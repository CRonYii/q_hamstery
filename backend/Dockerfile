FROM python:3.8.13-buster

ARG BUILDING=True

COPY app /app
WORKDIR /app

# Install backend dependency
RUN pip3 install -r requirements.txt --no-cache-dir
RUN pip3 install gunicorn

# Run Django setup
RUN python3 ./manage.py collectstatic --no-input

# Prepare webapp for serving in static
# RUN wget https://github.com/CRonYii/q-hamstery-webapp/releases/download/v0.0.1/q-hamstery-webapp-v0.0.1.zip
# RUN unzip q-hamstery-webapp-v0.0.1.zip
# RUN mv build static/webapp
# RUN rm -rf q-hamstery-webapp-v0.0.1.zip

ADD start.sh /usr/local/bin/start.sh
RUN chmod 777 /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
