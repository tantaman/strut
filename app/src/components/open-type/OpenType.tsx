import * as React from "react";
import { useRef, useEffect, useState } from "react";
import useOnDocClick from "../../interactions/useOnDocClick";
import { commit } from "@strut/model/Changeset";
import { persistLog, undoLog } from "../app_state/AppLogs";
import AppState from "../app_state/AppState";
import * as styles from "./OpenType.module.css";

export default function OpenType({ appState }: { appState: AppState }) {
  const input = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    input.current?.focus();
  }, []);
  useOnDocClick(() => appState.toggleOpenType(false), [appState]);
  const [query, setQuery] = useState("");
  let [activeIndex, setActiveIndex] = useState(0);
  const suggestions = appState.deckIndex.getSuggestions(query);
  if (suggestions.length < activeIndex) {
    activeIndex = 0;
  }

  return (
    <div className={styles.root}>
      <input
        ref={input}
        type="text"
        placeholder="Search for slides by title"
        onKeyDown={(e) => {
          if ((e.metaKey && e.code === "KeyP") || e.code === "Escape") {
            appState.toggleOpenType();
            e.preventDefault();
          }

          if (e.code === "ArrowDown" && activeIndex < suggestions.length - 1) {
            setActiveIndex(activeIndex + 1);
          } else if (e.code === "ArrowUp" && activeIndex > 0) {
            setActiveIndex(activeIndex - 1);
          }

          if (e.code === "Enter") {
            if (activeIndex >= 0 && activeIndex < suggestions.length) {
              commit(
                appState.deck.selectSlideById(suggestions[activeIndex].id),
                [persistLog, undoLog]
              );
              appState.toggleOpenType(false);
            }
          }
        }}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
        }}
        autoFocus
      ></input>
      <ul>
        {suggestions.map((s, i) => (
          <li
            key={s.id}
            className={i === activeIndex ? styles.active : ""}
            onClick={() => {
              commit(appState.deck.selectSlideById(s.id), [
                persistLog,
                undoLog,
              ]);
              appState.toggleOpenType(false);
            }}
          >
            {s.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
