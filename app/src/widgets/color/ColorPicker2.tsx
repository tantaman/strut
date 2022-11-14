import React, { useState } from "react";
import * as styles from "./ColorPicker2.module.css";
import chroma from "chroma-js";
import useOnDocClick from "../../interactions/useOnDocClick";
import alias from "../../utils/alias";
import HSVSelector from "./HSVSelector";
import OpenColor from "open-color";

const mode = "lch";
const rowLen = 7;

type Style = { background: string };

const swatches = (
  [
    OpenColor.gray,
    OpenColor.red,
    OpenColor.pink,
    OpenColor.grape,
    OpenColor.violet,
    OpenColor.indigo,
    OpenColor.blue,
    OpenColor.cyan,
    OpenColor.teal,
    OpenColor.green,
    OpenColor.lime,
    OpenColor.yellow,
    OpenColor.orange,
  ] as const
).map((row) => row.map((color: string) => ({ background: color })));

// const swatches = [
//   chroma
//     .scale(["red", "pink"])
//     .mode(mode)
//     .colors(rowLen + 1)
//     .slice(0, -1),
//   chroma
//     .scale(["pink", "blue"])
//     .mode(mode)
//     .colors(rowLen + 1)
//     .slice(0, -1),
//   chroma
//     .scale(["blue", "cyan"])
//     .mode(mode)
//     .colors(rowLen + 1)
//     .slice(0, -1),
//   chroma
//     .scale(["cyan", "green"])
//     .mode(mode)
//     .colors(rowLen + 1)
//     .slice(0, -1),
//   chroma
//     .scale(["green", "yellow"])
//     .mode(mode)
//     .colors(rowLen + 1)
//     .slice(0, -1),
//   chroma
//     .scale(["yellow", "orange"])
//     .mode(mode)
//     .colors(rowLen + 1)
//     .slice(0, -1),
//   chroma
//     .scale(["orange", "red"])
//     .mode(mode)
//     .colors(rowLen + 1)
//     .slice(0, -1),
//   chroma.scale(["rgb(51,51,51)", "white"]).mode(mode).colors(rowLen),
// ].map((r) => r.map((c) => ({ background: c })));

const cancelStyle = {
  marginRight: 0,
  marginTop: 8,
};
const showAlias = alias(" show", "");
export default function ColorPicker2({
  color,
  recents,
  onChange,
  onPreview,
}: {
  color: string;
  recents: readonly string[];
  onChange: (color: string | undefined) => void;
  onPreview?: (color: string | undefined) => void;
}) {
  const chromaColor = color === "default" ? null : chroma(color);
  const normalized: string | undefined = chromaColor?.toString();
  const [show, setShow] = useState(false);
  useOnDocClick(() => {
    onPreview && onPreview(undefined);
    setShow(false);
  }, []);
  const [previewColor, setPreviewColor] = useState(normalized);
  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <button
          type="button"
          className={"btn btn-outline-warning " + styles.reset}
          onClick={() => onChange(undefined)}
        >
          Default
        </button>
        <div>
          <div
            className={"btn-group dropdown" + showAlias(show)}
            role="group"
            onClick={(e) => {
              e.stopPropagation();
              if (show) {
                onPreview && onPreview(undefined);
              }
              setShow(!show);
            }}
          >
            <i
              className={"bi bi-palette " + styles.label}
              style={{ color: previewColor || normalized || undefined }}
            ></i>
            <div className={"dropdown-menu " + styles.fieldDropdown}>
              <HSVSelector
                color={normalized || "#ff0000"}
                onCommit={(c) => onChange(c)}
                onPreview={(c) => {
                  setPreviewColor(c);
                  onPreview && onPreview(c);
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div>
        {swatches.map((r, i: number) => (
          <div key={i} className={styles.swatchRow}>
            {r.map((s: Style, i: number) => (
              <Swatch
                key={i}
                s={s}
                onChange={onChange}
                onPreview={onPreview}
                normalized={normalized}
                chromaColor={chromaColor}
              />
            ))}
          </div>
        ))}
      </div>
      <div>
        <label>Recent</label>
        <div>
          {recents.map((r) => (
            <Swatch
              key={r}
              s={{ background: r }}
              onChange={onChange}
              onPreview={onPreview}
              normalized={normalized}
              chromaColor={chromaColor}
            />
          ))}
        </div>
      </div>
      <div>
        <button
          type="button"
          className={"btn btn-outline-warning pull-right " + styles.reset}
          onClick={() => {
            onPreview && onPreview(undefined);
            setShow(false);
          }}
          style={cancelStyle}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Swatch({
  s,
  onChange,
  onPreview,
  normalized,
  chromaColor,
}: {
  s: Style;
  onChange: (c: string) => void;
  onPreview?: (c: string | undefined) => void;
  normalized: string | undefined;
  chromaColor: any;
}) {
  return (
    <span
      style={s}
      onClick={() => onChange(s.background)}
      className={styles.swatch}
      onMouseEnter={() => onPreview && onPreview(s.background)}
      onMouseOut={() => onPreview && onPreview(undefined)}
    >
      {s.background === normalized ? (
        <span
          style={{
            color: chromaColor?.luminance() < 0.5 ? "white" : "black",
          }}
        >
          ✓
        </span>
      ) : (
        ""
      )}
    </span>
  );
}
