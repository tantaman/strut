/**
 * - Support account creation
 * - Support login. Login returns your db uuid.
 */
import express from "express";
import sqlite3 from "better-sqlite3";
import formidableMiddleware from "express-formidable";
import * as http from "http";
import { nanoid } from "nanoid";
import { Connection, logger, contextStore } from "@vlcn.io/server-core";
import { WebSocketServer, WebSocket } from "ws";
import WebSocketWrapper from "./WebSocketWrapper.js";
import { IncomingMessage } from "node:http";
import loginService from "./loginService.js";

const config = {
  dbDir: "/var/lib/litefs/udbs",
  schemaDir: "./schemas",
  maxOutstandingAcks: 10,
};

const arg = process.argv[2];
let db: ReturnType<typeof sqlite3>;
if (arg && arg == "local") {
  db = sqlite3("./dev.db");
} else {
  db = sqlite3("/var/lib/litefs/accounts.db");
}

db.exec(
  "CREATE TABLE IF NOT EXISTS accounts (email text primary key, passhash text, dbuuid blob) STRICT;"
);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("./public"));
app.use(express.json());
app.use(formidableMiddleware());

app.post("/login", (req, res) => {
  const fields = validateLoginFields(req.fields);
  if (fields == null) {
    logger.error("bad email of password", {
      event: "login",
    });
    res.status(400).send("bad email or password");
    return;
  }

  const dbuuid = loginService.login(db, fields.email, fields.pass);
  if (dbuuid == null) {
    logger.error("bad email of password", {
      event: "login",
    });
    res.status(400).send("bad email or password");
    return;
  }

  res.status(200).send({
    dbuuid,
  });
});

app.post("/register", async (req, res) => {
  const fields = validateLoginFields(req.fields);
  if (fields == null) {
    logger.error("bad email of password", {
      event: "register",
    });
    res.status(400).send("bad email or password");
    return;
  }

  const dbuuid = await loginService.register(db, fields.email, fields.pass);
  res.status(200).send({
    dbuuid,
  });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws: WebSocket, request) => {
  logger.info("info", `established ws connection`, {
    event: "main.establish",
    req: contextStore.get().reqId,
  });

  new Connection(config, new WebSocketWrapper(ws));
});

function authenticate(req: IncomingMessage, cb: (err: any) => void) {
  // This function is not defined on purpose. Implement it with your own logic.
  cb(null);
}

server.on("upgrade", (request, socket, head) => {
  contextStore.run(
    {
      reqId: nanoid(),
    },
    () => {
      logger.info("upgrading to ws connection", {
        event: "main.upgrade",
        req: contextStore.get().reqId,
      });
      authenticate(request, (err) => {
        if (err) {
          logger.error("failed to authenticate", {
            event: "auth",
            req: contextStore.get().reqId,
          });
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          socket.destroy();
          return;
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      });
    }
  );
});

server.listen(port, () => logger.log("info", `listening on port ${port}!`));

function validateLoginFields(fields: Express.Request["fields"]): {
  email: string;
  pass: string;
} | null {
  const email = fields?.email;
  const pass = fields?.pass;

  if (!email || !pass) {
    return null;
  }

  if (typeof email !== "string" || typeof pass !== "string") {
    return null;
  }

  if (email.length > 500 || pass.length > 500) {
    return null;
  }

  return {
    email,
    pass,
  };
}
