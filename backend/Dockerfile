FROM alpine:3.13

ARG BUILDING=True

RUN mkdir /tmp/uwsgi
COPY app /app
COPY q_hamstery_backend.uwsgi.ini /app/q_hamstery_backend.uwsgi.ini
WORKDIR /app

RUN apk add --no-cache \
		# Runtime
		python3 \
        uwsgi-python3 \
		# Build dependencies
		py3-pip \
		python3-dev \
		libxml2-dev \
		libxslt-dev \
		gcc \
		libc-dev \
		linux-headers \
		&& rm -rf /var/cache/apk/*

# Install backend dependency
RUN pip3 install -r requirements.txt --no-cache-dir

# Run Django setup
RUN python3 ./manage.py collectstatic --no-input

RUN apk del gcc \
			libc-dev \
			linux-headers

COPY start.sh start.sh
RUN chmod 777 start.sh

CMD ["./start.sh"]
