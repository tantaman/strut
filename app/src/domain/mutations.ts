import { Ctx, first } from "../hooks";
import { ID_of, newId } from "../id";
import fns from "./fns";
import { Deck, Operation, Slide, Theme, UndoStack } from "./schema";

const mutations = {
  async undo(ctx: Ctx, deckId: ID_of<Deck>) {
    const item = first(
      await ctx.db.execO<UndoStack>(
        `SELECT * FROM undo_stack WHERE deck_id = ? ORDER BY "order" DESC LIMIT 1`,
        [deckId]
      )
    );
    if (item) {
      await ctx.db.exec(
        `DELETE FROM undo_stack WHERE deck_id = ? AND "order" = ?`,
        [deckId, item.order]
      );
      // TODO: that should be pushed onto redo stack!
      const op = fns.decodeOperation(item.operation);
      // await mutations.revertOperation(ctx, op);
    }
  },

  async redo(ctx: Ctx, deckId: ID_of<Deck>) {
    const item = first(
      await ctx.db.execO<UndoStack>(
        `SELECT * FROM redo_stack WHERE deck_id = ? ORDER BY "order" ASC LIMIT 1`,
        [deckId]
      )
    );
    if (item) {
      await ctx.db.exec(
        `DELETE FROM redo_stack WHERE deck_id = ? AND "order" = ?`,
        [deckId, item.order]
      );
      const op = fns.decodeOperation(item.operation);
      await mutations.applyOperation(ctx, op);
    }
  },

  toggleOpenType() {},

  toggleDrawing() {},

  setTransitionType(ctx: Ctx, presenter: string, transitionType: string) {
    // TODO encode an operation for undo/redo too
    return ctx.db.exec(
      "UPDATE presenter SET transition_type = ? WHERE name = ?",
      [transitionType, presenter]
    );
  },

  selectSlide(ctx: Ctx, deckId: ID_of<Deck>, id: ID_of<Slide>) {
    // TODO: we need to hold notifications
    // until transaction completes
    // or not since replication won't be transactional and we can
    // make the user deal with that problem locally too
    // to ensure they deal with it remotely
    return ctx.db
      .exec(
        "INSERT OR IGNORE INTO selected_slide (deck_id, slide_id) VALUES (?, ?)",
        [deckId, id]
      )
      .then(() =>
        ctx.db.exec(
          "DELETE FROM selected_slide WHERE deck_id = ? AND slide_id != ?",
          [deckId, id]
        )
      );
  },

  async applyOperation(ctx: Ctx, op: Operation) {
    // get mutation from op.name
    // apply mutations from op.args and current ctx
    // TODO: could also look into the sqlite undo/redo as triggers design
  },

  addRecentColor(ctx: Ctx, color: string, id: ID_of<Theme>) {
    return ctx.db.exec(
      `INSERT INTO recent_color
        ("color", "last_used", "first_used", "theme_id")
      VALUES
        (?, ?, ?, ?)
      ON CONFLICT ("color") DO UPDATE
        SET "last_used" = "last_used".NEW,
        SET "first_used" = "first_used".OLD,
        SET "theme_id" = "theme_id".NEW
      `,
      [color, Date.now(), Date.now(), id]
    );
  },

  persistMarkdownToSlide(ctx: Ctx, id: ID_of<Slide>, dom: string) {
    return ctx.db.exec(
      `UPDATE markdown
        SET "content" = ?
        WHERE slide_id = ?`,
      [dom, id]
    );
  },

  removeSlide(ctx: Ctx, id: ID_of<Slide>) {
    return ctx.db.exec(`DELETE FROM slide WHERE id = ?`, [id]);
  },

  addSlideAfter(ctx: Ctx, i: number, id: ID_of<Deck>) {},

  // TODO: should be id rather than index based reordering in the future
  reorderSlides(
    ctx: Ctx,
    id: ID_of<Deck>,
    fromIndex: number,
    toIndex: number
  ) {},

  setAllSlideColor(
    ctx: Ctx,
    id: ID_of<Theme> | undefined,
    c: string | undefined
  ) {
    if (!id) {
      return;
    }
    return ctx.db.exec(`UPDATE theme SET slide_color = ? WHERE id = ?`, [
      c == null ? null : c,
      id,
    ]);
  },

  setAllSurfaceColor(
    ctx: Ctx,
    id: ID_of<Theme> | undefined,
    c: string | undefined
  ) {
    if (!id) {
      return;
    }
    return ctx.db.exec(`UPDATE theme SET surface_color = ? WHERE id = ?`, [
      c == null ? null : c,
      id,
    ]);
  },

  setAllTextColor(
    ctx: Ctx,
    id: ID_of<Theme> | undefined,
    c: string | undefined
  ) {
    if (!id) {
      return;
    }
    return ctx.db.exec(`UPDATE theme SET text_color = ? WHERE id = ?`, [
      c == null ? null : c,
      id,
    ]);
  },

  setAllFont(ctx: Ctx, id: ID_of<Theme>, name: string) {},

  async genOrCreateCurrentDeck(ctx: Ctx): Promise<ID_of<Deck>> {
    // go thru recent opens
    // open the most recent
    // if none exists, write one
    // return id of the thing

    const ids = await ctx.db.execA(
      `SELECT id FROM deck ORDER BY modified DESC LIMIT 1`
    );
    if (ids.length == 0) {
      // create
      const deckid = newId<Deck>(ctx.siteid.substring(0, 4));
      ctx.db.exec(`INSERT INTO deck (
        "id",
        "title",
        "created",
        "modified",
        "theme_id",
        "chosen_presenter"
      ) VALUES (
        X'${deckid}',
        'First Deck',
        ${Date.now()},
        ${Date.now()},
        1,
        'impress'
      )`);

      return deckid;
    }

    return ids[0][0];
  },
};

export default mutations;
