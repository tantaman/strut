import { Disposer } from "@strut/events/Observable";

export default function bindDetectSwipe(
  el: HTMLElement,
  listener: (delta: number) => void,
  direction: "x" | "y"
): Disposer {
  let startPosition = 0;
  let delta = 0;

  const singleTouch = function (fn, preventDefault) {
    return function (e) {
      if (preventDefault) {
        e.preventDefault();
      }
      e.touches.length === 1 &&
        fn(direction === "x" ? e.touches[0].pageX : e.touches[0].pageY);
    };
  };

  const touchstart = singleTouch(function (position) {
    startPosition = position;
    delta = 0;
  }, false);

  const touchmove = singleTouch(function (position) {
    delta = position - startPosition;
  }, true);

  const touchend = function () {
    if (Math.abs(delta) < 50) {
      return;
    }

    listener(delta);
  };

  el.addEventListener("touchstart", touchstart);
  el.addEventListener("touchmove", touchmove);
  el.addEventListener("touchend", touchend);

  return () => {
    el.removeEventListener("touchstart", touchstart);
    el.removeEventListener("touchmove", touchmove);
    el.removeEventListener("touchend", touchend);
  };
}
