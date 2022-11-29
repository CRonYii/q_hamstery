## Use with Docker 
Fills environment variable in `docker-compose.yml` as necessary.
Then, run `docker-compose up` to start.
If running the application the first time, excute the following commands in the service to get a superuser account setup. 
```
python3 manage.py createsuperuser
```

## Hamstery
Admin site can be accessed at `http://HOST:8000/admin/` (or use the port you specified in `docker-compose.yml`)
You can login with the superuser you created with the `createsuperuser` command. You can then create other users in the admin site.

## QBitTorrent
You are responsible to setup a QBitTorrent client that can be accessed by q-hamstery and provide connection info in enviroment variables.
If you enabled authentication bypass for this machine, `QBITTORRENT_USERNAME` and `QBITTORRENT_PASSWORD` can be omitted.

