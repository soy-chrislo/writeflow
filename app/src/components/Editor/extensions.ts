import Document from "@tiptap/extension-document"
import Paragraph from "@tiptap/extension-paragraph"
import Text from "@tiptap/extension-text"
import Bold from "@tiptap/extension-bold"
import Italic from "@tiptap/extension-italic"
import Underline from "@tiptap/extension-underline"
import Strike from "@tiptap/extension-strike"
import Heading from "@tiptap/extension-heading"
import BulletList from "@tiptap/extension-bullet-list"
import OrderedList from "@tiptap/extension-ordered-list"
import ListItem from "@tiptap/extension-list-item"
import Link from "@tiptap/extension-link"
import Code from "@tiptap/extension-code"
import CodeBlock from "@tiptap/extension-code-block"
import Blockquote from "@tiptap/extension-blockquote"
import HardBreak from "@tiptap/extension-hard-break"
import History from "@tiptap/extension-history"

export const extensions = [
	Document,
	Paragraph,
	Text,
	Bold,
	Italic,
	Underline,
	Strike,
	Heading.configure({
		levels: [1, 2, 3, 4, 5, 6],
	}),
	BulletList,
	OrderedList,
	ListItem,
	Link.configure({
		openOnClick: false,
		HTMLAttributes: {
			rel: "noopener noreferrer",
			target: "_blank",
		},
	}),
	Code,
	CodeBlock,
	Blockquote,
	HardBreak,
	History,
]
