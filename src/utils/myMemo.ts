import shallowEqual from "./shallowEqual";

export default function reactMemo<T extends Object>(
  fn: (x: T) => JSX.Element
): (x: T) => JSX.Element {
  let x: JSX.Element;
  let lastProps: T;
  return (props: T) => {
    if (lastProps && shallowEqual(lastProps, props) && x !== undefined) {
      return x;
    }
    lastProps = props;
    x = fn(props);
    return x;
  };
}
