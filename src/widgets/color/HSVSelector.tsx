import { MouseEvent, useState } from "react";
import * as styles from "./HSVSelector.module.css";
import chroma from "chroma-js";
import HueSlider from "./HueSlider";

const width = 164;
const height = 100;

const rootStyle = {
  width,
  height,
};
export default function SaturationValueField({
  color,
  onCommit,
  onPreview,
}: {
  color: string;
  onCommit: (c: string) => void;
  onPreview?: (c: string) => void;
}) {
  const [mouseDown, setMouseDown] = useState(false);
  const [state, setState] = useState<{ h: number; s: number; v: number }>(
    () => {
      const chromaColor = chroma(color);
      let [h, s, v] = chromaColor.hsv();
      if (isNaN(h)) {
        h = 0;
      }

      return {
        h,
        s,
        v,
      };
    }
  );
  const bottom = state.v * height - 6;
  const left = state.s * width - 6;
  const background = chroma.hsv(state.h, 1, 1).hex();

  const onMouseUp = (_e: MouseEvent) => {
    setMouseDown(false);
  };

  const updateStateFromFieldMouseEvent = (e: MouseEvent) => {
    const newState = {
      h: state.h,
      s: (e.nativeEvent as TODO).layerX / width,
      v: (height - (e.nativeEvent as TODO).layerY) / height,
    };
    setState(newState);
    onPreview &&
      onPreview(chroma.hsv(newState.h, newState.s, newState.v).hex());
  };

  const onMouseDown = (e: MouseEvent) => {
    setMouseDown(true);
    updateStateFromFieldMouseEvent(e);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!mouseDown) {
      return;
    }
    updateStateFromFieldMouseEvent(e);
  };

  const onHueChange = (h: number) => {
    const newState = {
      h,
      s: state.s,
      v: state.v,
    };
    setState(newState);
    onPreview &&
      onPreview(chroma.hsv(newState.h, newState.s, newState.v).hex());
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div
        className={styles.root}
        style={rootStyle}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseOut={onMouseUp}
        onMouseMove={onMouseMove}
      >
        <div className={styles.stretch} style={{ background }}>
          <div className={styles.saturation + " " + styles.stretch}>
            <div className={styles.value + " " + styles.stretch}></div>
          </div>
        </div>
        <div className={styles.selector} style={{ bottom, left }}></div>
      </div>
      <HueSlider onChange={onHueChange} hue={state.h} />
      <button
        className={"btn btn-outline-warning pull-right " + styles.done}
        type="button"
        aria-expanded="false"
        onClick={() => onCommit(chroma.hsv(state.h, state.s, state.v).hex())}
      >
        Done
      </button>
    </div>
  );
}
