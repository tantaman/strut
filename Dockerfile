FROM debian:bullseye as builder

ENV PATH=/usr/local/node/bin:$PATH
ARG NODE_VERSION=19.0.1

RUN apt-get update; apt install -y curl python-is-python3 pkg-config build-essential && \
    curl -sL https://github.com/nodenv/node-build/archive/master.tar.gz | tar xz -C /tmp/ && \
    /tmp/node-build-master/bin/node-build "${NODE_VERSION}" /usr/local/node && \
rm -rf /tmp/node-build-master

RUN mkdir /app
WORKDIR /app

COPY . .

RUN npm install -g pnpm
RUN pnpm install
RUN pnpm run build


FROM debian:bullseye-slim

LABEL fly_launch_runtime="nodejs"

COPY --from=builder /usr/local/node /usr/local/node
COPY --from=builder /app /app

RUN apt-get update; apt install -y fuse3 ca-certificates curl
COPY --from=flyio/litefs:0.4 /usr/local/bin/litefs /usr/local/bin/litefs
ADD etc/litefs.yml /etc/litefs.yml

WORKDIR /app
ENV NODE_ENV production
ENV PATH /usr/local/node/bin:/usr/local/bin:$PATH

ENTRYPOINT litefs mount
