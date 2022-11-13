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

type QueryData<M> = {
  loading: boolean;
  error?: Error;
  data: M;
};

type SQL<R> = string;
export type Query<R, T extends string, M = R[]> =
  | [Ctx, T[], SQL<R>, any[]]
  | [Ctx, T[], SQL<R>, any[], (x: R[]) => M];

// TODO: `useQuery` should prepare a statement
function useQueryImpl<R, T extends string, M = R>(
  [ctx, tables, query, bindings, postProcess]: Query<R, T, M>,
  mode: "o" | "a"
): QueryData<M> {
  const [state, setState] = useState<QueryData<M>>({
    data: [] as any,
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
          data:
            postProcess != null
              ? // TODO: postProcess should work on full dataset for more flexibility
                postProcess(data as R[])
              : (data as M),
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

export function useQuery<R, T extends string, M = R>(
  q: Query<R, T, M>
): QueryData<M> {
  return useQueryImpl(q, "o");
}

export function useQueryA<R, T extends string, M = R>(
  q: Query<R, T, M>
): QueryData<M> {
  return useQueryImpl(q, "a");
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

export function useBind<T extends keyof D, D>(keys: T[], d?: D) {}
