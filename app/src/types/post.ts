export type PostStatus = "draft" | "published";

export interface Post {
	slug: string;
	title: string;
	authorId: string;
	status: PostStatus;
	createdAt: string;
	updatedAt: string;
	publishedAt?: string;
}

export interface PostWithContent extends Post {
	content: string;
}

// Request/Response types matching backend OpenAPI spec
export interface GetUploadUrlRequest {
	slug: string;
	contentType?: string;
}

export interface UploadUrlResponse {
	uploadUrl: string;
	contentKey: string;
	expiresIn: number;
}

export interface CreatePostRequest {
	title: string;
	contentKey: string;
	status?: PostStatus;
}

export interface UpdatePostRequest {
	title?: string;
	contentKey?: string;
	status?: PostStatus;
}

/**
 * Response types - these represent the data AFTER api.ts extracts from the backend wrapper
 * Backend returns { success: true, data: T }, api.ts extracts and returns just T
 */

export interface PostListResponse {
	posts: Post[];
	nextToken?: string;
}

export type PostResponse = Post;

export type PostWithContentResponse = PostWithContent;

export interface SuccessResponse {
	message?: string;
}

export interface ErrorResponse {
	success: boolean;
	error: string;
}
