// Ephemeral visual references used by AI theme turns. Kept shared so the picker and the server enforce the
// same inexpensive raster subset and byte/count ceilings.
export const STYLE_REFERENCE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const MAX_STYLE_REFERENCES = 5
// Low-detail style analysis does not benefit from camera-sized originals. Keeping the aggregate at 8 MiB
// leaves practical room for two ordinary phone photos (or several screenshots) while bounding the server's
// multipart → byte arrays → base64 → JSON memory amplification in a Workers isolate.
export const MAX_STYLE_REFERENCE_BYTES = 4 * 1024 * 1024
export const MAX_STYLE_REFERENCES_TOTAL_BYTES = 8 * 1024 * 1024
