import React, { useRef, useState } from "react";
import useOnDocClick from "../../interactions/useOnDocClick";
import alias from "../../utils/alias";
import ColorPicker2 from "./ColorPicker2";

const showAlias = alias(" show", "");
export default function ColorPickerButton2({
  children,
  onChange,
  onPreview,
  color,
  recents,
}: {
  children: React.ReactNode;
  onChange: (c: string | undefined) => void;
  color: string;
  recents: readonly string[];
  onPreview?: (c: string | undefined) => void;
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
        {children}
      </button>
      <div className="dropdown-menu">
        {show && (
          <ColorPicker2
            onChange={(c) => {
              onChange(c);
              setShow(false);
            }}
            recents={recents}
            onPreview={onPreview}
            color={color}
          />
        )}
      </div>
    </div>
  );
}
