/*
 * Enable us to search for slides in the deck via keyword.
 * Flattens slides too if some are nested below others.
 *
 * Simplest index:
 * - First line of text used as title
 * - find where title contains term(s)
 *
 * We'll need to subscribe to changes for all slides?
 * Or shall we just hook into the transaction log and only process slide
 * transactions? Simpler than hooking into every slide. Simpler than only finding
 * current slide edit events.
 *
 * And is at the right layer -- model layer. Doing so at app layer could
 * cause us to miss alternative routes for updates.
 *
 * persistLog technically isn't the right layer when we have collaborative editing?
 * Or is it since we need to persist those events locally?
 * Persist log would want to merge changes for collab, collab incomings would want to
 * go to persist log :o
 */

import TransactionLog from "@strut/model/TransactionLog";
import Deck from "../deck/Deck";
import { SID_of } from "@strut/sid";
import Slide from "../deck/Slide";
import { MergedChangesets } from "@strut/model/Changeset";
import { Disposer } from "@strut/events/Observable";
import { HTMLContent } from "@tiptap/core";
import Fuse from "fuse.js";
import counter from "@strut/counter";

export type Suggestion = { id: SID_of<Slide>; title: string /*match: string*/ };

const count = counter("DeckIndex");
export default class DeckIndex {
  private subscriptionDisposer: Disposer;
  private fuse: Fuse<{ id: SID_of<Slide>; text: string[] }>;

  constructor(
    // The source of events to use to update the deck index
    private log: TransactionLog
  ) {
    this.subscriptionDisposer = this.log.observe(this._onLogChange);
    this.fuse = new Fuse([], {
      keys: ["text"],
    });
  }

  dispose() {
    count.bump("dispose");
    this.subscriptionDisposer();
  }

  /**
   * Invoked when an entirely new deck is loaded. Clears the old
   * index and creates a new one for this deck.
   * @param deck
   */
  reindex(deck: Deck) {
    count.bump("reindex");
    this.fuse.setCollection(
      deck.slides
        .map((s) => ({ id: s.id, text: pullText(s.content) }))
        .toArray()
    );
  }

  // Note: we could debounce this to only re-index every second or something
  // although we'd have to process all changes to ensure we don't lose
  // deletes...
  _onLogChange = (changes: MergedChangesets) => {
    count.bump("_onLogChange");
    for (let [model, diff] of changes) {
      if (model instanceof Slide) {
        this.fuse.remove((d) => d.id === (model as Slide).id);
        if (diff !== undefined) {
          this.fuse.add({ id: model.id, text: pullText(model.content) });
        }
      }
    }
  };

  /**
   * Given some free text, return slides & their titles that may match
   */
  getSuggestions(query: string): Suggestion[] {
    const results = this.fuse.search(query);
    return results.map((r) => ({
      id: r.item.id,
      title: r.item.text[0],
    }));
    // obviously should implement a ranking algorithm based on
    // 1. if the text is matching at the beginning of a line
    // 2. if a line is likely a title
    // 3. prior use
    // context for matches
    // prior, the, after lines?
  }
}

function pullText(node: HTMLContent): string[] {
  // add newlines on closing tags of block elements...
  // node
  return node
    .split(/(<\/[^>]+>)/gi)
    .map((s) => s.replace(/(<([^>]+)>)/gi, ""))
    .filter((s) => s);
}
