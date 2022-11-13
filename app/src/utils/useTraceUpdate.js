import { useEffect, useRef } from "react";

// TODO: macro to disable this for prod builds
export default function useTraceUpdate(comp, props) {
  const prev = useRef(props);
  useEffect(() => {
    const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
      if (prev.current[k] !== v) {
        ps[k] = [prev.current[k], v];
      }
      return ps;
    }, {});
    if (Object.keys(changedProps).length > 0) {
      console.log(comp + " changed props:", changedProps);
    }
    prev.current = props;
  });
}
