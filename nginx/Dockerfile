FROM nginx:1.22.1

COPY nginx.conf /etc/nginx/nginx.conf
COPY hamstery.conf.template /etc/nginx/templates/hamstery.conf.template

# Prepare webapp for serving in static
COPY build /var/www/html/webapp

