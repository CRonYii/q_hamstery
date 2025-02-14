### Build frontend web app
FROM node:22-alpine3.20 AS build

ARG HAMSTERY_VERSION
ENV REACT_APP_VERSION=$HAMSTERY_VERSION

WORKDIR /app/webapp
COPY webapp ./

RUN npm ci && \
PUBLIC_URL=/ npm run build

### Ngnix and Django
FROM alpine:3.13 AS base

ARG HAMSTERY_VERSION
ENV HAMSTERY_VERSION=$HAMSTERY_VERSION
ENV HAMSTERY_PORT=8001
ENV NUM_WORKERS=1

# Install alpine dependecy
RUN apk add --no-cache \
		# Runtime
        nginx \
		python3 \
		tzdata \
		# Build dependencies
		py3-pip \
		pcre-dev \
		python3-dev \
		libxml2-dev \
		libxslt-dev \
		gcc \
		libc-dev \
		linux-headers \
		gettext \
		shadow \
		su-exec \
		&& rm -rf /var/cache/apk/*

# Setup Backend
WORKDIR /app/backend

# Install backend dependency
COPY backend/requirements.txt ./requirements.txt
RUN pip3 install --upgrade pip && \
	pip3 install --ignore-installed -r requirements.txt --no-cache-dir

# Setup uwsgi
RUN mkdir /tmp/uwsgi
COPY q_hamstery_backend.uwsgi.ini /app/backend/q_hamstery_backend.uwsgi.ini.template
RUN pip3 install uwsgi

# Set Django args
ARG FIRST_RUN=True
ARG BUILDING=True
ARG DJANGO_SUPERUSER_EMAIL=admin@hamstery.com
ARG DJANGO_SUPERUSER_USERNAME=hamstery
ARG DJANGO_SUPERUSER_PASSWORD=hamstery

COPY backend/ ./
# Initialize sqlite database for first run
RUN python3 ./manage.py collectstatic --no-input && \
	python3 ./manage.py migrate && \
	python3 ./manage.py createsuperuser --noinput && \
	mv app_data/db.sqlite3 ./default.sqlite3 && \
	mkdir -p /var/www/html && \
	cp -r ./static /var/www/html

# Setup Frontend
WORKDIR /run/nginx

COPY nginx.conf /etc/nginx/nginx.conf.template

COPY --from=build /app/webapp/build /var/www/html/

# Remove unnecessary files from runtime
RUN apk del gcc \
			libc-dev \
			linux-headers

# Prepare container entrypoint
WORKDIR /app/backend

RUN addgroup -g 1000 -S hamstery && \
	adduser -S -G hamstery -u 1000 -h /app/ -s /bin/ash -D hamstery

COPY start.sh start.sh
RUN chmod 777 start.sh && \
	chown -R hamstery:hamstery ./

EXPOSE 80/tcp 443/tcp

CMD ["./start.sh"]
