import { IID_of } from "../id";

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
  readonly theme: Readonly<{
    id: IID_of<StrutSchemaType["theme"]>;
    name: string | null;
    bg_colorset: string | null;
    fg_colorset: string | null;
    fontset: string | null;
    surface_color: string | null;
    font_color: string | null
  }>
};