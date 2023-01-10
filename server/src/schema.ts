import sqlite3 from "better-sqlite3";

export function apply(db: ReturnType<typeof sqlite3>) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS accounts (email text primary key, passhash text not null, dbuuid blob not null) STRICT;"
  );
}
