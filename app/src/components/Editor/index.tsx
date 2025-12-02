import { useState, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import { extensions } from "./extensions"
import { sanitizeHTML } from "@/lib/sanitize"
import Toolbar from "./Toolbar"
import Preview from "./Preview"

const INITIAL_CONTENT = `
<h1>Welcome to Writeflow</h1>
<p>This is a <strong>rich text editor</strong> with live preview. Try out the formatting options:</p>

<h2>Text Formatting</h2>
<p>You can make text <strong>bold</strong>, <em>italic</em>, <u>underlined</u>, or <s>strikethrough</s>.</p>

<h3>Headings</h3>
<p>Use H1 through H6 for document structure.</p>

<h4>Lists</h4>
<ul>
  <li>Bullet point one</li>
  <li>Bullet point two</li>
</ul>

<ol>
  <li>Numbered item one</li>
  <li>Numbered item two</li>
</ol>

<h5>Code</h5>
<p>Inline <code>code</code> or code blocks:</p>
<pre><code>const greeting = "Hello, World!"
console.log(greeting)</code></pre>

<h6>Blockquotes</h6>
<blockquote>This is a blockquote. Use it for citations or emphasis.</blockquote>

<p>You can also add <a href="https://example.com">links</a> to your content.</p>
`

export interface EditorRef {
	getContent: () => string
	getSanitizedContent: () => string
}

interface EditorProps {
	onContentChange?: (content: string, sanitizedContent: string) => void
}

const Editor = ({ onContentChange }: EditorProps) => {
	const [content, setContent] = useState(INITIAL_CONTENT)
	const [, forceUpdate] = useState(0)

	const handleSelectionUpdate = useCallback(() => {
		forceUpdate((n) => n + 1)
	}, [])

	const editor = useEditor({
		extensions,
		content: INITIAL_CONTENT,
		autofocus: true,
		editorProps: {
			attributes: {
				class: "content-body outline-none min-h-[400px] p-4",
			},
		},
		onUpdate: ({ editor }) => {
			const rawHTML = editor.getHTML()
			const sanitized = sanitizeHTML(rawHTML)
			setContent(rawHTML)
			onContentChange?.(rawHTML, sanitized)
		},
		onSelectionUpdate: handleSelectionUpdate,
		onTransaction: handleSelectionUpdate,
	})

	const getSanitizedContent = useCallback(() => {
		return sanitizeHTML(content)
	}, [content])

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-2 gap-4 h-[600px]">
				{/* Editor */}
				<div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col">
					<Toolbar editor={editor} />
					<div className="flex-1 overflow-auto">
						<EditorContent editor={editor} />
					</div>
				</div>

				{/* Preview */}
				<div className="border border-gray-300 rounded-lg overflow-hidden">
					<Preview content={content} />
				</div>
			</div>

			{/* Debug: Show sanitized output */}
			<details className="text-sm">
				<summary className="cursor-pointer text-gray-500 hover:text-gray-700">
					View sanitized HTML (for API)
				</summary>
				<pre className="mt-2 p-4 bg-gray-100 rounded-lg overflow-auto max-h-[200px] text-xs">
					{getSanitizedContent()}
				</pre>
			</details>
		</div>
	)
}

export default Editor
