import { EditorContent, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";
import { sanitizeHTML } from "@/lib/sanitize";
import { extensions } from "./extensions";
import Preview from "./Preview";
import Toolbar from "./Toolbar";

const DEFAULT_CONTENT = "<p></p>";

export interface EditorRef {
	getContent: () => string;
	getSanitizedContent: () => string;
}

interface EditorProps {
	/** Initial HTML content to load in the editor */
	initialContent?: string;
	/** Callback when content changes */
	onContentChange?: (content: string, sanitizedContent: string) => void;
	/** Placeholder text when editor is empty */
	placeholder?: string;
	/** Whether the editor is read-only */
	readOnly?: boolean;
	/** Whether to show the preview panel */
	showPreview?: boolean;
	/** Whether to show the debug panel */
	showDebug?: boolean;
}

const Editor = ({
	initialContent,
	onContentChange,
	placeholder: _placeholder,
	readOnly = false,
	showPreview = true,
	showDebug = false,
}: EditorProps) => {
	const startingContent = initialContent || DEFAULT_CONTENT;
	const [content, setContent] = useState(startingContent);
	const [, forceUpdate] = useState(0);

	const handleSelectionUpdate = useCallback(() => {
		forceUpdate((n) => n + 1);
	}, []);

	const editor = useEditor({
		extensions,
		content: startingContent,
		autofocus: !readOnly,
		editable: !readOnly,
		editorProps: {
			attributes: {
				class: "content-body outline-none min-h-[400px] p-4",
			},
		},
		onUpdate: ({ editor }) => {
			const rawHTML = editor.getHTML();
			const sanitized = sanitizeHTML(rawHTML);
			setContent(rawHTML);
			onContentChange?.(rawHTML, sanitized);
		},
		onSelectionUpdate: handleSelectionUpdate,
		onTransaction: handleSelectionUpdate,
	});

	// Update editor content when initialContent changes (for edit mode)
	useEffect(() => {
		if (editor && initialContent && editor.getHTML() !== initialContent) {
			editor.commands.setContent(initialContent);
			setContent(initialContent);
		}
	}, [editor, initialContent]);

	const getSanitizedContent = useCallback(() => {
		return sanitizeHTML(content);
	}, [content]);

	return (
		<div className="flex flex-col gap-4">
			<div
				className={`grid gap-4 h-[600px] ${showPreview ? "grid-cols-2" : "grid-cols-1"}`}
			>
				{/* Editor */}
				<div className="border border-border rounded-lg overflow-hidden flex flex-col">
					{!readOnly && <Toolbar editor={editor} />}
					<div className="flex-1 overflow-auto">
						<EditorContent editor={editor} />
					</div>
				</div>

				{/* Preview */}
				{showPreview && (
					<div className="border border-border rounded-lg overflow-hidden">
						<Preview content={content} />
					</div>
				)}
			</div>

			{/* Debug: Show sanitized output */}
			{showDebug && (
				<details className="text-sm">
					<summary className="cursor-pointer text-muted-foreground hover:text-foreground">
						View sanitized HTML (for API)
					</summary>
					<pre className="mt-2 p-4 bg-muted rounded-lg overflow-auto max-h-[200px] text-xs">
						{getSanitizedContent()}
					</pre>
				</details>
			)}
		</div>
	);
};

export default Editor;
