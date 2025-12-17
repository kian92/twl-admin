/**
 * Converts a string (e.g. title) into a clean SEO-friendly slug.
 * Supports Chinese, Japanese, Korean, and other unicode characters.
 * Removes special characters, trims spaces, and replaces them with hyphens.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and special punctuation with hyphens
    .replace(/[\s\.,!?;:'"(){}[\]\/\\|<>@#$%^&*+=~`]+/g, "-")
    // Keep alphanumeric characters, hyphens, and CJK characters (Chinese, Japanese, Korean)
    .replace(/[^\w\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\-]/g, "")
    // Clean up multiple consecutive hyphens
    .replace(/-+/g, "-")
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, "")
}
