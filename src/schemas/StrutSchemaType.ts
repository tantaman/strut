import { IID_of, Opaque } from "../id";

export type Deck = StrutSchemaType["deck"];
export type Slide = StrutSchemaType["slide"];
export type TextComponent = StrutSchemaType["text_component"];
export type EmbedComponent = StrutSchemaType["embed_component"];
export type ShapeComponent = StrutSchemaType["shape_component"];
export type LineComponent = StrutSchemaType["line_component"];
export type JsonSerialized<T> = Opaque<string, T>;
export type Theme = StrutSchemaType["theme"];

// === custom code above this line ===
export type StrutSchemaType = {
  readonly deck: Readonly<{
    id: IID_of<Deck>;
    title: string | null;
    created: number | null;
    modified: number | null;
    theme_id: IID_of<Theme> | null;
    chosen_presenter: string | null
  }>;
  readonly slide: Readonly<{
    id: IID_of<Slide>;
    deck_id: IID_of<Deck> | null;
    order: string | null;
    created: number | null;
    modified: number | null;
    x: number | null;
    y: number | null;
    z: number | null
  }>;
  readonly text_component: Readonly<{
    id: IID_of<TextComponent>;
    slide_id: IID_of<Slide> | null;
    text: string | null;
    styles: string | null;
    x: number | null;
    y: number | null
  }>;
  readonly embed_component: Readonly<{
    id: any | null;
    slide_id: any | null;
    src: any | null;
    x: any | null;
    y: any | null
  }>;
  readonly shape_component: Readonly<{
    id: IID_of<ShapeComponent> | null;
    slide_id: IID_of<Slide> | null;
    type: "rectangle" | "oval" | "line" | null;
    props: string | null;
    x: number | null;
    y: number | null
  }>;
  readonly line_component: Readonly<{
    id: any | null;
    slide_id: any | null;
    props: any | null
  }>;
  readonly line_point: Readonly<{
    id: any | null;
    line_id: any | null;
    x: any | null;
    y: any | null
  }>;
  readonly theme: Readonly<{
    id: IID_of<Theme>;
    name: string | null;
    bg_colorset: string | null;
    fg_colorset: string | null;
    fontset: string | null;
    surface_color: string | null;
    font_color: string | null
  }>;
  readonly recent_color: Readonly<{
    color: number | null;
    last_used: number | null;
    first_used: number | null;
    theme_id: IID_of<Theme> | null
  }>;
  readonly presenter: Readonly<{
    name: string;
    available_transitions: JsonSerialized<string[]> | null;
    picked_transition: string | null
  }>;
  readonly selected_slide: Readonly<{
    deck_id: IID_of<Deck> | null;
    slide_id: IID_of<Slide> | null
  }>;
  readonly selected_component: Readonly<{
    slide_id: IID_of<Slide>;
    component_id: IID_of<TextComponent>;
    component_type: "text" | "embed" | "shape" | "line" | null
  }>;
  readonly undo_stack: Readonly<{
    deck_id: IID_of<Deck>;
    operation: any | null;
    order: number
  }>;
  readonly redo_stack: Readonly<{
    deck_id: IID_of<Deck>;
    operation: any | null;
    order: number
  }>
};