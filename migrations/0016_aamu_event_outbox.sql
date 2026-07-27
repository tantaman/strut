-- 0016_aamu_event_outbox
-- Durable delivery queue for Aamu deck mirror events. Rows are removed only after
-- Aamu accepts the event; failed deliveries remain available for bounded retries.

CREATE TABLE IF NOT EXISTS aamu_event_outbox (
  id              TEXT NOT NULL,
  body            TEXT NOT NULL,
  created_at      REAL NOT NULL,
  attempts        INTEGER NOT NULL DEFAULT 0,
  next_attempt_at REAL NOT NULL,
  last_error      TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS aamu_event_outbox_due
  ON aamu_event_outbox (next_attempt_at, created_at, id);
