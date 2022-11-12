// import Deck from "./Deck";
// import Drawing from "./Drawing";
// import rough from "roughjs/bin/rough";
// import { renderSceneToSvg } from "../../../../git_modules/excalidraw/src/renderer/renderScene";

// export function renderToSVG(deck: Deck, drawing: Drawing): SVGSVGElement {
//   const svgRoot = document.createElementNS("http://www.w3.org/2000/svg", "svg");
//   svgRoot.setAttribute("version", "1.1");
//   svgRoot.setAttribute("xmlns", "http://www.w3.org/2000/svg");
//   svgRoot.setAttribute(
//     "viewBox",
//     `0 0 ${deck.config.slideWidth} ${deck.config.slideHeight}`
//   );
//   svgRoot.setAttribute("width", `${deck.config.slideWidth}`);
//   svgRoot.setAttribute("height", `${deck.config.slideHeight}`);

//   const rsvg = rough.svg(svgRoot);
//   renderSceneToSvg(
//     drawing.elements,
//     rsvg,
//     svgRoot,
//     {},
//     {
//       offsetX: 0,
//       offsetY: 0,
//       exportWithDarkMode: false,
//     }
//   );

//   return svgRoot;
// }
