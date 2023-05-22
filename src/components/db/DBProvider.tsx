/**
 * Constructs the MetaDB and provides it to children.
 *
 * Suspensy?
 */
import react, { useEffect, useRef, useState } from "react";
import { createContext } from "./DBContext.js";
import dbFactory, { Schema, DBID } from "./DBFactory.js";
import { CtxAsync } from "@vlcn.io/react";

export default function DBProvider({
  dbid,
  children,
  schema,
}: {
  dbid: DBID;
  schema: Schema;
  children: react.ReactNode;
}) {
  const contextRef = useRef(createContext());
  const [dbRef, setDbRef] = useState<CtxAsync | null>(null);
  useEffect(() => {
    dbFactory.get(dbid, schema, contextRef.current.useDb).then((db) => {
      setDbRef(db);
    });
    return () => {
      dbFactory.closeAndRemove(dbid);
    };
  }, [dbid, schema, contextRef.current.useDb]);
  if (dbRef === null) {
    return <div>Creating DB {dbid}</div>;
  }
  return (
    <DbAvailable ctx={dbRef} DBContext={contextRef.current.DBContext}>
      {children}
    </DbAvailable>
  );
}

function DbAvailable({
  children,
  ctx,
  DBContext,
}: {
  children: react.ReactNode;
  ctx: CtxAsync;
  DBContext: React.Context<CtxAsync | null>;
}) {
  return <DBContext.Provider value={ctx}>{children}</DBContext.Provider>;
}
