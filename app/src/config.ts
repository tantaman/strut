import { Theme } from "./domain/schema";
import { ID_of } from "./id";

const config = {
  slideWidth: 960,
  slideHeight: 700,
  defaultThemeId: "1" as ID_of<Theme>,
};

export default config;
