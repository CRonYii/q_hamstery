## Use with Docker 
Fills environment variable in `docker-compose.yml` as necessary.
Then, run `docker-compose up` to start.
You can login with default credential hamstery/hamstery

# Downgrade Hamstery with Docker 
1. Stop the docker container from running.
1. Make a database backup.
1. Run `docker run -it -v /data/to/hamstery/config:/app/backend/app_data ghcr.io/cronyii/q_hamstery ash start.sh downgrade <target-version>`. Fill `<target-version>` with version number like `v0.1.0`.
1. Pull docker container with the targeted downgraded version and restart q-hamstery with it.