import { IModel } from "@vlcn.io/model";
import { useEffect, useSyncExternalStore, useRef } from "react";

export function useBind<M extends IModel<D>, D extends {}>(m: M): void;
export function useBind<M extends IModel<D>, D extends {}>(
  m: M,
  keys: (keyof D)[]
): void;

export function useBind<M extends IModel<D>, D extends {}>(
  m: M,
  keys?: (keyof D)[]
): D {
  // count.bump("useBind." + m.constructor.name);
  const bridge = useRef<ReactBridge<M, D> | null>(null);

  if (bridge.current == null) {
    bridge.current = new ReactBridge(m, keys);
  }

  useEffect(() => {
    if (bridge.current?.model != m) {
      bridge.current = new ReactBridge(m, keys);
    }
  }, [m]);

  return useSyncExternalStore<D>(
    bridge.current.subscribeReactInternals,
    bridge.current.getSnapshot
  );
}

class ReactBridge<M extends IModel<D>, D extends {}> {
  constructor(public readonly model: M, private keys?: (keyof D)[]) {}

  subscribeReactInternals = (internals: () => void) => {
    if (this.keys != null) {
      // count.bump('keyed.subscription.' + m.constructor.name);
      // subscribe returns a function which will dispose of the subscription
      return this.model.subscribeTo(this.keys, () => internals());
    } else {
      // subscribe returns a function which will dispose of the subscription
      return this.model.subscribe(() => internals());
    }
  };

  getSnapshot = () => {
    return this.model.data;
  };
}
