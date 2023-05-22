import de from "./de";
import en from "./en";
import es from "./es";
import fr from "./fr";
import nl from "./nl";
import ru from "./ru";
import zh from "./zh";

const langs = {
  de,
  en,
  es,
  fr,
  nl,
  ru,
  zh,
} as const;

const lang = window.navigator.language || (<any>window.navigator).userLanguage;
export default langs[lang.split("-")[0] as keyof typeof langs] || langs.en;
