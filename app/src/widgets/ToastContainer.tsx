import React, { memo } from "react";
import ErrorState from "../components/app_state/ErrorState";
import { useQuery } from "@strut/model/Hooks";
import Toast from "./Toast";
import * as styles from "./ToastContainer.module.css";

function ToastContainer({ errorState }: { errorState: ErrorState }) {
  useQuery(["errors"], errorState);
  const errors = errorState.errors;
  return (
    <div aria-live="polite" aria-atomic="true" className={styles.root}>
      {errors.map((e) => (
        <Toast
          key={e.id}
          id={e.id}
          level={e.level}
          time={e.time}
          message={e.exception.message}
          errorState={errorState}
        />
      ))}
    </div>
  );
}

const ToastContainerMemo = memo(ToastContainer);
export default ToastContainerMemo;
