import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import * as styles from "./SlashLink.module.css";
import { truncateForDisplay } from "@vlcn.io/id";
import { ID_of } from "../../../../id";
import { Slide } from "../../../../domain/schema";

type Suggestion = { id: ID_of<Slide>; title: string /*match: string*/ };
export type Props = {
  items: Suggestion[];
  command: (params: { id: string }) => void;
};

export default forwardRef((props: Props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];

    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length
    );
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className={styles.items}>
      {props.items.map((item, index) => (
        <button
          className={`${styles.item} ${
            index === selectedIndex ? styles.isSelected : ""
          }`}
          key={index}
          onClick={() => selectItem(index)}
        >
          {truncateForDisplay(item.id)}: {item.title}
        </button>
      ))}
    </div>
  );
});
