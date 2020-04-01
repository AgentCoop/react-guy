FROM node:12.10.0-alpine

WORKDIR /usr/src/app
ADD . /usr/src/app

RUN set -xe \
    && npm install