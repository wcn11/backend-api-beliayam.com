#!/bin/bash
nohup redis-server &
uwsgi --http 0.0.0.0:8000 --module mymodule.wsgi

nohup /etc/init.d/mongodb start

npm run dev