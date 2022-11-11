import counter from "@strut/counter";
import { useEffect, useRef, useState } from "react";


const count = counter("WellSlideDrawingPreview");
function wrapPromise<T>(promise: Promise<T>): () => T {
  count.bump("wrapPromise");
  let status = "pending";
  let result;
  let suspender = promise.then(
    (r) => {
      status = "success";
      result = r;
    },
    (e) => {
      status = "error";
      result = e;
    }
  );
  return () => {
    if (status === "pending") {
      throw suspender;
    } else if (status === "error") {
      throw result;
    } else if (status === "success") {
      return result;
    }
  };
}

export default function useSyncify<T>(fn: () => Promise<T>): T | undefined {
  count.bump("useSyncify");
  const [result, setResult] = useState<T>();
  useEffect(
    () => 
      setResult(wrapPromise(fn())),
    [fn]
  );

  return result;
}