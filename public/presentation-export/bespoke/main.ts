import bespoke from "./bespoke.min";
import demo from "./demo";

import "../../styles/bootstrap.css";
import "./style.css";
import "./themes.css";
import "../../styles/markdown/markdown-reset.css";
import "../../styles/markdown/colors/hook.css";
import "../../styles/markdown/fonts/fonts.css";

window.addEventListener("message", (e) => {
  // TODO: origin check
  if (e.data.source !== "srt-app") {
    return;
  }
  switch (e.data.event) {
    case "launchPresentation":
      launchPresentation(e.data.content);
  }
});

window.opener.postMessage(
  {
    source: "strt-presentation",
    event: "read",
  },
  "*"
);

function launchPresentation(content: string) {
  document.body.innerHTML = content;
  demo(bespoke);
}
