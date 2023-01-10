FROM node:19-alpine
WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml ./
COPY .npmrc ./
RUN pnpm fetch --prod

ADD . ./
RUN pnpm install -r --offline --prod

EXPOSE 8080

WORKDIR /app/server
CMD [ "dist/server.js" ]

# docs:
# https://pnpm.io/cli/fetch
# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/