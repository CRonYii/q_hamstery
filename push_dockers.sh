#!/bin/sh

ver=$( cat .version )
echo "Pushing v$ver to docker hub"

# Push to Docker Hub
sudo docker push cronyii/q_hamstery_backend:latest
sudo docker push cronyii/q_hamstery_backend:$ver
sudo docker push cronyii/q_hamstery_nginx:latest
sudo docker push cronyii/q_hamstery_nginx:$ver
