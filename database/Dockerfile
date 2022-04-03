FROM mongo:3.6.8

# RUN apk add llvm11-libs --repository=http://dl-cdn.alpinelinux.org/alpine/edge/main

# RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.6/main' >> /etc/apk/repositories

# RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.6/community' >> /etc/apk/repositories

# RUN apk add mongodb

# RUN apk add mongodb-tools

RUN mkdir -p /data/db

COPY . .

# ENTRYPOINT ["sh","./mongo-start.sh"]