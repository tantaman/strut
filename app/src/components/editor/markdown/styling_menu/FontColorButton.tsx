import React, { useCallback } from "react";
import AuthoringState from "../../../app_state/AuthoringState";
import * as styles from "./FontColorButton.module.css";
import { useQuery } from "@strut/model/Hooks";
import ColorPickerButton2 from "~src/scripts/widgets/color/ColorPickerButton2";
import Theme from "~src/scripts/components/deck/Theme";
import { commit } from "@strut/model/Changeset";

type Props = {
  state: AuthoringState;
  theme: Theme;
};

export default function FontColorButton({ state, theme }: Props) {
  useQuery(["transaction"], state);
  useQuery(["recentColors"], theme);
  const onColorChange = useCallback(
    (color) => {
      if (color === "default") {
        state.editor?.chain().focus().unsetColor().run();
      } else {
        state.editor?.chain().focus().setColor(color).run();
        commit(theme.addRecentColor(color), []);
      }

      return false;
    },
    [state]
  );
  const color = state.editor?.getAttributes("textStyle").color;
  let style;
  if (color) {
    style = {
      background: color,
    };
  }
  return (
    <ColorPickerButton2
      onChange={onColorChange}
      color={color || "default"}
      recents={theme.recentColors}
    >
      <strong>A</strong>
      <div className={styles.fontColor} style={style}></div>
    </ColorPickerButton2>
  );
}
