import { Model } from "@vlcn.io/model";
import { IID_of } from "../../id";
import { Theme } from "../schema";

export default class EphemeralTheme extends Model<Theme> {
  static defaultThemeId = 1n as IID_of<EphemeralTheme>;
  get id(): IID_of<Theme> {
    return this.data.id;
  }
  get name(): string | null {
    return this.data.name;
  }
  get bg_colorset(): string | null {
    return this.data.bg_colorset;
  }
  get fg_colorset(): string | null {
    return this.data.fg_colorset;
  }
  get fontset(): string | null {
    return this.data.fontset;
  }
  get surface_color(): string | null {
    return this.data.surface_color;
  }
  get slide_color(): string | null {
    return this.data.slide_color;
  }
  get font_color(): string | null {
    return this.data.font_color;
  }

  set<K extends keyof Theme>(k: K, v: Theme[K]): void {
    this.update({
      [k]: v,
    });
  }
}
