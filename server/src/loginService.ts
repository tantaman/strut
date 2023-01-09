import bcrypt from "bcrypt";
import sqlite3 from "better-sqlite3";
import { uuidStrToBytes } from "@vlcn.io/client-server-common";

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

    return row.dbuuid;
  },

  async register(db: ReturnType<typeof sqlite3>, email: string, pass: string) {
    const dbuuid = crypto.randomUUID();
    const dbuuidBytes = uuidStrToBytes(dbuuid);
    const hash = await bcrypt.hash(pass, saltRounds);
    db.prepare(
      `INSERT INTO accounts (email, passhash, dbuuid) VALUES (?, ?, ?);`
    ).run(email, hash, dbuuid);

    return dbuuid;
  },
};

async function isValidPassword(pass: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pass, hash);
}

export default loginService;
