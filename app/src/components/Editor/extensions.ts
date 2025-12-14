import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import History from "@tiptap/extension-history";
import Italic from "@tiptap/extension-italic";
import Link from "@tiptap/extension-link";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Strike from "@tiptap/extension-strike";
import Text from "@tiptap/extension-text";
import Underline from "@tiptap/extension-underline";

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
];
