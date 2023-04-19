import * as fs from "fs";

export function readResourceFile(
  path: string,
  dist = "dist",
  src = "src"
): string {
  const ourDir = __dirname;
  const resourcePath =
    ourDir.replace("/" + dist + "/", "/" + src + "/") + "/" + path;

  return fs.readFileSync(resourcePath, { encoding: "utf8", flag: "r" });
}
