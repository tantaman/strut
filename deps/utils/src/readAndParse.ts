export default async function readAndParse<T>(
  file: File,
  def: T
): Promise<[T, Error | undefined]> {
  const content = await file.text();
  let parsed: T;
  let error: Error | undefined;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    error = e;
    parsed = def;
  }

  return [parsed, error];
}
