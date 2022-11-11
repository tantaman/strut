import { Editor } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import MentionList, { Props as ListProps } from "./SlashLinkList";

type Props = ListProps & {
  editor: Editor;
  clientRect: (() => DOMRect) | null;
};

function render() {
  let component: any;
  let popup: any;

  return {
    onStart: (props: Props) => {
      component = new ReactRenderer(MentionList, {
        props,
        editor: props.editor,
      });

      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },

    onUpdate(props) {
      component.updateProps(props);

      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown(props: any) {
      if (props.event.key === "Escape") {
        popup[0].hide();

        return true;
      }

      return component.ref?.onKeyDown(props);
    },

    onExit() {
      popup[0].destroy();
      component.destroy();
    },
  };
}

const opts = {
  char: "/",
  items: ({ query }: { query: string }) => {
    return [
      "Lea Thompson",
      "Cyndi Lauper",
      "Tom Cruise",
      "Madonna",
      "Jerry Hall",
      "Joan Collins",
      "Winona Ryder",
      "Christina Applegate",
      "Alyssa Milano",
      "Molly Ringwald",
      "Ally Sheedy",
      "Debbie Harry",
      "Olivia Newton-John",
      "Elton John",
      "Michael J. Fox",
      "Axl Rose",
      "Emilio Estevez",
      "Ralph Macchio",
      "Rob Lowe",
      "Jennifer Grey",
      "Mickey Rourke",
      "John Cusack",
      "Matthew Broderick",
      "Justine Bateman",
      "Lisa Bonet",
    ]
      .filter((item) => item.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 5);
  },

  render,
};

export default function create(deckIndex: any) {
  return {
    char: "/",
    items: ({ query }: { query: string }) => {
      // return deckIndex.getSuggestions(query);
      return ["test", "test2"];
    },
    render,
  };
}
