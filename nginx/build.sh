#!/bin/bash

cd webapp
npm install
PUBLIC_URL=/webapp npm run build
rm -rf ../build
mv build ../
