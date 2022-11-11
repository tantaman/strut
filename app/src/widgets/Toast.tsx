import React from "react";
import ErrorState, { StrtError } from "../components/app_state/ErrorState";
import { SID_of } from "@strut/sid";
import relativeTime from "../utils/relativeTime";

export default function Toast({
  id,
  level,
  message,
  time,
  errorState,
}: {
  id: SID_of<StrtError>;
  level: string;
  message: string;
  time: Date;
  errorState: ErrorState;
}) {
  return (
    <div
      className="toast fade show"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="toast-header">
        <i className="bd-placeholder-img rounded me-2 bi bi-bug-fill"></i>
        <strong className="me-auto">Error!</strong>
        <small>{relativeTime(time)}</small>
        <button
          type="button"
          className="btn-close"
          data-bs-dismiss="toast"
          aria-label="Close"
          onClick={() => errorState.acknowledge(id)}
        ></button>
      </div>
      <div className="toast-body">{message}</div>
    </div>
  );
}
