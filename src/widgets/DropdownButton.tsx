"use strict";

import * as React from "react";
import { useState } from "react";
import css from "../html/Css";
import useOnDocClick from "../interactions/useOnDocClick";

function DropdownButton(props: {
  left?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [dropped, setDropped] = useState(false);
  useOnDocClick(() => {
    if (dropped) {
      setDropped(false);
    }
  }, [dropped]);
  let open = "";
  if (dropped) {
    open = " show";
  }

  let direction = "dropdown";
  if (props.left) {
    direction = "dropstart";
  }

  return (
    <div
      className={css.joinClasses(direction + " " + open, props.className)}
      onClick={(e) => {
        e.stopPropagation();
        setDropped(!dropped);
        return false;
      }}
    >
      {props.children}
    </div>
  );
}

function Options(props: { children: React.ReactNode }) {
  return <ul className="dropdown-menu">{props.children}</ul>;
}

DropdownButton.Options = Options;

export default DropdownButton;
