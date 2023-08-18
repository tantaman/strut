import { StrutSchemaType } from "./StrutSchemaType.js";
import { schema } from "@vlcn.io/typed-sql";
import { IID_of } from "../id.js";

export const StrutSchema = schema<StrutSchemaType>/*sql*/ `
CREATE TABLE IF NOT EXISTS deck (
  id 'IID_of<StrutSchemaType["deck"]>' PRIMARY KEY NOT NULL,
  title TEXT DEFAULT 'Untitled',
  created INT,
  modified INT,
  theme_id 'IID_of<StrutSchemaType["theme"]>',
  chosen_presenter TEXT DEFAULT 'impress'
);

CREATE TABLE IF NOT EXISTS theme (
  id 'IID_of<StrutSchemaType["theme"]>' PRIMARY KEY NOT NULL,
  name TEXT,
  bg_colorset TEXT,
  fg_colorset TEXT,
  fontset TEXT,
  surface_color TEXT,
  font_color TEXT
);
`;

const q = StrutSchema.sql<unknown>``;
