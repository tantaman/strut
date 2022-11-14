import React, { MouseEvent, useState } from "react";

import * as styles from "./HueSlider.module.css";

const width = 164;
export default function HueSlider({
  onChange,
  hue,
}: {
  onChange: (hue: number) => void;
  hue: number;
}) {
  const [mouseDown, setMouseDown] = useState(false);
  const updateHueFromMouseEvent = (e: MouseEvent) => {
    onChange((((e.nativeEvent as TODO).layerX || 0) / width) * 360);
  };
  const onMouseDown = (e: MouseEvent) => {
    setMouseDown(true);
    updateHueFromMouseEvent(e);
  };
  const onMouseUp = (e: MouseEvent) => {
    setMouseDown(false);
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!mouseDown) {
      return;
    }
    updateHueFromMouseEvent(e);
  };
  return (
    <div
      className={styles.root}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
    >
      <div
        className={styles.control}
        style={{ left: (hue / 360) * width }}
      ></div>
    </div>
  );
}
