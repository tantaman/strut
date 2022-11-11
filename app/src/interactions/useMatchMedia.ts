import { useEffect, useState } from "react";

import counter from "@strut/counter";

const count = counter("useMatchMedia");
export default function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    count.bump("computeState");
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    count.bump("installListener");
    const mediaQuery = window.matchMedia(query);
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };
    mediaQuery.addEventListener("change", listener);

    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, [query]);

  return matches;
}
