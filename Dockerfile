FROM node:19-alpine

# Configure LiteFS -- https://fly.io/docs/litefs/getting-started/
# https://github.com/superfly/litefs-example/blob/main/Dockerfile

RUN apk add bash fuse sqlite ca-certificates curl
COPY --from=flyio/litefs:0.3 /usr/local/bin/litefs /usr/local/bin/litefs
ADD etc/litefs.yml /etc/litefs.yml

RUN apk add --update alpine-sdk
RUN apk add python3

RUN npm install -g pnpm

COPY pnpm-lock.yaml ./
RUN pnpm fetch --prod

ADD . ./
RUN pnpm install -r --offline --prod

EXPOSE 8080

WORKDIR /server
ENTRYPOINT litefs mount -- dist/server.js

# docs:
# https://pnpm.io/cli/fetch
# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/