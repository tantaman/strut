export type Position = {
  top: number | undefined;
  left: number | undefined;
};

// export function getOffset(evt: MouseEvent) {
//   var el = evt.target,
//     x = 0,
//     y = 0;

//   while (el && !isNaN(el?.offsetLeft) && !isNaN(el?.offsetTop)) {
//     x += el.offsetLeft - el.scrollLeft;
//     y += el.offsetTop - el.scrollTop;
//     el = el.offsetParent;
//   }

//   x = evt.clientX - x;
//   y = evt.clientY - y;

//   return { x: x, y: y };
// }
