import { Theme } from "./domain/schema";
import { IID_of } from "./id";

// 1280 x 720 instead?
// orig: 960 x 700
const config = {
  slideWidth: 1280,
  slideHeight: 720,
  defaultThemeId: 1n as IID_of<Theme>,
};

export default config;
