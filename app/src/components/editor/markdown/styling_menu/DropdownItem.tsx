import * as styles from "./DropdownItem.module.css";
import React, { ReactNode } from "react";

export default function DropdownItem({
  name,
  nodeName,
  children,
  onApply,
  onUnApply,
}: {
  name: string;
  nodeName: string;
  children: ReactNode;
  onApply: () => void;
  onUnApply: () => void;
}) {
  return (
    <li onClick={nodeName === name ? onUnApply : onApply}>
      <a className="dropdown-item" href="#!">
        {children}
        {nodeName === name ? (
          <i className={"bi bi-check-circle-fill " + styles.selected}></i>
        ) : null}
      </a>
    </li>
  );
}
