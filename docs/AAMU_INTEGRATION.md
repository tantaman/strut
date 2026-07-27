# Aamu Slides integration

The Aamu fork is mounted under one `/slides` base path:

- `/slides/project/:pid` — project deck dashboard
- `/slides/deck/:id` — editor
- `/slides/deck/:id/play` — presentation
- `/slides/share/:id` — public share viewer
- `/slides/auth/aamu/callback` and `/slides/api/*` — auth and API

Aamu owns `/decks/:pid`, mirrors deck metadata in `slides_decks`, and launches
Slides through a one-time authorization code. The code is stored hashed in
`slides_auth_codes`, expires after 60 seconds, and is consumed atomically.

Required shared configuration:

```dotenv
SLIDES_PUBLIC_URL=https://example.aamu.app
AAMU_INTERNAL_URL=http://aamuapp:4001
AAMU_SLIDES_SHARED_SECRET=...
AAMU_SLIDES_SESSION_SECRET=...
AAMU_SLIDES_WEBHOOK_SECRET=...
BETTER_AUTH_SECRET=...
SLIDES_RINDLE_WS_URL=wss://example.aamu.app/slides/rindle
RINDLE_DAEMON_TOKEN=...
```

The Aamu server pulls an authoritative snapshot once a minute by default
(`AAMU_SLIDES_RECONCILE_INTERVAL_MS`) and Strut persists webhook deliveries in
its local SQL outbox. `SLIDES_INTERNAL_URL` can point Aamu directly at the
Slides container; otherwise Aamu uses `SLIDES_PUBLIC_URL`.

For local MinIO, the existing `MINIO_ROOT_USER` and
`MINIO_ROOT_PASSWORD` are sufficient. Aamu's development compose creates
`${S3_BUCKET_SLIDES:-aamu-slides-dev}` idempotently. Slides uses path-style S3
requests and serves private objects through its authenticated upload route.

The standalone compose joins Aamu's default development network
`docker-dev_aamu-net`; override `AAMU_DOCKER_NETWORK` for another environment.
It exposes Slides at host port `3010` and Rindle WebSocket at `7601` by
default. Aamu's development nginx forwards `/slides/` and
`/slides/rindle` to these ports.

The current image deliberately uses Rindle 0.4's single local daemon and a
persistent SQLite volume. A future r0.7 migration only needs to replace the
`slides-rindle` service and `RINDLE_DAEMON_*` wiring; the Aamu auth, tenant
scope, routes, S3 storage, and `slides_decks` bridge do not depend on that
topology.
