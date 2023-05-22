import dbFactory, { DBID } from "./DBFactory";
import { CtxAsync } from "@vlcn.io/react";

export default function useDB(dbid: DBID): CtxAsync {
  return dbFactory.getHook(dbid)!()!;
}
