FROM python:3.8.13-buster

ARG SECRET_KEY

RUN git clone https://github.com/CRonYii/q_hamstery_backend.git app 
WORKDIR /app
ADD backend.env .env

RUN sed -i "s/\$secret_key/${SECRET_KEY}/" .env
RUN pip3 install -r requirements.txt
RUN pip3 install gunicorn

RUN python3 ./manage.py makemigrations
RUN python3 ./manage.py collectstatic
