import { IModel } from "@vlcn.io/model";
import { useEffect, useReducer, useRef, useState } from "react";

export function useBind<M extends IModel<D>, D extends {}>(
  m: M,
  keys?: (keyof D)[]
): void {
  const [tick, forceUpdate] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    if (keys != null) {
      // subscribe returns a function which will dispose of the subscription
      return m.subscribeTo(keys, () => forceUpdate());
    } else {
      // subscribe returns a function which will dispose of the subscription
      return m.subscribe(() => forceUpdate());
    }
  }, [m]);
}
