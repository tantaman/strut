import bcrypt from "bcrypt";
import sqlite3 from "better-sqlite3";
import { uuidStrToBytes } from "@vlcn.io/client-server-common";
import { logger } from "@vlcn.io/server-core";

const saltRounds = 8;
const loginService = {
  async login(db: ReturnType<typeof sqlite3>, email: string, pass: string) {
    const row = db
      .prepare(`SELECT passhash, dbuuid FROM accounts WHERE email = ?;`)
      .get(email);
    if (row == null) {
      return null;
    }

    const match = await bcrypt.compare(pass, row.passhash);
    if (!match) {
      return null;
    }

    return new Uint8Array(row.dbuuid);
  },

  async register(db: ReturnType<typeof sqlite3>, email: string, pass: string) {
    const dbuuid = uuidStrToBytes(crypto.randomUUID());
    const hash = await bcrypt.hash(pass, saltRounds);
    try {
      db.prepare(
        `INSERT INTO accounts (email, passhash, dbuuid) VALUES (?, ?, ?);`
      ).run(email, hash, dbuuid);
    } catch (e: any) {
      logger.error(e.message, {
        event: "register.write",
      });
      return null;
    }

    return dbuuid;
  },
};

export default loginService;
