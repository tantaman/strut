import React, { useRef, useState } from "react";
import AppState from "../../domain/ephemeral/AppState";
import { Theme } from "../../domain/schema";
import EphemeralTheme from "../../domain/ephemeral/EphemeralTheme";
import useOnDocClick from "../../interactions/useOnDocClick";
import alias from "../../utils/alias";
import styles from "../../components/header/HeaderButton.module.css";
import mutations from "../../domain/mutations";
import { CtxAsync as Ctx } from "@vlcn.io/react";

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
  ctx,
  value,
  defaultLabel,
  theme,
  previewTheme,
  type,
}: {
  ctx: Ctx;
  value: { name: string; label: string };
  defaultLabel: string;
  theme?: Theme;
  previewTheme: EphemeralTheme;
  type: keyof Theme;
}) {
  const updatePreview = () => {
    previewTheme.set(type, value.name);
  };
  const removePreview = () => {
    previewTheme.set(type, undefined);
  };
  const updateTheme = () => {
    if (theme) {
      mutations.setAllFont(ctx, theme.id, value.name);
    }
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
  ctx,
}: {
  ctx: Ctx;
  defaultLabel: string;
  theme?: Theme;
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
      onClick={(_e) => {
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
            ctx={ctx}
            key={t.name}
            value={t}
            type="fontset"
            defaultLabel={defaultLabel}
            theme={theme}
            previewTheme={previewTheme}
          />
        ))}
      </ul>
    </div>
  );
}
