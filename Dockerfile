### Build frontend web app
FROM node:22-alpine3.20 AS build

WORKDIR /app/webapp

COPY webapp ./

RUN npm ci
RUN PUBLIC_URL=/webapp npm run build

### Ngnix and Django
FROM alpine:3.13 AS base

ARG FIRST_RUN=True
ARG BUILDING=True

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
		&& rm -rf /var/cache/apk/*

# Install Nginx configurations
WORKDIR /run/nginx

COPY nginx.conf /etc/nginx/nginx.conf
COPY hamstery.conf /etc/nginx/conf.d/hamstery.conf

# Prepare webapp for serving in static
COPY --from=build /app/webapp/build /var/www/html/webapp

WORKDIR /app/backend

RUN mkdir /tmp/uwsgi
COPY backend ./
COPY q_hamstery_backend.uwsgi.ini /app/backend/q_hamstery_backend.uwsgi.ini

# Install backend dependency
RUN pip3 install uwsgi
RUN pip3 install --ignore-installed -r requirements.txt --no-cache-dir

# Run Django setup
RUN python3 ./manage.py collectstatic --no-input
RUN python3 ./manage.py migrate

RUN apk del gcc \
			libc-dev \
			linux-headers

COPY start.sh start.sh
RUN chmod 777 start.sh

EXPOSE 80/tcp 443/tcp

CMD ["./start.sh"]