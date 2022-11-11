import React, { useCallback } from "react";
import * as styles from "./FontColorButton.module.css";
import ColorPickerButton2 from "~src/scripts/widgets/color/ColorPickerButton2";
import { AppState, Theme } from "../../../../domain/schema";
import mutations from "../../../../domain/mutations";
import "@tiptap/extension-color";

type Props = {
  appState: AppState;
  theme: Theme;
};

export default function FontColorButton({ appState, theme }: Props) {
  const state = appState.authoringState;
  // useBind(["transaction"], state);
  // useQuery(["recentColors"], theme);
  const onColorChange = useCallback(
    (color: string) => {
      if (color === "default") {
        state.editor?.chain().focus().unsetColor().run();
      } else {
        state.editor?.chain().focus().setColor(color).run();
        mutations.addRecentColor(appState.ctx, color, theme.id);
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
