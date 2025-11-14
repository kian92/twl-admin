/**
 * Converts a string (e.g. title) into a clean SEO-friendly slug.
 * Removes special characters, trims spaces, and replaces them with hyphens.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") 
    .replace(/^-+|-+$/g, "")
}
