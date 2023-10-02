import { memo, useState } from "react";
import AppState from "../../domain/ephemeral/AppState";
import { Theme } from "../../domain/schema";
import EphemeralTheme from "../../domain/ephemeral/EphemeralTheme";
import * as styles from "./HeaderButton.module.css";
import {
  CtxAsync as Ctx,
  first,
  pick,
  useQuery2,
  usePointQuery2,
} from "@vlcn.io/react";
import ColorPickerButton2 from "../../widgets/color/ColorPickerButton2";
import FontSelector from "../../widgets/font-selector/FontSelector";
import textColorStyles from "../editor/markdown/styling_menu/FontColorButton.module.css";
import mutations from "../../domain/mutations";
import { queries } from "../../domain/queries2";
import { IID_of } from "../../id";

function Slideout({
  ctx,
  onCollapse,
  defaultLabel,
  theme,
  previewTheme,
}: {
  ctx: Ctx;
  onCollapse: () => void;
  defaultLabel: string;
  theme?: Theme;
  previewTheme: EphemeralTheme;
}) {
  let textStyle;
  if (theme?.fg_colorset) {
    textStyle = {
      background: theme.fg_colorset,
    };
  }

  const recentColors = useQuery2(
    ctx,
    queries.recentColors,
    [theme?.id],
    pick<any, string>
  ).data;
  return (
    <>
      <ColorPickerButton2
        onChange={(c) => mutations.setAllSlideColor(ctx.db, theme?.id, c)}
        onPreview={(c) => previewTheme.set("slide_color", c ?? null)}
        color={theme?.slide_color || "default"}
        recents={recentColors}
      >
        <i className={"bi bi-square-fill " + styles.icon}></i>
        <label>Slide</label>
      </ColorPickerButton2>
      <ColorPickerButton2
        onPreview={(c) => previewTheme.set("surface_color", c ?? null)}
        onChange={(c) => mutations.setAllSurfaceColor(ctx.db, theme?.id, c)}
        color={theme?.surface_color || "default"}
        recents={recentColors}
      >
        <i className={"bi bi-square-half " + styles.icon}></i>
        <label>Surface</label>
      </ColorPickerButton2>
      <ColorPickerButton2
        onPreview={(c) => previewTheme.set("font_color", c ?? null)}
        onChange={(c) => mutations.setAllTextColor(ctx.db, theme?.id, c)}
        color={theme?.font_color || "default"}
        recents={recentColors}
      >
        <strong>A</strong>
        <div className={textColorStyles.fontColor} style={textStyle}></div>
        <div>Text</div>
      </ColorPickerButton2>
      <FontSelector
        ctx={ctx}
        theme={theme}
        previewTheme={previewTheme}
        defaultLabel={defaultLabel}
      />
      <div className="btn-group dropstart" role="group">
        <button
          onClick={onCollapse}
          type="button"
          className="btn btn-outline-warning dropdown-toggle dropdown-toggle-split"
          aria-expanded="false"
        >
          <span className="visually-hidden">Toggle Dropright</span>
        </button>
      </div>
    </>
  );
}

const Section = memo(function s({
  appState,
  label,
  icon,
  defaultLabel,
  themeId,
  previewTheme,
}: {
  appState: AppState;
  label: string;
  icon: string;
  defaultLabel: string;
  themeId: IID_of<Theme>;
  previewTheme: EphemeralTheme;
}) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const expand = () => setExpanded(!expanded);
  const theme = usePointQuery2(appState.ctx, themeId as any, queries.theme, [
    themeId,
  ]).data;
  return (
    <div
      className={"btn-group " + styles.root}
      role="group"
      aria-label="Choose deck style characteristics"
    >
      <button
        type="button"
        className="btn btn-outline-warning"
        onClick={expand}
      >
        <i className={"bi " + icon + " " + styles.icon}></i>
        {label}
      </button>
      {expanded ? (
        <Slideout
          ctx={appState.ctx}
          onCollapse={expand}
          defaultLabel={defaultLabel}
          theme={theme}
          previewTheme={previewTheme}
        />
      ) : (
        <div className="btn-group dropend" role="group">
          <button
            onClick={expand}
            type="button"
            className="btn btn-outline-warning dropdown-toggle dropdown-toggle-split"
            aria-expanded="false"
          ></button>
        </div>
      )}
    </div>
  );
});

export default function StructureStyleButtons({
  appState,
  className,
}: {
  appState: AppState;
  className?: string;
}) {
  const themeId = first(
    useQuery2(appState.ctx, queries.themeIdFromDeck, [appState.current_deck_id])
      .data
  )?.theme_id;
  return (
    <div className={className}>
      {themeId != null ? (
        <Section
          appState={appState}
          label="Theme"
          icon="bi-palette-fill"
          defaultLabel="Default"
          themeId={themeId}
          previewTheme={appState.previewTheme}
        />
      ) : null}
    </div>
  );
}
