import { Node, mergeAttributes } from "@tiptap/core";
import { Node as ProseMirrorNode } from "prosemirror-model";
import { PluginKey } from "prosemirror-state";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";
import { truncateForDisplay } from "@vlcn.io/id";
import { Editor, Range } from "@tiptap/core";

export type MentionOptions = {
  HTMLAttributes: Record<string, any>;
  renderLabel: (props: {
    options: MentionOptions;
    node: ProseMirrorNode;
  }) => string;
  suggestion: Omit<SuggestionOptions, "editor">;
};

export const MentionPluginKey = new PluginKey("mention");

export const Mention = Node.create<MentionOptions>({
  name: "mention",

  addOptions() {
    return {
      HTMLAttributes: {},
      renderLabel({ options, node }) {
        // TODO: and this is why you do dependency injection so these configurable
        // components don't need to depend on a particular of your app
        // the particular in this case being `strut_id` utilities --
        // truncateForDisplay.
        // Corner turning types is also super annoying :/
        // label vs title for the suggestion type.
        // How would clojure account for this?
        return `${options.suggestion.char}${truncateForDisplay(node.attrs.id)}`;
      },
      suggestion: {
        char: "/",
        pluginKey: MentionPluginKey,
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: any;
        }) => {
          // increase range.to by one when the next node is of type "text"
          // and starts with a space character
          const nodeAfter = editor.view.state.selection.$to.nodeAfter;
          const overrideSpace = nodeAfter?.text?.startsWith(" ");

          if (overrideSpace) {
            range.to += 1;
          }

          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: this.name,
                attrs: props,
              },
              {
                type: "text",
                text: " ",
              },
            ])
            .run();
        },
        allow: ({ editor, range }: { editor: Editor; range: Range }) => {
          const $from = editor.state.doc.resolve(range.from);
          const type = editor.schema.nodes[this.name];
          // @ts-ignore -- multiple type imports to resolve...
          const allow = !!$from.parent.type.contentMatch.matchType(type);

          return allow;
        },
      },
    };
  },

  group: "inline",

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }

          return {
            "data-id": attributes.id,
          };
        },
      },

      label: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-label"),
        renderHTML: (attributes) => {
          if (!attributes.label) {
            return {};
          }

          return {
            "data-label": attributes.label,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        {
          "data-type": this.name,
          "data-href":
            "#" +
            encodeURIComponent(
              JSON.stringify({
                type: "SLIDE_FROM_SLIDE",
                id: node.attrs.id,
              })
            ),
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      this.options.renderLabel({
        options: this.options,
        // @ts-ignore weird import conflicts
        node,
      }),
    ];
  },

  renderText({ node }) {
    return this.options.renderLabel({
      options: this.options,
      // @ts-ignore weird import conflicts
      node,
    });
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () =>
        this.editor.commands.command(({ tr, state }) => {
          let isMention = false;
          const { selection } = state;
          const { empty, anchor } = selection;

          if (!empty) {
            return false;
          }

          state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
            if (node.type.name === this.name) {
              isMention = true;
              tr.insertText(
                this.options.suggestion.char || "",
                pos,
                pos + node.nodeSize
              );

              return false;
            }
          });

          return isMention;
        }),
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export default Mention;
