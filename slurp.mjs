/**
 * During the build step, this script will slurp all the schemas in the
 * schemas directory and insert them into the service database.
 *
 * This allows the service to dnymically load schemas and apply schemas
 * as new databases need to be created.
 */

import fs from "fs";
import {
  DefaultConfig,
  ServiceDB,
  cryb64,
} from "@vlcn.io/direct-connect-nodejs";
import path from "path";

const dir = "./src/schemas";

async function slurp() {
  const schemas = await Promise.all(
    fs.readdirSync(dir).map((file) => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile) {
        return import("./" + filePath);
      }
      return null;
    })
  );

  // INSERT OR IGNORE each schema
  const svcDb = new ServiceDB(DefaultConfig, true);
  const db = svcDb.__internal_getDb();
  db.transaction(() => {
    for (const mod of schemas) {
      if (mod == null) continue;
      const s = mod.default;
      if (s.active) {
        db.prepare(`
          UPDATE schema SET active = 0 WHERE namespace = ? AND name = ?;
        `);
      }

      db.prepare(
        `INSERT OR REPLACE INTO schema (namespace, name, version, content, active) VALUES (?, ?, ?, ?, ?);`
      ).run(
        s.namespace,
        s.name,
        cryb64(s.content),
        s.content,
        s.active ? 1 : 0
      );
    }
  })();
}

slurp();
