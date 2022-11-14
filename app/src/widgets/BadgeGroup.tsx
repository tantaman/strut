import React from "react";
import * as styles from "./ExclusiveBadgeGroup.module.css";

export default function BadgeGroup<T>({
  options,
  onClick,
}: {
  options: { value: T; text: string; icon: JSX.Element }[];
  onClick: (x: T) => void;
}) {
  return (
    <div>
      {options.map((o) => (
        <span
          className={styles.badge + " badge text-dark bg-light "}
          title={o.text}
          key={o.text}
          onClick={() => onClick(o.value)}
        >
          {o.icon}
        </span>
      ))}
    </div>
  );
}
