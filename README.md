## Installation
Create a `.env` file with the following and fill accordingly
```
HAMSTERY_PORT=8000
LIBRARY_PATH=/home/user/library
SECRET_KEY=insecure-put-a-random-secret-here
HOST=www.example.com
```
Then, run `docker-compose up` to start.

## Hamstery
Admin site can be accessed at `http://HOST:HAMSTERY_PORT/admin/`
Default login is `admin/hamsteryadmin`, change password after you login to admin site.

## QBitTorrent
QBitTorrent can be accessed at `http://HOST:QBT_PORT`, default login is `admin/adminadmin`, you should not change the credentials since hamstery uses the default credential to communicate with QBitTorrent. Therefore, you should not expose this QBitTorrent to untrusted network. Customized QBitTorrent crendentials may be supported in future version.
This QBitTorrent should not be used for any other downloading purpose.
