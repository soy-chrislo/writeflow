import { api } from "./api"
import type {
	GetUploadUrlRequest,
	UploadUrlResponse,
} from "@/types/post"

const UPLOAD_ENDPOINT = "/upload-url"

export interface UploadContentResult {
	contentKey: string
}

export const uploadService = {
	/**
	 * Get a presigned URL for uploading content to S3
	 */
	getUploadUrl: async (request: GetUploadUrlRequest) => {
		return api.post<UploadUrlResponse>(UPLOAD_ENDPOINT, request)
	},

	/**
	 * Upload HTML content to S3 using a presigned URL
	 */
	uploadContent: async (uploadUrl: string, content: string, contentType = "text/html") => {
		const response = await fetch(uploadUrl, {
			method: "PUT",
			headers: {
				"Content-Type": contentType,
			},
			body: content,
		})

		if (!response.ok) {
			throw new Error(`Failed to upload content: ${response.status}`)
		}
	},

	/**
	 * Complete flow: get presigned URL and upload content
	 * Returns the contentKey to use when creating/updating a post
	 */
	uploadPostContent: async (
		slug: string,
		content: string,
		contentType = "text/html"
	): Promise<UploadContentResult> => {
		// 1. Get presigned URL from backend
		const { data } = await uploadService.getUploadUrl({
			slug,
			contentType,
		})

		// 2. Upload content directly to S3
		await uploadService.uploadContent(data.uploadUrl, content, contentType)

		// 3. Return the contentKey to use in create/update post
		return {
			contentKey: data.contentKey,
		}
	},
}
