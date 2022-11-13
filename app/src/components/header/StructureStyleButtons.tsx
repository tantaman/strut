import React, { useState } from "react";
import AppState from "../../domain/ephemeral/AppState";
import { Theme } from "../../domain/schema";
import EphemeralTheme from "../../domain/ephemeral/EphemeralTheme";
import * as styles from "./HeaderButton.module.css";
import { Ctx, useQuery } from "../../hooks";
import ColorPickerButton2 from "../../widgets/color/ColorPickerButton2";
import FontSelector from "../../widgets/font-selector/FontSelector";
import textColorStyles from "../editor/markdown/styling_menu/FontColorButton.module.css";
import mutations from "../../domain/mutations";
import queries from "../../domain/queries";

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

  const recentColors = useQuery(queries.recentColors(ctx, theme?.id)).data;
  return (
    <>
      <ColorPickerButton2
        onChange={(c) => mutations.setAllSlideColor(ctx, theme?.id, c)}
        onPreview={(c) => previewTheme.set("slide_color", c)}
        color={theme?.slide_color || "default"}
        recents={recentColors}
      >
        <i className={"bi bi-square-fill " + styles.icon}></i>
        <label>Slide</label>
      </ColorPickerButton2>
      <ColorPickerButton2
        onPreview={(c) => previewTheme.set("surface_color", c)}
        onChange={(c) => mutations.setAllSurfaceColor(ctx, theme?.id, c)}
        color={theme?.surface_color || "default"}
        recents={recentColors}
      >
        <i className={"bi bi-square-half " + styles.icon}></i>
        <label>Surface</label>
      </ColorPickerButton2>
      <ColorPickerButton2
        onPreview={(c) => previewTheme.set("font_color", c)}
        onChange={(c) => mutations.setAllTextColor(ctx, theme?.id, c)}
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

function Section({
  appState,
  label,
  icon,
  defaultLabel,
  theme,
  previewTheme,
}: {
  appState: AppState;
  label: string;
  icon: string;
  defaultLabel: string;
  theme?: Theme;
  previewTheme: EphemeralTheme;
}) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const expand = () => setExpanded(!expanded);
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
}

export default function StructureStyleButtons({
  appState,
  className,
}: {
  appState: AppState;
  className?: string;
}) {
  const theme = useQuery(
    queries.themeFromDeck(appState.ctx, appState.current_deck_id)
  ).data;
  return (
    <div className={className}>
      <Section
        appState={appState}
        label="Theme"
        icon="bi-palette-fill"
        defaultLabel="Default"
        theme={theme}
        previewTheme={appState.previewTheme}
      />
    </div>
  );
}
