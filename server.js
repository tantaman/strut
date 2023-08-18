import express from "express";
import ViteExpress from "vite-express";
import { attachWebsocketServer } from "@vlcn.io/ws-server";

const PORT = parseInt(process.env.PORT || "8080");

const app = express();
app.use(express.json());

// attachWebsocketServer(server, {
//   dbFolder: "./dbs",
//   schemaFolder: "./src/schemas",
//   pathPattern: /\/sync/,
// });

ViteExpress.listen(app, PORT, () =>
  console.log(`Listening at http://localhost:${PORT}`)
);

/**
 *
 * @param {import("express").RequestHandler} handler
 * @returns {import("express").RequestHandler}
 */
function makeSafe(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  };
}
