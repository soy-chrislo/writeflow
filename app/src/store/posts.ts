import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { postsService } from "@/services/posts"
import { uploadService } from "@/services/upload"
import { ApiError } from "@/services/api"
import type {
	Post,
	PostWithContent,
	PostStatus,
} from "@/types/post"

interface CreatePostInput {
	title: string
	content: string
	status?: PostStatus
}

interface UpdatePostInput {
	title?: string
	content?: string
	status?: PostStatus
}

/**
 * Helper to generate a slug from a title
 */
function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "")
}

interface PostsState {
	// Posts list state
	posts: Post[]
	isLoading: boolean
	error: string | null
	nextToken?: string

	// Single post state
	currentPost: PostWithContent | null
	isLoadingPost: boolean
	isSaving: boolean
	isUploading: boolean
	postError: string | null

	// Actions
	fetchMyPosts: (params?: { status?: string; limit?: number; nextToken?: string }) => Promise<void>
	fetchPublicPosts: (params?: { limit?: number; nextToken?: string }) => Promise<void>
	loadMore: () => Promise<void>
	fetchPost: (slug: string) => Promise<PostWithContent>
	createPost: (input: CreatePostInput) => Promise<Post>
	updatePost: (slug: string, input: UpdatePostInput) => Promise<Post>
	deletePost: (slug: string) => Promise<void>
	publishPost: (slug: string) => Promise<Post>
	unpublishPost: (slug: string) => Promise<Post>
	clearCurrentPost: () => void
	clearError: () => void
}

export const usePostsStore = create<PostsState>()(
	devtools(
		(set, get) => ({
			// Initial state
			posts: [],
			isLoading: false,
			error: null,
			nextToken: undefined,
			currentPost: null,
			isLoadingPost: false,
			isSaving: false,
			isUploading: false,
			postError: null,

			// Fetch user's posts list
			fetchMyPosts: async (params) => {
				set({ isLoading: true, error: null })

				try {
					const response = await postsService.listMy(params)
					set((state) => ({
						posts: params?.nextToken
							? [...state.posts, ...response.data.posts]
							: response.data.posts,
						nextToken: response.data.nextToken,
						isLoading: false,
					}))
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to fetch posts"
					set({ error: message, isLoading: false })
					throw err
				}
			},

			// Fetch public posts list
			fetchPublicPosts: async (params) => {
				set({ isLoading: true, error: null })

				try {
					const response = await postsService.listPublic(params)
					set((state) => ({
						posts: params?.nextToken
							? [...state.posts, ...response.data.posts]
							: response.data.posts,
						nextToken: response.data.nextToken,
						isLoading: false,
					}))
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to fetch posts"
					set({ error: message, isLoading: false })
					throw err
				}
			},

			// Load more posts (pagination)
			loadMore: async () => {
				const { nextToken, fetchMyPosts } = get()
				if (nextToken) {
					await fetchMyPosts({ nextToken })
				}
			},

			// Fetch single post
			fetchPost: async (slug) => {
				set({ isLoadingPost: true, postError: null })

				try {
					const response = await postsService.getBySlug(slug)
					set({ currentPost: response.data, isLoadingPost: false })
					return response.data
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to fetch post"
					set({ postError: message, isLoadingPost: false })
					throw err
				}
			},

			// Create new post with content upload
			createPost: async (input) => {
				set({ isSaving: true, isUploading: true, postError: null })

				try {
					const slug = generateSlug(input.title)

					// Upload content to S3
					const { contentKey } = await uploadService.uploadPostContent(
						slug,
						input.content
					)

					set({ isUploading: false })

					// Create post with the contentKey
					const response = await postsService.create({
						title: input.title,
						contentKey,
						status: input.status,
					})

					set((state) => ({
						currentPost: { ...response.data, content: input.content },
						posts: [response.data, ...state.posts],
						isSaving: false,
					}))

					return response.data
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to create post"
					set({ postError: message, isSaving: false, isUploading: false })
					throw err
				}
			},

			// Update existing post with optional content upload
			updatePost: async (slug, input) => {
				set({ isSaving: true, postError: null })

				try {
					let contentKey: string | undefined

					// If content is provided, upload it first
					if (input.content) {
						set({ isUploading: true })
						const uploadResult = await uploadService.uploadPostContent(
							slug,
							input.content
						)
						contentKey = uploadResult.contentKey
						set({ isUploading: false })
					}

					// Update post
					const response = await postsService.update(slug, {
						title: input.title,
						contentKey,
						status: input.status,
					})

					set((state) => ({
						currentPost: input.content
							? { ...response.data, content: input.content }
							: state.currentPost
								? { ...state.currentPost, ...response.data }
								: null,
						posts: state.posts.map((p) =>
							p.slug === slug ? { ...p, ...response.data } : p
						),
						isSaving: false,
					}))

					return response.data
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to update post"
					set({ postError: message, isSaving: false, isUploading: false })
					throw err
				}
			},

			// Delete post
			deletePost: async (slug) => {
				set({ isSaving: true, postError: null })

				try {
					await postsService.delete(slug)
					set((state) => ({
						currentPost: state.currentPost?.slug === slug ? null : state.currentPost,
						posts: state.posts.filter((p) => p.slug !== slug),
						isSaving: false,
					}))
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to delete post"
					set({ postError: message, isSaving: false })
					throw err
				}
			},

			// Publish post (change status to published)
			publishPost: async (slug) => {
				set({ isSaving: true, postError: null })

				try {
					const response = await postsService.update(slug, { status: "published" })
					set((state) => ({
						currentPost: state.currentPost
							? { ...state.currentPost, ...response.data }
							: null,
						posts: state.posts.map((p) =>
							p.slug === slug ? { ...p, ...response.data } : p
						),
						isSaving: false,
					}))
					return response.data
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to publish post"
					set({ postError: message, isSaving: false })
					throw err
				}
			},

			// Unpublish post (change status to draft)
			unpublishPost: async (slug) => {
				set({ isSaving: true, postError: null })

				try {
					const response = await postsService.update(slug, { status: "draft" })
					set((state) => ({
						currentPost: state.currentPost
							? { ...state.currentPost, ...response.data }
							: null,
						posts: state.posts.map((p) =>
							p.slug === slug ? { ...p, ...response.data } : p
						),
						isSaving: false,
					}))
					return response.data
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to unpublish post"
					set({ postError: message, isSaving: false })
					throw err
				}
			},

			// Clear current post
			clearCurrentPost: () => set({ currentPost: null, postError: null }),

			// Clear errors
			clearError: () => set({ error: null, postError: null }),
		}),
		{ name: "posts-store" }
	)
)
