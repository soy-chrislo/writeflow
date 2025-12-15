/**
 * Post domain utilities
 */

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/**
 * Empty TipTap editor content
 */
export const EMPTY_EDITOR_CONTENT = "<p></p>";
