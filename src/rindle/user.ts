// A stable per-browser "user" id. Auth/ownership is future work; for now this just gives the API
// server a non-empty principal (and the Rindle client a stable identity).

const KEY = "strut.user";

export function currentUser(): string {
  if (typeof localStorage === "undefined") return "anon";
  let u = localStorage.getItem(KEY);
  if (!u) {
    u = `u-${crypto.randomUUID()}`;
    localStorage.setItem(KEY, u);
  }
  return u;
}
