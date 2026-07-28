FROM node:24-slim AS build
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
ARG STRUT_APP_BASEPATH=/slides
ENV STRUT_APP_BASEPATH=${STRUT_APP_BASEPATH}
RUN pnpm build \
  && pnpm prune --prod

FROM node:24-slim AS runtime
WORKDIR /app
RUN useradd --create-home --uid 10001 slides

COPY --chown=slides:slides --from=build /app/node_modules ./node_modules
COPY --chown=slides:slides --from=build /app/dist ./dist
COPY --chown=slides:slides --from=build /app/migrations ./migrations
COPY --chown=slides:slides --from=build /app/migrations-d1 ./migrations-d1
COPY --chown=slides:slides --from=build /app/scripts/start-rindle-docker.mjs ./scripts/start-rindle-docker.mjs
COPY --chown=slides:slides --from=build /app/server/node-server.mjs ./server/node-server.mjs
COPY --chown=slides:slides --from=build /app/package.json ./
COPY --chown=slides:slides daemon.docker.json ./daemon.json

RUN mkdir -p /var/lib/slides /var/lib/slides-auth \
  && chown slides:slides /var/lib/slides /var/lib/slides-auth

USER slides
ENV NODE_ENV=production
EXPOSE 3000 7600 7601
CMD ["node", "server/node-server.mjs"]
