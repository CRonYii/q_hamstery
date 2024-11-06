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

# Setup Backend
WORKDIR /app/backend

# Install backend dependency
COPY backend ./
RUN pip3 install --ignore-installed -r requirements.txt --no-cache-dir

# Setup uwsgi
RUN mkdir /tmp/uwsgi
COPY q_hamstery_backend.uwsgi.ini /app/backend/q_hamstery_backend.uwsgi.ini
RUN pip3 install uwsgi

RUN python3 ./manage.py collectstatic --no-input
RUN python3 ./manage.py migrate

# Setup Frontend
WORKDIR /run/nginx

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build /app/webapp/build /var/www/html/webapp

# Remove unnecessary files from runtime
RUN apk del gcc \
			libc-dev \
			linux-headers

# Prepare container entrypoint
WORKDIR /app/backend
COPY start.sh start.sh
RUN chmod 777 start.sh

EXPOSE 80/tcp 443/tcp

CMD ["./start.sh"]
