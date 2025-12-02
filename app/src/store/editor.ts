import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface EditorState {
	// Editor content
	content: string
	sanitizedContent: string
	isDirty: boolean

	// Post metadata
	title: string
	slug: string | null

	// Actions
	setContent: (content: string, sanitizedContent: string) => void
	setTitle: (title: string) => void
	setSlug: (slug: string | null) => void
	resetEditor: () => void
	markClean: () => void
}

const initialState = {
	content: "",
	sanitizedContent: "",
	isDirty: false,
	title: "",
	slug: null,
}

export const useEditorStore = create<EditorState>()(
	devtools(
		(set) => ({
			...initialState,

			setContent: (content, sanitizedContent) =>
				set({ content, sanitizedContent, isDirty: true }),

			setTitle: (title) => set({ title, isDirty: true }),

			setSlug: (slug) => set({ slug }),

			resetEditor: () => set(initialState),

			markClean: () => set({ isDirty: false }),
		}),
		{ name: "editor-store" }
	)
)
