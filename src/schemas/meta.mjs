export default {
  namespace: "default",
  name: "meta",
  active: true,
  content: /*sql*/ `
CREATE TABLE IF NOT EXISTS "deck_map" (
  "title" TEXT,
  "dbid" BLOB PRIMARY KEY,
  "deck_id" INTEGER,
  "last_modified" INTEGER,
  "is_dirty" INTEGER
) STRICT;

CREATE INDEX IF NOT EXISTS "deck_map_touched" ON "deck_map" ("last_modified");

SELECT crsql_as_crr('deck_map');
`,
};
