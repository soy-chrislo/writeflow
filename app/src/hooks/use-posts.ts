import { useCallback, useState } from "react";
import { ApiError } from "@/services/api";
import { postsService } from "@/services/posts";
import { uploadService } from "@/services/upload";
import type { Post, PostStatus, PostWithContent } from "@/types/post";

interface UsePostsState {
	posts: Post[];
	isLoading: boolean;
	error: string | null;
	nextToken?: string;
}

export function usePosts() {
	const [state, setState] = useState<UsePostsState>({
		posts: [],
		isLoading: false,
		error: null,
	});

	const fetchMyPosts = useCallback(
		async (params?: {
			status?: string;
			limit?: number;
			nextToken?: string;
		}) => {
			setState((prev) => ({ ...prev, isLoading: true, error: null }));

			try {
				const response = await postsService.listMy(params);
				setState((prev) => ({
					...prev,
					posts: params?.nextToken
						? [...prev.posts, ...response.posts]
						: response.posts,
					nextToken: response.nextToken,
					isLoading: false,
				}));
				return response;
			} catch (err) {
				const message =
					err instanceof ApiError ? err.message : "Failed to fetch posts";
				setState((prev) => ({ ...prev, error: message, isLoading: false }));
				throw err;
			}
		},
		[],
	);

	const fetchPublicPosts = useCallback(
		async (params?: { limit?: number; nextToken?: string }) => {
			setState((prev) => ({ ...prev, isLoading: true, error: null }));

			try {
				const response = await postsService.listPublic(params);
				setState((prev) => ({
					...prev,
					posts: params?.nextToken
						? [...prev.posts, ...response.posts]
						: response.posts,
					nextToken: response.nextToken,
					isLoading: false,
				}));
				return response;
			} catch (err) {
				const message =
					err instanceof ApiError ? err.message : "Failed to fetch posts";
				setState((prev) => ({ ...prev, error: message, isLoading: false }));
				throw err;
			}
		},
		[],
	);

	const loadMore = useCallback(
		async (params?: { status?: string }) => {
			if (state.nextToken) {
				await fetchMyPosts({
					nextToken: state.nextToken,
					status: params?.status,
				});
			}
		},
		[state.nextToken, fetchMyPosts],
	);

	return {
		...state,
		fetchMyPosts,
		fetchPublicPosts,
		loadMore,
		hasMore: !!state.nextToken,
	};
}

interface UsePostState {
	post: PostWithContent | null;
	isLoading: boolean;
	isSaving: boolean;
	isUploading: boolean;
	error: string | null;
}

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

/**
 * Helper to generate a slug from a title
 */
function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function usePost(_slug?: string) {
	const [state, setState] = useState<UsePostState>({
		post: null,
		isLoading: false,
		isSaving: false,
		isUploading: false,
		error: null,
	});

	/**
	 * Fetch a public post by slug (for viewing)
	 */
	const fetchPost = useCallback(async (postSlug: string) => {
		setState((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			const response = await postsService.getBySlug(postSlug);
			setState((prev) => ({
				...prev,
				post: response,
				isLoading: false,
			}));
			return response;
		} catch (err) {
			const message =
				err instanceof ApiError ? err.message : "Failed to fetch post";
			setState((prev) => ({ ...prev, error: message, isLoading: false }));
			throw err;
		}
	}, []);

	/**
	 * Fetch authenticated user's post by slug (for editing, includes drafts)
	 */
	const fetchMyPost = useCallback(async (postSlug: string) => {
		setState((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			const response = await postsService.getMyBySlug(postSlug);
			setState((prev) => ({
				...prev,
				post: response,
				isLoading: false,
			}));
			return response;
		} catch (err) {
			const message =
				err instanceof ApiError ? err.message : "Failed to fetch post";
			setState((prev) => ({ ...prev, error: message, isLoading: false }));
			throw err;
		}
	}, []);

	/**
	 * Create a new post with content upload flow:
	 * 1. Generate slug from title
	 * 2. Get presigned URL for content upload
	 * 3. Upload content to S3
	 * 4. Create post with contentKey
	 */
	const createPost = useCallback(async (input: CreatePostInput) => {
		setState((prev) => ({
			...prev,
			isSaving: true,
			isUploading: true,
			error: null,
		}));

		try {
			const slug = generateSlug(input.title);

			// Upload content to S3
			const { contentKey } = await uploadService.uploadPostContent(
				slug,
				input.content,
			);

			setState((prev) => ({ ...prev, isUploading: false }));

			// Create post with the contentKey
			const response = await postsService.create({
				title: input.title,
				contentKey,
				status: input.status,
			});

			setState((prev) => ({
				...prev,
				post: { ...response, content: input.content },
				isSaving: false,
			}));

			return response;
		} catch (err) {
			const message =
				err instanceof ApiError ? err.message : "Failed to create post";
			setState((prev) => ({
				...prev,
				error: message,
				isSaving: false,
				isUploading: false,
			}));
			throw err;
		}
	}, []);

	/**
	 * Update a post with optional content upload:
	 * 1. If content changed, upload to S3
	 * 2. Update post with new data
	 */
	const updatePost = useCallback(
		async (postSlug: string, input: UpdatePostInput) => {
			setState((prev) => ({ ...prev, isSaving: true, error: null }));

			try {
				let contentKey: string | undefined;

				// If content is provided, upload it first
				if (input.content) {
					setState((prev) => ({ ...prev, isUploading: true }));
					const uploadResult = await uploadService.uploadPostContent(
						postSlug,
						input.content,
					);
					contentKey = uploadResult.contentKey;
					setState((prev) => ({ ...prev, isUploading: false }));
				}

				// Update post
				const response = await postsService.update(postSlug, {
					title: input.title,
					contentKey,
					status: input.status,
				});

				setState((prev) => ({
					...prev,
					post: input.content
						? { ...response, content: input.content }
						: prev.post
							? { ...prev.post, ...response }
							: null,
					isSaving: false,
				}));

				return response;
			} catch (err) {
				const message =
					err instanceof ApiError ? err.message : "Failed to update post";
				setState((prev) => ({
					...prev,
					error: message,
					isSaving: false,
					isUploading: false,
				}));
				throw err;
			}
		},
		[],
	);

	const deletePost = useCallback(async (postSlug: string) => {
		setState((prev) => ({ ...prev, isSaving: true, error: null }));

		try {
			await postsService.delete(postSlug);
			setState((prev) => ({
				...prev,
				post: null,
				isSaving: false,
			}));
		} catch (err) {
			const message =
				err instanceof ApiError ? err.message : "Failed to delete post";
			setState((prev) => ({ ...prev, error: message, isSaving: false }));
			throw err;
		}
	}, []);

	/**
	 * Publish a post (change status to published)
	 */
	const publishPost = useCallback(async (postSlug: string) => {
		setState((prev) => ({ ...prev, isSaving: true, error: null }));

		try {
			const response = await postsService.update(postSlug, {
				status: "published",
			});
			setState((prev) => ({
				...prev,
				post: prev.post ? { ...prev.post, ...response } : null,
				isSaving: false,
			}));
			return response;
		} catch (err) {
			const message =
				err instanceof ApiError ? err.message : "Failed to publish post";
			setState((prev) => ({ ...prev, error: message, isSaving: false }));
			throw err;
		}
	}, []);

	/**
	 * Unpublish a post (change status to draft)
	 */
	const unpublishPost = useCallback(async (postSlug: string) => {
		setState((prev) => ({ ...prev, isSaving: true, error: null }));

		try {
			const response = await postsService.update(postSlug, {
				status: "draft",
			});
			setState((prev) => ({
				...prev,
				post: prev.post ? { ...prev.post, ...response } : null,
				isSaving: false,
			}));
			return response;
		} catch (err) {
			const message =
				err instanceof ApiError ? err.message : "Failed to unpublish post";
			setState((prev) => ({ ...prev, error: message, isSaving: false }));
			throw err;
		}
	}, []);

	return {
		...state,
		fetchPost,
		fetchMyPost,
		createPost,
		updatePost,
		deletePost,
		publishPost,
		unpublishPost,
	};
}
