/**
 * Fetch site content for a given page from the API.
 * Returns a nested { section: { key: value } } structure.
 * Falls back to empty object if fetch fails.
 *
 * @param {string} page - 'home' | 'student' | 'teacher' | 'global'
 * @returns {Promise<Record<string, Record<string, string>>>}
 */
export async function getPageContent(page) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/content/${page}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return {};
    const json = await res.json();
    return json.data || {};
  } catch {
    return {};
  }
}

/**
 * Get a single content value with a fallback default.
 *
 * @param {Record<string, Record<string, string>>} content - result of getPageContent()
 * @param {string} section
 * @param {string} key
 * @param {string} fallback
 * @returns {string}
 */
export function getContent(content, section, key, fallback = "") {
  return content?.[section]?.[key] ?? fallback;
}
