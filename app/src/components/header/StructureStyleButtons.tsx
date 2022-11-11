import React, { useState } from "react";
import AppState from "../app_state/AppState";
import Theme, { EphemeralTheme } from "../deck/Theme";
import * as styles from "./HeaderButton.module.css";
import { useQuery } from "@strut/model/Hooks";
import ColorPickerButton2 from "~src/scripts/widgets/color/ColorPickerButton2";
import FontSelector from "~src/scripts/widgets/font-selector/FontSelector";
import { commit } from "@strut/model/Changeset";
import { persistLog, undoLog } from "../app_state/AppLogs";
import * as textColorStyles from "~src/scripts/components/editor/markdown/styling_menu/FontColorButton.module.css";

function Slideout({
  onCollapse,
  defaultLabel,
  theme,
  previewTheme,
}: {
  onCollapse: () => void;
  defaultLabel: string;
  theme: Theme;
  previewTheme: EphemeralTheme;
}) {
  useQuery(["surfaceColor", "slideColor", "defaultTextColor"], theme);
  let textStyle;
  if (theme.defaultTextColor) {
    textStyle = {
      background: theme.defaultTextColor,
    };
  }
  return (
    <>
      <ColorPickerButton2
        onChange={(c) =>
          commit(theme.set("slideColor", c), [persistLog, undoLog])
        }
        onPreview={(c) => commit(previewTheme.set("slideColor", c), [])}
        color={theme.slideColor || "default"}
        recents={theme.recentColors}
      >
        <i className={"bi bi-square-fill " + styles.icon}></i>
        <label>Slide</label>
      </ColorPickerButton2>
      <ColorPickerButton2
        onPreview={(c) => commit(previewTheme.set("surfaceColor", c), [])}
        onChange={(c) =>
          commit(theme.set("surfaceColor", c), [persistLog, undoLog])
        }
        color={theme.surfaceColor || "default"}
        recents={theme.recentColors}
      >
        <i className={"bi bi-square-half " + styles.icon}></i>
        <label>Surface</label>
      </ColorPickerButton2>
      <ColorPickerButton2
        onPreview={(c) => commit(previewTheme.set("defaultTextColor", c), [])}
        onChange={(c) =>
          commit(theme.set("defaultTextColor", c), [persistLog, undoLog])
        }
        color={theme.defaultTextColor || "default"}
        recents={theme.recentColors}
      >
        <strong>A</strong>
        <div className={textColorStyles.fontColor} style={textStyle}></div>
        <div>Text</div>
      </ColorPickerButton2>
      <FontSelector
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

function Section({ label, icon, defaultLabel, theme, previewTheme }) {
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
  useQuery(["deck"], appState);
  useQuery(["theme"], appState.deck);
  return (
    <div className={className}>
      <Section
        label="Theme"
        icon="bi-palette-fill"
        defaultLabel="Default"
        theme={appState.deck.theme}
        previewTheme={appState.previewTheme}
      />
    </div>
  );
}
