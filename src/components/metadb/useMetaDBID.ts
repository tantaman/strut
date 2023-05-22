import { useUser } from "@clerk/clerk-react";
// @ts-ignore
import uuid62 from "uuid62";
import { DBID } from "../db/DBFactory";

export default function useMetaDBID(): DBID | null {
  const { user } = useUser();
  if (!user) return null;
  const dbid = uuid62.decode(user.id.substring(5)).replace(/-/g, "");
  return dbid;
}
