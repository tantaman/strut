import config from "../config.js";
import { first } from "@vlcn.io/react";
import { IID_of, newIID } from "../id";
import fns from "./fns";
import {
  AnyComponentID,
  ComponentType,
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
import { DBAsync, TXAsync } from "@vlcn.io/xplat-api";

// TODO: use uuidv7 for ids base95 encoded
function objId<T>(db: DBAsync): IID_of<T> {
  return newIID<T>(db.siteid.substring(0, 4));
}

const mutations = {
  async undo(tx: TXAsync, deckId: IID_of<Deck>) {
    const item = first(
      await tx.execO<UndoStack>(
        `SELECT * FROM undo_stack WHERE deck_id = ? ORDER BY "order" DESC LIMIT 1`,
        [deckId]
      )
    );
    if (item) {
      await tx.exec(
        `DELETE FROM undo_stack WHERE deck_id = ? AND "order" = ?`,
        [deckId, item.order]
      );
      // TODO: that should be pushed onto redo stack!
      // const _op = fns.decodeOperation(item.operation);
      // await mutations.revertOperation(ctx, op);
    }
  },

  async redo(tx: TXAsync, deckId: IID_of<Deck>) {
    const item = first(
      await tx.execO<UndoStack>(
        `SELECT * FROM redo_stack WHERE deck_id = ? ORDER BY "order" ASC LIMIT 1`,
        [deckId]
      )
    );
    if (item) {
      await tx.exec(
        `DELETE FROM redo_stack WHERE deck_id = ? AND "order" = ?`,
        [deckId, item.order]
      );
      const op = fns.decodeOperation(item.operation);
      await mutations.applyOperation(tx, op);
    }
  },

  toggleDrawing() {},

  setTransitionType(tx: TXAsync, presenter: string, transitionType: string) {
    // TODO encode an operation for undo/redo too
    return tx.exec("UPDATE presenter SET transition_type = ? WHERE name = ?", [
      transitionType,
      presenter,
    ]);
  },

  selectSlide(tx: TXAsync, deckId: IID_of<Deck>, id: IID_of<Slide>) {
    return tx.tx(async (tx) => {
      await tx.exec(
        "INSERT OR IGNORE INTO selected_slide (deck_id, slide_id) VALUES (?, ?)",
        [deckId, id]
      );
      await tx.exec(
        "DELETE FROM selected_slide WHERE deck_id = ? AND slide_id != ?",
        [deckId, id]
      );
    });
  },

  selectComponent(
    tx: TXAsync,
    slideId: IID_of<Slide>,
    componentId: AnyComponentID,
    componentType: ComponentType
  ) {
    return tx.tx(async (tx) => {
      await tx.exec(
        "INSERT OR IGNORE INTO selected_component (slide_id, component_id, component_type) VALUES (?, ?, ?)",
        [slideId, componentId, componentType]
      );
      await tx.exec(
        "DELETE FROM selected_component WHERE slide_id = ? AND component_id != ?",
        [slideId, componentId]
      );
    });
  },

  // remove the thing, updating selection state appropriately
  removeComponent(
    tx: TXAsync,
    componentId: AnyComponentID,
    componentType: ComponentType
  ) {
    tx.tx(async (tx) => {
      await this.removeComponent_ignoreSelection(
        tx,
        componentId,
        componentType
      );
      await tx.exec(/* sql */ `DELETE FROM selected_component`);
    });
  },

  removeComponent_ignoreSelection(
    tx: TXAsync,
    componentId: AnyComponentID,
    componentType: ComponentType
  ) {
    switch (componentType) {
      case "text":
        return tx.exec("DELETE FROM text_component WHERE id = ?", [
          componentId,
        ]);
      case "line":
        return tx.exec("DELETE FROM line_component WHERE id = ?", [
          componentId,
        ]);
      case "shape":
        return tx.exec("DELETE FROM shape_component WHERE id = ?", [
          componentId,
        ]);
      case "embed":
        return tx.exec("DELETE FROM embed_component WHERE id = ?", [
          componentId,
        ]);
    }
  },

  removeSelectedComponents(tx: TXAsync, slideId: IID_of<Slide>) {
    return tx.tx(async (tx) => {
      const components = await tx.execA(
        "SELECT component_id, component_type FROM selected_component WHERE slide_id = ?",
        [slideId]
      );
      for (const component of components) {
        await mutations.removeComponent_ignoreSelection(
          tx,
          component[0],
          component[1]
        );
      }
      await tx.exec(/*sql*/ `DELETE FROM selected_component`);
    });
  },

  deselectAllComponents(tx: TXAsync, slideId: IID_of<Slide>) {
    return tx.exec("DELETE FROM selected_component WHERE slide_id = ?", [
      slideId,
    ]);
  },

  async applyOperation(_tx: TXAsync, _op: Operation) {
    // get mutation from op.name
    // apply mutations from op.args and current ctx
    // TODO: could also look into the sqlite undo/redo as triggers design
  },

  addRecentColor(tx: TXAsync, color: string, id: IID_of<Theme>) {
    return tx.exec(
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

  persistMarkdownToSlide(tx: TXAsync, id: IID_of<Slide>, dom: string) {
    return tx.exec(
      `UPDATE markdown
        SET "content" = ?
        WHERE slide_id = ?`,
      [dom, id]
    );
  },

  // TODO: we need to cascade deletes to fk edges.
  // Can we do SQLite FK cascade w/o FK enforcement?
  removeSlide(
    tx: TXAsync,
    id: IID_of<Slide>,
    deckId: IID_of<Deck>,
    selected: boolean
  ) {
    // TODO: tx
    const deleteSlide = (tx: TXAsync) =>
      tx.exec(`DELETE FROM "slide" WHERE "id" = ?`, [id]);
    if (!selected) {
      return deleteSlide(tx);
    }

    return tx
      .execA<[IID_of<Slide>]>(
        /*sql*/ `WITH "cte" AS (
        SELECT "id", row_number() OVER (ORDER BY "order") as "rn" FROM "slide"
      ), "current" AS (
        SELECT "rn" FROM "cte"
        WHERE id = ${id}
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

        return tx.tx(async (tx) => {
          await tx.exec(
            `DELETE FROM "selected_slide" WHERE "slide_id" = ? AND deck_id = ?`,
            [id, deckId]
          );
          await tx.exec(
            `INSERT OR IGNORE INTO "selected_slide" ("deck_id", "slide_id") VALUES (?, ?)`,
            [deckId, select]
          );
          await deleteSlide(tx);
        });
      });
  },

  // TODO: TXAsync should include `siteid` to de-dupe these args
  addSlideAfter(
    db: DBAsync,
    tx: TXAsync,
    afterSlideId: IID_of<Slide> | null,
    id: IID_of<Deck>
  ) {
    // TODO: do this in a tx once we add tx support to wa-sqlite wrapper
    // doable in a single sql stmt?
    const slideId = objId<Slide>(db);
    const query = `INSERT INTO "slide_fractindex" ("id", "deck_id", "after_id", "created", "modified") VALUES (
      ${slideId},
      ${id},
      ${afterSlideId},
      ${Date.now()},
      ${Date.now()}
    );`;
    return tx.exec(query).then(() => slideId);
  },

  addText(db: DBAsync, tx: TXAsync, deckId: IID_of<Deck>) {
    const id = objId(db);
    return tx.exec(
      /*sql*/ `INSERT INTO text_component
      ("id", "slide_id", "x", "y")
      SELECT ${id}, "slide_id", ${
        ((Math.random() * config.slideWidth) / 2) | 0
      }, ${
        ((Math.random() * config.slideHeight) / 2) | 0
      } FROM selected_slide WHERE deck_id = ? ORDER BY rowid DESC LIMIT 1
    `,
      [deckId]
    );
  },

  addEmbed(db: DBAsync, tx: TXAsync, deckId: IID_of<Deck>, src: string) {
    const id = objId(db);
    return tx.exec(
      /*sql*/ `INSERT INTO embed_component
      ("id", "slide_id", "src", "x", "y")
      SELECT ${id}, "slide_id", ?, 0, 0 FROM selected_slide WHERE deck_id = ? ORDER BY rowid DESC LIMIT 1
    `,
      [src, deckId]
    );
  },

  // TODO: should be id rather than index based reordering in the future
  async reorderSlides(
    tx: TXAsync,
    deckId: IID_of<Deck>,
    fromId: IID_of<Slide>,
    toId: IID_of<Slide>,
    side: "after" | "before"
  ) {
    // if before, query for the slide before toId
    // then insert after that point
    let afterId;
    if (side === "before") {
      let result = (
        await tx.execA(
          /*sql */ `SELECT "id" FROM "slide"
          WHERE "deck_id" = ? AND "order" < (SELECT "order" FROM "slide" WHERE "id" = ?)
          ORDER BY "order" DESC LIMIT 1`,
          [deckId, toId]
        )
      )[0];
      if (result) {
        afterId = result[0];
      } else {
        afterId = null;
      }
    } else {
      afterId = toId;
    }

    console.log(afterId, fromId);
    await tx.exec(
      /*sql*/ `UPDATE "slide_fractindex" SET "after_id" = ? WHERE "id" = ?`,
      [afterId, fromId]
    );
  },

  setAllSlideColor(
    tx: TXAsync,
    id: IID_of<Theme> | undefined,
    c: string | undefined
  ) {
    if (!id) {
      return;
    }
    return tx.exec(`UPDATE theme SET slide_color = ? WHERE id = ?`, [
      c == null ? null : c,
      id,
    ]);
  },

  setAllSurfaceColor(
    tx: TXAsync,
    id: IID_of<Theme> | undefined,
    c: string | undefined
  ) {
    if (!id) {
      return;
    }
    return tx.exec(`UPDATE theme SET surface_color = ? WHERE id = ?`, [
      c == null ? null : c,
      id,
    ]);
  },

  setAllTextColor(
    tx: TXAsync,
    id: IID_of<Theme> | undefined,
    c: string | undefined
  ) {
    if (!id) {
      return;
    }
    return tx.exec(`UPDATE theme SET text_color = ? WHERE id = ?`, [
      c == null ? null : c,
      id,
    ]);
  },

  setAllFont(_tx: TXAsync, _id: IID_of<Theme>, _name: string) {},

  async genOrCreateCurrentDeck(db: DBAsync): Promise<IID_of<Deck>> {
    // go thru recent opens
    // open the most recent
    // if none exists, write one
    // return id of the thing

    const ids = await db.execA(
      `SELECT id FROM deck ORDER BY modified DESC LIMIT 1`
    );
    if (ids.length == 0) {
      // create
      const deckId = objId<Deck>(db);
      const slideId = objId<Slide>(db);
      await db.execMany([
        `INSERT INTO "deck" (
        "id",
        "title",
        "created",
        "modified",
        "theme_id",
        "chosen_presenter"
      ) VALUES (
        ${deckId},
        'First Deck',
        ${Date.now()},
        ${Date.now()},
        1,
        'impress'
      );`,
        `INSERT INTO "slide" ("id", "deck_id", "order", "created", "modified") VALUES (
        ${slideId},
        ${deckId},
        'a0',
        ${Date.now()},
        ${Date.now()}
      );`,
        `INSERT INTO "selected_slide" ("deck_id", "slide_id") VALUES (${deckId}, ${slideId})`,
      ]);

      return deckId;
    }

    return ids[0][0];
  },

  saveText(tx: TXAsync, markdown: string, compnentId: IID_of<TextComponent>) {
    return tx.exec(
      /* sql */ `UPDATE "text_component" SET "text" = ? WHERE "id" = ?`,
      [markdown, compnentId]
    );
  },

  saveDrag(
    tx: TXAsync,
    componentType:
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
    const table = componentType;
    return tx.exec(
      /* sql */ `UPDATE "${table}" SET "x" = ?, "y" = ? WHERE "id" = ?`,
      [((x * 100) | 0) / 100, ((y * 100) | 0) / 100, compnentId]
    );
  },
};

export default mutations;
