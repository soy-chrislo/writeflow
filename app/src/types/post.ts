export type PostStatus = "draft" | "published"

export interface Post {
	slug: string
	title: string
	authorId: string
	status: PostStatus
	createdAt: string
	updatedAt: string
	publishedAt?: string
}

export interface PostWithContent extends Post {
	content: string
}

// Request/Response types matching backend OpenAPI spec
export interface GetUploadUrlRequest {
	slug: string
	contentType?: string
}

export interface UploadUrlResponse {
	success: boolean
	data: {
		uploadUrl: string
		contentKey: string
		expiresIn: number
	}
}

export interface CreatePostRequest {
	title: string
	contentKey: string
	status?: PostStatus
}

export interface UpdatePostRequest {
	title?: string
	contentKey?: string
	status?: PostStatus
}

export interface PostListResponse {
	success: boolean
	data: {
		posts: Post[]
		nextToken?: string
	}
}

export interface PostResponse {
	success: boolean
	data: Post
}

export interface PostWithContentResponse {
	success: boolean
	data: PostWithContent
}

export interface SuccessResponse {
	success: boolean
	message?: string
}

export interface ErrorResponse {
	success: boolean
	error: string
}
