import { IID_of } from "../id";

export type Deck = StrutSchemaType["deck"];
export type Slide = StrutSchemaType["slide"];
export type TextComponent = StrutSchemaType["text_component"];
export type EmbedComponent = StrutSchemaType["embed_component"];
export type ShapeComponent = StrutSchemaType["shape_component"];
export type LineComponent = StrutSchemaType["line_component"];

// === custom code above this line ===
export type StrutSchemaType = {
  readonly deck: Readonly<{
    id: IID_of<StrutSchemaType["deck"]>;
    title: string | null;
    created: number | null;
    modified: number | null;
    theme_id: IID_of<StrutSchemaType["theme"]> | null;
    chosen_presenter: string | null
  }>;
  readonly slide: Readonly<{
    id: IID_of<StrutSchemaType["slide"]>;
    deck_id: IID_of<StrutSchemaType["deck"]> | null;
    order: string | null;
    created: number | null;
    modified: number | null;
    x: number | null;
    y: number | null;
    z: number | null
  }>;
  readonly text_component: Readonly<{
    id: IID_of<StrutSchemaType["text_component"]>;
    slide_id: IID_of<StrutSchemaType["slide"]> | null;
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
    id: number | null;
    slide_id: any | null;
    type: any | null;
    props: any | null;
    x: any | null;
    y: any | null
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
    id: IID_of<StrutSchemaType["theme"]>;
    name: string | null;
    bg_colorset: string | null;
    fg_colorset: string | null;
    fontset: string | null;
    surface_color: string | null;
    font_color: string | null
  }>;
  readonly recent_color: Readonly<{
    color: number | null;
    last_used: any | null;
    first_used: any | null;
    theme_id: any | null
  }>;
  readonly presenter: Readonly<{
    name: any | null;
    available_transitions: any | null;
    picked_transition: any | null
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
    deck_id: IID_of<Deck> | null;
    operation: any | null;
    order: any | null
  }>;
  readonly redo_stack: Readonly<{
    deck_id: IID_of<Deck> | null;
    operation: any | null;
    order: any | null
  }>
};