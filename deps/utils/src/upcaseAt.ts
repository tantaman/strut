export default function upcaseAt(str: string, i: number) {
  return str.substr(0, i) + str.substr(i, 1).toUpperCase() + str.substr(i + 1);
}

export function lowercaseAt(str: string, i: number) {
  return str.substring(0, i) + str.substring(i, 1).toLowerCase() + str.substring(i + 1);
}
