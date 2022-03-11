#!/bin/bash
nohup redis-server &
uwsgi --http 0.0.0.0:8000 --module mymodule.wsgi

git pull
pm2 restart backend-api --update-env
pm2 logs backend-api --lines 200