import { useCallback, useRef, useState } from "react";

export function useDebounce<T>(cb: (p?: T) => void, time): (p?: T) => void {
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (p?: T) => {
    if (pending.current != null) {
      clearTimeout(pending.current);
      pending.current = null;
    }

    pending.current = setTimeout(() => {
      pending.current = null;
      cb(p);
    }, time);
  };
}

export function useBool(v: boolean): [boolean, () => void] {
  const [bool, setBool] = useState(v);
  return [bool, () => setBool(!bool)];
}

export function useAliasedBool(
  v: boolean,
  on: string,
  off: string
): [string, () => void] {
  const [bool, toggle] = useBool(v);
  return [bool === true ? on : off, toggle];
}

export function useExclusiveBools<T extends { [key: string]: boolean }>(
  v: T
): [T, (x: keyof T) => void, () => void] {
  const [state, setState] = useState(v);

  const toggle = (toToggle) => {
    const currentVal = state[toToggle];
    if (currentVal) {
      setState({
        ...state,
        [toToggle]: false,
      });
      return;
    }

    const newState = {};
    Object.keys(state).forEach((k) => (newState[k] = false));
    newState[toToggle] = true;
    // TODO: figure this out.
    // @ts-ignore
    setState(newState);
  };

  const allOff = () => {
    const newState = {};
    Object.keys(state).forEach((k) => (newState[k] = false));
    // TODO: figure this out.
    // @ts-ignore
    setState(newState);
  };

  return [state, toggle, allOff];
}
