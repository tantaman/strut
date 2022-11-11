import { useEffect, useState } from "react";
import wdbRtc from "@vlcn.io/network-webrtc";
import { DB } from "@vlcn.io/wa-crsqlite";
import tblrx from "@vlcn.io/rx-tbl";

export type Ctx = {
  db: DB;
  siteid: string;
  rtc: Awaited<ReturnType<typeof wdbRtc>>;
  rx: Awaited<ReturnType<typeof tblrx>>;
};

type QueryData<T> = {
  loading: boolean;
  error?: Error;
  data: T[];
};

export function useQuery<T extends {}>(
  ctx: Ctx,
  tables: readonly string[],
  query: string,
  bindings?: readonly any[]
): QueryData<T> {
  const [state, setState] = useState<QueryData<T>>({
    data: [],
    loading: true,
  });
  useEffect(() => {
    let isMounted = true;
    const runQuery = (changedTbls: Set<string> | null) => {
      if (!isMounted) {
        return;
      }

      if (changedTbls != null) {
        if (!tables.some((t) => changedTbls.has(t))) {
          return;
        }
      }

      ctx.db.execO<T>(query).then((data) => {
        if (!isMounted) {
          return;
        }
        setState({
          data,
          loading: false,
        });
      });
    };

    const disposer = ctx.rx.on(runQuery);

    // initial kickoff to get initial data.
    runQuery(null);

    return () => {
      isMounted = false;
      disposer();
    };
  }, [query, ...(bindings || [])]);

  return state;
}

export function first<T>(data: T[]): T | undefined {
  return data[0];
}

export function firstPick<T>(data: any[]): T | undefined {
  const d = data[0];
  if (d == null) {
    return undefined;
  }

  return d[Object.keys(d)[0]];
}