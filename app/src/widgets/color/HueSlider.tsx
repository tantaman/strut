import React, { useState } from "react";

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
  const updateHueFromMouseEvent = (e) => {
    onChange(((e.nativeEvent.layerX || 0) / width) * 360);
  };
  const onMouseDown = (e) => {
    setMouseDown(true);
    updateHueFromMouseEvent(e);
  };
  const onMouseUp = (e) => {
    setMouseDown(false);
  };
  const onMouseMove = (e) => {
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
