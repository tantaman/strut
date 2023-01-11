#!/usr/bin/env node
/**
 * - Support account creation
 * - Support login. Login returns your db uuid.
 */
import express from "express";
import sqlite3 from "better-sqlite3";
import formidableMiddleware from "express-formidable";
import * as http from "http";
import { Connection, logger, contextStore } from "@vlcn.io/server-core";
import { WebSocketServer, WebSocket } from "ws";
import WebSocketWrapper from "./WebSocketWrapper.js";
import { IncomingMessage } from "node:http";
import { apply as applySchema } from "./schema.js";
import dotenv from "dotenv";
import { jwtVerifier } from "access-token-jwt";
// @ts-ignore
import cors from "cors";
import { randomUuidBytes } from "@vlcn.io/client-server-common";

const dotenvResult = dotenv.config({ path: "./.env" });
const env = dotenvResult.parsed!;

const verifyJwt = jwtVerifier({
  audience: env.AUTH0_AUDIENCE,
  issuerBaseURL: `https:/${env.AUTH0_DOMAIN}/`,
});

const config = {
  dbDir: "/litefs",
  schemaDir: "../app-server-shared/src/schemas",
  maxOutstandingAcks: 10,
};

const arg = process.argv[2];
let db: ReturnType<typeof sqlite3>;
if (arg && arg == "local") {
  db = sqlite3("./accounts-dev.db");
  config.dbDir = "./udbs";
} else {
  db = sqlite3("/litefs/accounts.db");
}

applySchema(db);

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static("./public"));
app.use(express.json());
app.use(formidableMiddleware());
app.use(cors());

app.get("/app/dbid", async (req, res) => {
  const token = (req.headers.authorization || "").split(" ")[1];
  if (!token) {
    res.status(401).send("Unauthorized");
    return;
  }

  const verification = await verifyJwt(token);
  const sub = verification.payload.sub;
  db.prepare("insert or ignore into accounts (sub, dbuuid) values (?, ?)").run(
    sub,
    randomUuidBytes()
  );
  const row = db.prepare("select dbuuid from accounts where sub = ?").get(sub);
  res.send({ uuid: row.dbuuid });
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
  const token = req.headers["sec-websocket-protocol"];
  console.log("Auth token: " + token);
  // add header to response: Sec-WebSocket-Protocol=access_token ?
  cb(null);
}

server.on("upgrade", (request, socket, head) => {
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
});

server.listen(port, () => logger.log("info", `listening on port ${port}!`));
