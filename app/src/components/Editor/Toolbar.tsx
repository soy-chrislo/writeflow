import { useCallback } from "react"
import type { Editor } from "@tiptap/react"
import type { Level } from "@tiptap/extension-heading"

interface ToolbarProps {
	editor: Editor | null
}

interface ToolbarButtonProps {
	onClick: () => void
	isActive?: boolean
	disabled?: boolean
	children: React.ReactNode
	title: string
}

const ToolbarButton = ({
	onClick,
	isActive,
	disabled,
	children,
	title,
}: ToolbarButtonProps) => (
	<button
		type="button"
		onClick={onClick}
		disabled={disabled}
		title={title}
		className={`px-2 py-1 rounded text-sm font-medium transition-colors
      ${isActive ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}
      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
    `}
	>
		{children}
	</button>
)

const ToolbarDivider = () => <div className="w-px h-6 bg-gray-300 mx-1" />

const Toolbar = ({ editor }: ToolbarProps) => {
	const setLink = useCallback(() => {
		if (!editor) return

		const previousUrl = editor.getAttributes("link").href
		const url = window.prompt("URL", previousUrl)

		if (url === null) return

		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run()
			return
		}

		editor
			.chain()
			.focus()
			.extendMarkRange("link")
			.setLink({ href: url })
			.run()
	}, [editor])

	const toggleHeading = useCallback(
		(level: Level) => {
			if (!editor) return
			editor.chain().focus().toggleHeading({ level }).run()
		},
		[editor]
	)

	if (!editor) return null

	return (
		<div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-300 bg-gray-50">
			{/* Text formatting */}
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBold().run()}
				isActive={editor.isActive("bold")}
				title="Bold (Ctrl+B)"
			>
				B
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleItalic().run()}
				isActive={editor.isActive("italic")}
				title="Italic (Ctrl+I)"
			>
				I
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleUnderline().run()}
				isActive={editor.isActive("underline")}
				title="Underline (Ctrl+U)"
			>
				U
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleStrike().run()}
				isActive={editor.isActive("strike")}
				title="Strikethrough"
			>
				S̶
			</ToolbarButton>

			<ToolbarDivider />

			{/* Headings H1-H6 */}
			{([1, 2, 3, 4, 5, 6] as Level[]).map((level) => (
				<ToolbarButton
					key={level}
					onClick={() => toggleHeading(level)}
					isActive={editor.isActive("heading", { level })}
					title={`Heading ${level}`}
				>
					H{level}
				</ToolbarButton>
			))}

			<ToolbarDivider />

			{/* Lists */}
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBulletList().run()}
				isActive={editor.isActive("bulletList")}
				title="Bullet List"
			>
				&#8226;
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
				isActive={editor.isActive("orderedList")}
				title="Numbered List"
			>
				1.
			</ToolbarButton>

			<ToolbarDivider />

			{/* Block elements */}
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBlockquote().run()}
				isActive={editor.isActive("blockquote")}
				title="Blockquote"
			>
				&#8220;
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleCode().run()}
				isActive={editor.isActive("code")}
				title="Inline Code"
			>
				{"</>"}
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleCodeBlock().run()}
				isActive={editor.isActive("codeBlock")}
				title="Code Block"
			>
				{"{ }"}
			</ToolbarButton>

			<ToolbarDivider />

			{/* Link */}
			<ToolbarButton
				onClick={setLink}
				isActive={editor.isActive("link")}
				title="Add Link"
			>
				&#128279;
			</ToolbarButton>

			<ToolbarDivider />

			{/* History */}
			<ToolbarButton
				onClick={() => editor.chain().focus().undo().run()}
				disabled={!editor.can().undo()}
				title="Undo (Ctrl+Z)"
			>
				&#8617;
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().redo().run()}
				disabled={!editor.can().redo()}
				title="Redo (Ctrl+Y)"
			>
				&#8618;
			</ToolbarButton>
		</div>
	)
}

export default Toolbar
