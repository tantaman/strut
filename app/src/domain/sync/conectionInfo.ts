export function getConnString() {
  if (import.meta.env.DEV) {
    return `ws://${window.location.hostname}:8080/sync`;
  } else {
    return `wss://${window.location.hostname}/sync`;
  }
}

export function getRestHost() {
  if (import.meta.env.DEV) {
    return `http://${window.location.hostname}:8080/`;
  } else {
    return `https://${window.location.hostname}/`;
  }
}
