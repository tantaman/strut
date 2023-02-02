import * as React from "react";
import { useRef, useEffect, useState } from "react";
import useOnDocClick from "../../interactions/useOnDocClick";
import AppState from "../../domain/ephemeral/AppState";
import * as styles from "./OpenType.module.css";
import mutations from "../../domain/mutations";

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
              mutations.selectSlide(
                appState.ctx,
                appState.current_deck_id,
                suggestions[activeIndex].id
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
            key={s.id.toString()}
            className={i === activeIndex ? styles.active : ""}
            onClick={() => {
              mutations.selectSlide(
                appState.ctx,
                appState.current_deck_id,
                s.id
              );
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
