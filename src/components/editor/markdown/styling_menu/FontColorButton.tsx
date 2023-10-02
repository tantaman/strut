import { useCallback } from "react";
import * as styles from "./FontColorButton.module.css";
import ColorPickerButton2 from "../../../../widgets/color/ColorPickerButton2";
import { Theme } from "../../../../domain/schema";
import mutations from "../../../../domain/mutations";
import "@tiptap/extension-color";
import { queries } from "../../../../domain/queries2";
import { CtxAsync as Ctx, pick, useQuery2 } from "@vlcn.io/react";
import config from "../../../../config";
import AuthoringState from "../../../../domain/ephemeral/AuthoringState";

type Props = {
  ctx: Ctx;
  state: AuthoringState;
  theme?: Theme;
};

export default function FontColorButton({ ctx, state, theme }: Props) {
  const recentColors = useQuery2(
    ctx,
    queries.recentColors,
    [theme?.id ?? config.defaultThemeId],
    pick<any, string>
  ).data;
  // useBind(["transaction"], state);
  // useQuery(["recentColors"], theme);
  const onColorChange = useCallback(
    (color: string | undefined) => {
      if (color == null) {
        return false;
      }
      if (color === "default") {
        // state.editor?.chain().focus().unsetColor().run();
      } else {
        // state.editor?.chain().focus().setColor(color).run();
        mutations.addRecentColor(
          ctx.db,
          color,
          theme?.id || config.defaultThemeId
        );
      }

      return false;
    },
    [state]
  );
  // const color = state.editor?.getAttributes("textStyle").color;
  const color = null;
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
      recents={recentColors}
    >
      <strong>A</strong>
      <div className={styles.fontColor} style={style}></div>
    </ColorPickerButton2>
  );
}
