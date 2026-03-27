/**
 * lib/slug.ts
 *
 * Converts a human-readable string into a URL-safe slug.
 *
 * Steps:
 *  1. Lowercase the string
 *  2. Trim leading/trailing whitespace
 *  3. Remove characters that are not word chars, spaces, or hyphens
 *  4. Replace spaces and underscores with hyphens
 *  5. Strip leading/trailing hyphens
 *
 * Example: "Men's T-Shirt (XL)" → "mens-t-shirt-xl"
 */

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")   // remove special chars
    .replace(/[\s_-]+/g, "-")   // spaces/underscores → hyphens
    .replace(/^-+|-+$/g, "");   // strip leading/trailing hyphens
