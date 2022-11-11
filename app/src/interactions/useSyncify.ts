import { useEffect, useState } from "react";

type Resolution<T> = {
  type: 'SUCCESS'
  resolution: T,
} | { type: 'EXCEPTION', resolution: Error };

export default function useSyncify<T>(promise: Promise<T>): Resolution<T> | undefined {
  const [resolution, setResolution] = useState<Resolution<T> | undefined>();
  useEffect(
    () => {
      promise
        .then((r) => {
          setResolution({
            type: 'SUCCESS',
            resolution: r,
          });
        })
        .catch((e) => {
          setResolution({
            type: 'EXCEPTION',
            resolution: e,
          });
        });
    },
    [promise],
  );
  return resolution;
}
