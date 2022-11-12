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

// TODO: `useQuery` should prepare a statement
function useQueryImpl<T>(
  ctx: Ctx,
  tables: readonly string[],
  query: string,
  mode: "o" | "a",
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

      (mode === "o" ? ctx.db.execO : ctx.db.execA)(query).then((data) => {
        if (!isMounted) {
          return;
        }
        setState({
          data: data as T[],
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

export function useQuery<T extends {}>(
  ctx: Ctx,
  tables: readonly string[],
  query: string,
  bindings?: readonly any[]
): QueryData<T> {
  return useQueryImpl(ctx, tables, query, "o", bindings);
}

export function useQueryA<T extends any[]>(
  ctx: Ctx,
  tables: readonly string[],
  query: string,
  bindings?: readonly any[]
): QueryData<T> {
  return useQueryImpl(ctx, tables, query, "a", bindings);
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

// TODO -- roll these into `useQuery` so we don't have to
// re-run them...
export function pick0<T extends any[]>(data: T[]): T[0][] {
  return data.map((d) => d[0]);
}

export function useBind<T extends keyof D, D>(keys: T[], d: D) {}
