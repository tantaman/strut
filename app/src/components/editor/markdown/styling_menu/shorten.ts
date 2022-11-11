export default function shorten(n: string) {
  if (!n) {
    return "--";
  }
  if (n === "doc") {
    return "--";
  }
  return n.substr(0, 1).toUpperCase() + n.substr(-1);
}
