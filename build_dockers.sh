#!/bin/sh

ver=$( cat .version )
echo "Building v$ver"

# Update git submodule to latest
cd backend/app
git pull
cd ../..
cd nginx/webapp
git pull
cd ../
# Build frontend webap artifacts
./build.sh
cd ..
# Build and tag docker image
sudo docker build ./backend/ -t q_hamstery_backend
sudo docker image tag q_hamstery_backend cronyii/q_hamstery_backend:latest
sudo docker image tag q_hamstery_backend cronyii/q_hamstery_backend:$ver
sudo docker build ./nginx/ -t q_hamstery_nginx
sudo docker image tag q_hamstery_nginx cronyii/q_hamstery_nginx:latest
sudo docker image tag q_hamstery_nginx cronyii/q_hamstery_nginx:$ver
# Push to Docker Hub
sudo docker push cronyii/q_hamstery_backend:latest
sudo docker push cronyii/q_hamstery_backend:$ver
sudo docker push cronyii/q_hamstery_nginx:latest
sudo docker push cronyii/q_hamstery_nginx:$ver
