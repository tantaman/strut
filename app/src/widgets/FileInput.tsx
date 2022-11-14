import React, { ChangeEvent, useCallback, useRef } from "react";

function FileInput(props: {
  label: string;
  btnClass: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const openFileBrowser = () => {
    inputRef.current?.click();
  };
  return (
    <div className="wdgt-file-input">
      <input
        type="file"
        className="hidden-file-input"
        ref={inputRef}
        onChange={props.onChange}
      />
      <button onClick={openFileBrowser} className={"btn " + props.btnClass}>
        {props.label}
      </button>
    </div>
  );
}

export default FileInput;
