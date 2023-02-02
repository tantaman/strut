import config from "../config";
import { CtxAsync as Ctx, first } from "@vlcn.io/react";
import { IID_of, newIID } from "../id";
import fns from "./fns";
import {
  Deck,
  EmbedComponent,
  LineComponent,
  Operation,
  ShapeComponent,
  Slide,
  TextComponent,
  Theme,
  UndoStack,
} from "./schema";

// TODO: use uuidv7 for ids base95 encoded
function objId<T>(ctx: Ctx): IID_of<T> {
  return newIID<T>(ctx.db.siteid.substring(0, 4));
}

const mutations = {
  async undo(ctx: Ctx, deckId: IID_of<Deck>) {
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

  async redo(ctx: Ctx, deckId: IID_of<Deck>) {
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

  selectSlide(ctx: Ctx, deckId: IID_of<Deck>, id: IID_of<Slide>) {
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

  addRecentColor(ctx: Ctx, color: string, id: IID_of<Theme>) {
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

  persistMarkdownToSlide(ctx: Ctx, id: IID_of<Slide>, dom: string) {
    return ctx.db.exec(
      `UPDATE markdown
        SET "content" = ?
        WHERE slide_id = ?`,
      [dom, id]
    );
  },

  // TODO: we need to cascade deletes to fk edges.
  // Can we do SQLite FK cascade w/o FK enforcement?
  removeSlide(
    ctx: Ctx,
    id: IID_of<Slide>,
    deckId: IID_of<Deck>,
    selected: boolean
  ) {
    // TODO: tx
    const deleteSlide = () =>
      ctx.db.exec(`DELETE FROM "slide" WHERE "id" = ?`, [id]);
    if (!selected) {
      return deleteSlide();
    }

    return ctx.db
      .execA<[IID_of<Slide>]>(
        /*sql*/ `WITH "cte" AS (
        SELECT "id", row_number() OVER (ORDER BY "order") as "rn" FROM "slide"
      ), "current" AS (
        SELECT "rn" FROM "cte"
        WHERE id = '${id}'
      )
      SELECT "cte"."id" FROM "cte", "current"
        WHERE ABS("cte"."rn" - "current"."rn") <= 1
      ORDER BY "cte"."rn"`
      )
      .then((beforeAfter) => {
        if (beforeAfter.length == 1) {
          // only one slide, do not allow removing last slide
          return;
        }

        let select = beforeAfter[beforeAfter.length - 1][0];
        // removing the last slide, select one prior
        if (select == id) {
          select = beforeAfter[0][0];
        }

        return ctx.db
          .exec(
            `INSERT OR IGNORE INTO "selected_slide" ("deck_id", "slide_id") VALUES (?, ?)`,
            [deckId, select]
          )
          .then(deleteSlide);
      });
  },

  addSlideAfter(ctx: Ctx, i: number, id: IID_of<Deck>) {
    // TODO: do this in a tx once we add tx support to wa-sqlite wrapper
    // doable in a single sql stmt?
    return ctx.db
      .execA<[number]>(`SELECT "order" FROM "slide" LIMIT 2 OFFSET ${i}`)
      .then((slides) => {
        const first = slides[0];
        const second = slides[1];
        let order = first[0];
        if (second == null) {
          order += 1;
        } else {
          order = (first[0] + second[0]) / 2;
        }

        const slideId = objId<Slide>(ctx);
        return ctx.db
          .exec(`INSERT INTO "slide" ("id", "deck_id", "order", "created", "modified") VALUES (
          '${slideId}',
          '${id}',
          ${order},
          ${Date.now()},
          ${Date.now()}
        );`);
      });
  },

  addText(ctx: Ctx, deckId: IID_of<Deck>) {
    const id = objId(ctx);
    return ctx.db.exec(
      /*sql*/ `INSERT INTO text_component
      ("id", "slide_id", "x", "y")
      SELECT '${id}', "slide_id", ${
        ((Math.random() * config.slideWidth) / 2) | 0
      }, ${
        ((Math.random() * config.slideHeight) / 2) | 0
      } FROM selected_slide WHERE deck_id = ? ORDER BY rowid DESC LIMIT 1
    `,
      [deckId]
    );
  },

  // TODO: should be id rather than index based reordering in the future
  reorderSlides(
    ctx: Ctx,
    id: IID_of<Deck>,
    fromIndex: number,
    toIndex: number
  ) {},

  setAllSlideColor(
    ctx: Ctx,
    id: IID_of<Theme> | undefined,
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
    id: IID_of<Theme> | undefined,
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
    id: IID_of<Theme> | undefined,
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

  setAllFont(ctx: Ctx, id: IID_of<Theme>, name: string) {},

  async genOrCreateCurrentDeck(ctx: Ctx): Promise<IID_of<Deck>> {
    // go thru recent opens
    // open the most recent
    // if none exists, write one
    // return id of the thing

    const ids = await ctx.db.execA(
      `SELECT id FROM deck ORDER BY modified DESC LIMIT 1`
    );
    if (ids.length == 0) {
      // create
      const deckId = objId<Deck>(ctx);
      const slideId = objId<Slide>(ctx);
      await ctx.db.execMany([
        `INSERT INTO "deck" (
        "id",
        "title",
        "created",
        "modified",
        "theme_id",
        "chosen_presenter"
      ) VALUES (
        '${deckId}',
        'First Deck',
        ${Date.now()},
        ${Date.now()},
        1,
        'impress'
      );`,
        `INSERT INTO "slide" ("id", "deck_id", "order", "created", "modified") VALUES (
        '${slideId}',
        '${deckId}',
        0,
        ${Date.now()},
        ${Date.now()}
      );`,
        `INSERT INTO "selected_slide" ("deck_id", "slide_id") VALUES ('${deckId}', '${slideId}')`,
      ]);

      return deckId;
    }

    return ids[0][0];
  },

  saveText(ctx: Ctx, markdown: string, compnentId: IID_of<TextComponent>) {
    return ctx.db.exec(
      /* sql */ `UPDATE "text_component" SET "text" = ? WHERE "id" = ?`,
      [markdown, compnentId]
    );
  },

  saveDrag(
    ctx: Ctx,
    component:
      | "text_component"
      | "embed_component"
      | "shape_component"
      | "line_component",
    compnentId:
      | IID_of<TextComponent>
      | IID_of<ShapeComponent>
      | IID_of<LineComponent>
      | IID_of<EmbedComponent>,
    x: number,
    y: number
  ) {
    return ctx.db.exec(
      /* sql */ `UPDATE "text_component" SET "x" = ?, "y" = ? WHERE "id" = ?`,
      [((x * 100) | 0) / 100, ((y * 100) | 0) / 100, compnentId]
    );
  },
};

export default mutations;
