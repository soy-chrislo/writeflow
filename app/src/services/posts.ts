import type {
	CreatePostRequest,
	Post,
	PostListResponse,
	PostResponse,
	PostWithContent,
	PostWithContentResponse,
	SuccessResponse,
	UpdatePostRequest,
} from "@/types/post";
import { api } from "./api";

const POSTS_ENDPOINT = "/posts";
const MY_POSTS_ENDPOINT = "/my/posts";

export const postsService = {
	/**
	 * List public published posts (no auth required)
	 */
	listPublic: async (params?: { limit?: number; nextToken?: string }) => {
		const searchParams = new URLSearchParams();
		if (params?.limit) searchParams.set("limit", params.limit.toString());
		if (params?.nextToken) searchParams.set("nextToken", params.nextToken);

		const query = searchParams.toString();
		const endpoint = query ? `${POSTS_ENDPOINT}?${query}` : POSTS_ENDPOINT;

		return api.get<PostListResponse>(endpoint);
	},

	/**
	 * List authenticated user's posts (requires auth)
	 */
	listMy: async (params?: {
		status?: string;
		limit?: number;
		nextToken?: string;
	}) => {
		const searchParams = new URLSearchParams();
		if (params?.status) searchParams.set("status", params.status);
		if (params?.limit) searchParams.set("limit", params.limit.toString());
		if (params?.nextToken) searchParams.set("nextToken", params.nextToken);

		const query = searchParams.toString();
		const endpoint = query
			? `${MY_POSTS_ENDPOINT}?${query}`
			: MY_POSTS_ENDPOINT;

		return api.get<PostListResponse>(endpoint);
	},

	/**
	 * Get a single post by slug (public for published posts)
	 */
	getBySlug: async (slug: string) => {
		return api.get<PostWithContentResponse>(`${POSTS_ENDPOINT}/${slug}`);
	},

	/**
	 * Get authenticated user's post by slug (includes drafts)
	 */
	getMyBySlug: async (slug: string) => {
		return api.get<PostWithContentResponse>(`${MY_POSTS_ENDPOINT}/${slug}`);
	},

	/**
	 * Create a new post (requires auth)
	 * Note: Content must be uploaded first using uploadService.uploadPostContent()
	 */
	create: async (data: CreatePostRequest) => {
		return api.post<PostResponse>(POSTS_ENDPOINT, data);
	},

	/**
	 * Update a post (requires auth, must be post owner)
	 * Note: If updating content, upload first using uploadService.uploadPostContent()
	 */
	update: async (slug: string, data: UpdatePostRequest) => {
		return api.put<PostResponse>(`${POSTS_ENDPOINT}/${slug}`, data);
	},

	/**
	 * Delete a post (requires auth, must be post owner)
	 */
	delete: async (slug: string) => {
		return api.delete<SuccessResponse>(`${POSTS_ENDPOINT}/${slug}`);
	},
};

export type { Post, PostWithContent, CreatePostRequest, UpdatePostRequest };
