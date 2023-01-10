import { Express } from "express";
import { validateLoginFields } from "./inputValidation.js";
import loginService from "./loginService.js";
import { logger } from "@vlcn.io/server-core";
import sqlite3 from "better-sqlite3";

export function install(db: ReturnType<typeof sqlite3>, app: Express) {
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
}
