import { useEffect } from "react";

export default function useOnDocClick(cb: (e: any) => void, deps: any[]) {
  useEffect(() => {
    const listener = (e: any) => cb(e);
    window.document.addEventListener("click", listener);
    return () => {
      window.document.removeEventListener("click", listener);
    };
  }, deps);
}
