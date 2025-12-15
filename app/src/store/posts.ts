import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { generateSlug } from "@/lib/posts";
import { ApiError } from "@/services/api";
import { postsService } from "@/services/posts";
import { uploadService } from "@/services/upload";
import type { Post, PostStatus, PostWithContent } from "@/types/post";

interface CreatePostInput {
	title: string;
	content: string;
	status?: PostStatus;
}

interface UpdatePostInput {
	title?: string;
	content?: string;
	status?: PostStatus;
}

interface PostsState {
	// Posts list state
	posts: Post[];
	isLoading: boolean;
	error: string | null;
	nextToken?: string;

	// Single post state
	currentPost: PostWithContent | null;
	isLoadingPost: boolean;
	isSaving: boolean;
	isUploading: boolean;
	postError: string | null;

	// Actions
	fetchMyPosts: (params?: {
		status?: string;
		limit?: number;
		nextToken?: string;
	}) => Promise<void>;
	fetchPublicPosts: (params?: {
		limit?: number;
		nextToken?: string;
	}) => Promise<void>;
	loadMore: (params?: { status?: string }) => Promise<void>;
	removePost: (slug: string) => void;
	restorePost: (post: Post) => void;
	fetchPost: (slug: string) => Promise<PostWithContent>;
	fetchMyPost: (slug: string) => Promise<PostWithContent>;
	createPost: (input: CreatePostInput) => Promise<Post>;
	updatePost: (slug: string, input: UpdatePostInput) => Promise<Post>;
	deletePost: (slug: string) => Promise<void>;
	publishPost: (slug: string) => Promise<Post>;
	unpublishPost: (slug: string) => Promise<Post>;
	setCurrentPost: (post: PostWithContent) => void;
	clearCurrentPost: () => void;
	clearError: () => void;
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
				set({ isLoading: true, error: null });

				try {
					const response = await postsService.listMy(params);
					set((state) => ({
						posts: params?.nextToken
							? [...state.posts, ...response.posts]
							: response.posts,
						nextToken: response.nextToken,
						isLoading: false,
					}));
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to fetch posts";
					set({ error: message, isLoading: false });
					throw err;
				}
			},

			// Fetch public posts list
			fetchPublicPosts: async (params) => {
				set({ isLoading: true, error: null });

				try {
					const response = await postsService.listPublic(params);
					set((state) => ({
						posts: params?.nextToken
							? [...state.posts, ...response.posts]
							: response.posts,
						nextToken: response.nextToken,
						isLoading: false,
					}));
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to fetch posts";
					set({ error: message, isLoading: false });
					throw err;
				}
			},

			// Load more posts (pagination)
			loadMore: async (params) => {
				const { nextToken, fetchMyPosts } = get();
				if (nextToken) {
					await fetchMyPosts({ nextToken, status: params?.status });
				}
			},

			// Remove post from list optimistically
			removePost: (slug) => {
				set((state) => ({
					posts: state.posts.filter((p) => p.slug !== slug),
				}));
			},

			// Restore post to list (when optimistic delete fails)
			restorePost: (post) => {
				set((state) => ({
					posts: [post, ...state.posts].sort(
						(a, b) =>
							new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
					),
				}));
			},

			// Fetch single public post
			fetchPost: async (slug) => {
				set({ isLoadingPost: true, postError: null });

				try {
					const response = await postsService.getBySlug(slug);
					set({ currentPost: response, isLoadingPost: false });
					return response;
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to fetch post";
					set({ postError: message, isLoadingPost: false });
					throw err;
				}
			},

			// Fetch authenticated user's post (includes drafts)
			fetchMyPost: async (slug) => {
				set({ isLoadingPost: true, postError: null });

				try {
					const response = await postsService.getMyBySlug(slug);
					set({ currentPost: response, isLoadingPost: false });
					return response;
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to fetch post";
					set({ postError: message, isLoadingPost: false });
					throw err;
				}
			},

			// Create new post with content upload
			createPost: async (input) => {
				set({ isSaving: true, isUploading: true, postError: null });

				try {
					const slug = generateSlug(input.title);

					// Upload content to S3
					const { contentKey } = await uploadService.uploadPostContent(
						slug,
						input.content,
					);

					set({ isUploading: false });

					// Create post with the contentKey
					const response = await postsService.create({
						title: input.title,
						contentKey,
						status: input.status,
					});

					set((state) => ({
						currentPost: { ...response, content: input.content },
						posts: [response, ...state.posts],
						isSaving: false,
					}));

					return response;
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to create post";
					set({ postError: message, isSaving: false, isUploading: false });
					throw err;
				}
			},

			// Update existing post with optional content upload
			updatePost: async (slug, input) => {
				set({ isSaving: true, postError: null });

				try {
					let contentKey: string | undefined;

					// If content is provided, upload it first
					if (input.content) {
						set({ isUploading: true });
						const uploadResult = await uploadService.uploadPostContent(
							slug,
							input.content,
						);
						contentKey = uploadResult.contentKey;
						set({ isUploading: false });
					}

					// Update post
					const response = await postsService.update(slug, {
						title: input.title,
						contentKey,
						status: input.status,
					});

					set((state) => ({
						currentPost: input.content
							? { ...response, content: input.content }
							: state.currentPost
								? { ...state.currentPost, ...response }
								: null,
						posts: state.posts.map((p) =>
							p.slug === slug ? { ...p, ...response } : p,
						),
						isSaving: false,
					}));

					return response;
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to update post";
					set({ postError: message, isSaving: false, isUploading: false });
					throw err;
				}
			},

			// Delete post
			deletePost: async (slug) => {
				set({ isSaving: true, postError: null });

				try {
					await postsService.delete(slug);
					set((state) => ({
						currentPost:
							state.currentPost?.slug === slug ? null : state.currentPost,
						posts: state.posts.filter((p) => p.slug !== slug),
						isSaving: false,
					}));
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to delete post";
					set({ postError: message, isSaving: false });
					throw err;
				}
			},

			// Publish post (change status to published)
			publishPost: async (slug) => {
				set({ isSaving: true, postError: null });

				try {
					const response = await postsService.update(slug, {
						status: "published",
					});
					set((state) => ({
						currentPost: state.currentPost
							? { ...state.currentPost, ...response }
							: null,
						posts: state.posts.map((p) =>
							p.slug === slug ? { ...p, ...response } : p,
						),
						isSaving: false,
					}));
					return response;
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to publish post";
					set({ postError: message, isSaving: false });
					throw err;
				}
			},

			// Unpublish post (change status to draft)
			unpublishPost: async (slug) => {
				set({ isSaving: true, postError: null });

				try {
					const response = await postsService.update(slug, { status: "draft" });
					set((state) => ({
						currentPost: state.currentPost
							? { ...state.currentPost, ...response }
							: null,
						posts: state.posts.map((p) =>
							p.slug === slug ? { ...p, ...response } : p,
						),
						isSaving: false,
					}));
					return response;
				} catch (err) {
					const message =
						err instanceof ApiError ? err.message : "Failed to unpublish post";
					set({ postError: message, isSaving: false });
					throw err;
				}
			},

			// Set current post directly (useful for navigation with pre-loaded data)
			setCurrentPost: (post) =>
				set({ currentPost: post, isLoadingPost: false, postError: null }),

			// Clear current post
			clearCurrentPost: () => set({ currentPost: null, postError: null }),

			// Clear errors
			clearError: () => set({ error: null, postError: null }),
		}),
		{ name: "posts-store" },
	),
);
