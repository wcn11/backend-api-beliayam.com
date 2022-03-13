#!/bin/bash
nohup redis-server &
uwsgi --http 0.0.0.0:8000 --module mymodule.wsgi

# npm install pm2 -g

# pm2 start index.js --name backend-api