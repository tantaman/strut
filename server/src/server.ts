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
import cookieParser from "cookie-parser";
import { apply as applySchema } from "./schema.js";
import { install as installRoutes } from "./routes.js";
import dotenv from "dotenv";

const dotenvResult = dotenv.config({ path: "./.env" });
const env = dotenvResult.parsed!;

const config = {
  dbDir: "/var/lib/litefs/udbs",
  schemaDir: "./schemas",
  maxOutstandingAcks: 10,
};

const arg = process.argv[2];
let db: ReturnType<typeof sqlite3>;
if (arg && arg == "local") {
  db = sqlite3("./accounts-dev.db");
} else {
  db = sqlite3("/var/lib/litefs/accounts.db");
}

applySchema(db);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("./public"));
app.use(express.json());
app.use(formidableMiddleware());
app.use(cookieParser());

installRoutes(db, app);

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws: WebSocket, request) => {
  logger.info("info", `established ws connection`, {
    event: "main.establish",
    req: contextStore.get().reqId,
  });

  new Connection(config, new WebSocketWrapper(ws));
});

// TODO: check origin heders and cookies
function authenticate(req: IncomingMessage, cb: (err: any) => void) {
  console.log(req.headers);
  // @ts-ignore
  console.log(req.cookies);
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
