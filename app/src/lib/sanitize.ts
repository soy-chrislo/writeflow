import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
	"p",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"strong",
	"em",
	"u",
	"s",
	"a",
	"ul",
	"ol",
	"li",
	"code",
	"pre",
	"blockquote",
	"br",
];

const ALLOWED_ATTR = ["href", "target", "rel"];

export function sanitizeHTML(html: string): string {
	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS,
		ALLOWED_ATTR,
	});
}
