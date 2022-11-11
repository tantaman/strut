import { commit } from "@strut/model/Changeset";
import React, { useRef, useState } from "react";
import { persistLog, undoLog } from "~src/scripts/components/app_state/AppLogs";
import AppState from "~src/scripts/components/app_state/AppState";
import Theme, {
  EphemeralTheme,
  Data as ThemeData,
} from "~src/scripts/components/deck/Theme";
import useOnDocClick from "~src/scripts/interactions/useOnDocClick";
import alias from "~src/scripts/utils/alias";
import * as styles from "~src/scripts/components/header/HeaderButton.module.css";

/*
What do we do?

Typeahead search thru all google fonts?
Index them on our own on the client first? To reduce API calls?

Hover for preview? Dynamically load fonts to preview...

How do they apply to the deck?
Theme would need to reference:
- @imports
- font family string

App would need a "style" renderer to bring these ad-hoc imports in
Could create ad-hoc theme class?
*/

const showAlias = alias(" show", "");
function Option({
  value,
  defaultLabel,
  theme,
  previewTheme,
  type,
}: {
  value: { name: string; label: string };
  defaultLabel: string;
  theme: Theme;
  previewTheme: EphemeralTheme;
  type: keyof ThemeData;
}) {
  const updatePreview = () => {
    commit(previewTheme.set(type, value.name), []);
  };
  const removePreview = () => {
    commit(previewTheme.set(type, undefined), []);
  };
  const updateTheme = () => {
    commit(theme.set(type, value.name), [persistLog, undoLog]);
  };
  return (
    <li
      onMouseOver={updatePreview}
      onMouseOut={removePreview}
      onClick={updateTheme}
    >
      <a className="dropdown-item" href="#">
        {value.name === "default" ? defaultLabel : value.label}
      </a>
    </li>
  );
}

export default function FontSelector({
  defaultLabel,
  theme,
  previewTheme,
}: {
  defaultLabel: string;
  theme: Theme;
  previewTheme: EphemeralTheme;
}) {
  const [show, setShow] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useOnDocClick((e) => {
    if (rootRef.current?.contains(e.target)) {
      return;
    }
    setShow(false);
  }, []);
  return (
    <div
      className={"btn-group dropdown" + showAlias(show)}
      role="group"
      onClick={(e) => {
        setShow(!show);
      }}
      ref={rootRef}
    >
      <button
        className="btn btn-outline-warning"
        type="button"
        aria-expanded="false"
      >
        <i className={"bi bi-fonts " + styles.icon}></i>
        <label>Font</label>
      </button>
      <ul className="dropdown-menu">
        {AppState.fontThemes.map((t) => (
          <Option
            key={t.name}
            value={t}
            type="font"
            defaultLabel={defaultLabel}
            theme={theme}
            previewTheme={previewTheme}
          />
        ))}
      </ul>
    </div>
  );
}
