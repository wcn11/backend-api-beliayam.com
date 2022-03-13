FROM node:16-alpine

RUN mkdir /app

RUN apk add llvm11-libs --repository=http://dl-cdn.alpinelinux.org/alpine/edge/main

RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.6/main' >> /etc/apk/repositories

RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.6/community' >> /etc/apk/repositories

RUN apk add --update redis=6.2.6-r0

RUN apk update

RUN apk add vim nano

WORKDIR /app

COPY . .

# COPY ./redis-start.sh /root/redis-start.sh

RUN npm install

ENTRYPOINT ["sh","./server-start.sh", "npm", "run", "prod"]