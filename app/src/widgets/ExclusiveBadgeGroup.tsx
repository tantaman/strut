import React from "react";
import * as styles from "./ExclusiveBadgeGroup.module.css";

export default function ExclusiveButtonGroup<T>({
  options,
  value,
  onChange,
}: {
  options: { value: T; text: string; icon: JSX.Element }[];
  value: T;
  onChange: (T) => void;
}) {
  return (
    <div>
      {options.map((o) => (
        <span
          className={
            styles.badge +
            " badge text-dark " +
            (o.value === value ? styles.active : "bg-light")
          }
          onClick={() => onChange(o.value)}
          title={o.text}
          key={o.text}
        >
          {o.icon}
        </span>
      ))}
    </div>
  );
}
