import { IID_of } from "../id";
import { StrutSchema as S } from "../schemas/StrutSchema";
import {
  AnyComponentID,
  ComponentType,
  EmbedComponent,
  JsonSerialized,
  ShapeComponent,
  Slide,
  TextComponent,
  Theme,
} from "./schema";

export const queries = {
  canUndo: S.sql<{
    exists: 1;
  }>`SELECT 1 as "exists" FROM undo_stack WHERE deck_id = ? LIMIT 1`,

  canRedo: S.sql<{
    exists: 1;
  }>`SELECT 1 as "exists" FROM redo_stack WHERE deck_id = ? LIMIT 1`,

  slideIds: S.sql<{
    id: IID_of<Slide>;
  }>`SELECT id FROM slide WHERE deck_id = ? ORDER BY "order" ASC`,

  firstSlideId: S.sql<{
    id: IID_of<Slide>;
  }>`SELECT id FROM slide WHERE deck_id = ? ORDER BY "order" ASC LIMIT 1`,

  chosenPresenter: S.sql<{
    name: string;
    available_transitions: JsonSerialized<string[]> | null;
    picked_transition: string | null;
  }>`SELECT presenter.* FROM presenter JOIN deck ON deck.chosen_presenter = presenter.name WHERE deck.id = ?`,

  selectedSlideIds: S.sql<{
    slide_id: IID_of<Slide> | null;
  }>`SELECT slide_id FROM selected_slide WHERE deck_id = ?`,

  selectedComponentIds: S.sql<{
    component_id: AnyComponentID;
    component_type: ComponentType | null;
  }>`SELECT component_id, component_type FROM selected_component WHERE slide_id = ? ORDER BY component_id ASC`,

  mostRecentlySelectedSlide: S.sql<{
    slide_id: IID_of<Slide> | null;
  }>`SELECT slide_id FROM selected_slide WHERE deck_id = ? ORDER BY rowid DESC LIMIT 1`,

  recentColors: S.sql<{
    color: number | null;
  }>`SELECT color FROM recent_color WHERE theme_id = ?`,

  theme: S.sql<{
    id: IID_of<Theme>;
    name: string | null;
    bg_colorset: string | null;
    fg_colorset: string | null;
    fontset: string | null;
    surface_color: string | null;
    slide_color: string | null;
    font_color: string | null;
  }>`SELECT * FROM theme WHERE id = ?`,

  themeFromDeck: S.sql<{
    id: IID_of<Theme>;
    name: string | null;
    bg_colorset: string | null;
    fg_colorset: string | null;
    fontset: string | null;
    surface_color: string | null;
    slide_color: string | null;
    font_color: string | null;
  }>`SELECT theme.* FROM theme JOIN deck ON theme.id = deck.theme_id WHERE deck.id = ?`,

  themeIdFromDeck: S.sql<{
    theme_id: IID_of<Theme> | null;
  }>`SELECT theme_id FROM deck WHERE id = ?`,

  // TODO: union should generate union type on component_type!!
  componentIds: S.sql<{
    id: IID_of<TextComponent>;
    component_type: "TextComponent";
  }>`SELECT id, 'TextComponent' as component_type FROM text_component WHERE slide_id = ?
      UNION
    SELECT id, 'ShapeComponent' as component_type FROM shape_component WHERE slide_id = ?
      UNION
    SELECT id, 'EmbedComponent' as component_type FROM embed_component WHERE slide_id = ?`,

  textComponentsForSlide: S.sql<{
    id: IID_of<TextComponent>;
    slide_id: IID_of<Slide> | null;
    text: string | null;
    styles: string | null;
    x: number | null;
    y: number | null;
  }>`SELECT * FROM text_component WHERE slide_id = ?`,

  embedComponentsForSlide: S.sql<{
    id: IID_of<EmbedComponent>;
    slide_id: IID_of<Slide> | null;
    src: any | null;
    x: any | null;
    y: any | null;
  }>`SELECT * FROM embed_component WHERE slide_id = ?`,

  shapeComponentsForSlide: S.sql<{
    id: IID_of<ShapeComponent>;
    slide_id: IID_of<Slide> | null;
    type: "rectangle" | "ellipse" | "triangle" | "ngon" | "line" | null;
    props: string | null;
    x: number | null;
    y: number | null;
  }>`SELECT * FROM shape_component WHERE slide_id = ?`,

  textComponent: S.sql<{
    id: IID_of<TextComponent>;
    slide_id: IID_of<Slide> | null;
    text: string | null;
    styles: string | null;
    x: number | null;
    y: number | null;
  }>`SELECT * FROM text_component WHERE id = ?`,

  embedComponent: S.sql<{
    id: IID_of<EmbedComponent>;
    slide_id: IID_of<Slide> | null;
    src: any | null;
    x: any | null;
    y: any | null;
  }>`SELECT * FROM embed_component WHERE id = ?`,

  shapeComponent: S.sql<{
    id: IID_of<ShapeComponent>;
    slide_id: IID_of<Slide> | null;
    type: "rectangle" | "ellipse" | "triangle" | "ngon" | "line" | null;
    props: string | null;
    x: number | null;
    y: number | null;
  }>`SELECT * FROM shape_component WHERE id = ?`,
} as const;
