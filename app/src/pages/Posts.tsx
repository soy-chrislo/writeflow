import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable, DeleteDialog, getColumns } from "@/components/posts"
import { usePosts, usePost } from "@/hooks/use-posts"
import type { Post } from "@/types/post"

// Mock data for development until API is ready
const MOCK_POSTS: Post[] = [
	{
		slug: "getting-started-with-writeflow",
		title: "Getting Started with Writeflow",
		authorId: "user-1",
		status: "published",
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-16T14:30:00Z",
		publishedAt: "2024-01-16T14:30:00Z",
	},
	{
		slug: "understanding-serverless-architecture",
		title: "Understanding Serverless Architecture",
		authorId: "user-1",
		status: "published",
		createdAt: "2024-01-10T08:00:00Z",
		updatedAt: "2024-01-12T09:15:00Z",
		publishedAt: "2024-01-12T09:15:00Z",
	},
	{
		slug: "draft-post-about-react",
		title: "Draft Post About React Hooks",
		authorId: "user-1",
		status: "draft",
		createdAt: "2024-01-18T16:00:00Z",
		updatedAt: "2024-01-18T16:00:00Z",
	},
	{
		slug: "tiptap-editor-deep-dive",
		title: "Tiptap Editor: A Deep Dive into Rich Text Editing",
		authorId: "user-1",
		status: "draft",
		createdAt: "2024-01-20T11:00:00Z",
		updatedAt: "2024-01-21T10:45:00Z",
	},
	{
		slug: "aws-sam-tutorial",
		title: "AWS SAM Tutorial for Beginners",
		authorId: "user-1",
		status: "published",
		createdAt: "2024-01-05T09:00:00Z",
		updatedAt: "2024-01-08T15:20:00Z",
		publishedAt: "2024-01-08T15:20:00Z",
	},
]

export default function Posts() {
	const navigate = useNavigate()
	const { posts, isLoading, error, fetchMyPosts } = usePosts()
	const { deletePost, isSaving: isDeleting } = usePost()

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [postToDelete, setPostToDelete] = useState<Post | null>(null)

	// Use mock data for now
	const [useMock] = useState(true)
	const displayPosts = useMock ? MOCK_POSTS : posts

	useEffect(() => {
		if (!useMock) {
			fetchMyPosts()
		}
	}, [fetchMyPosts, useMock])

	const handleView = useCallback(
		(post: Post) => {
			navigate(`/posts/${post.slug}`)
		},
		[navigate]
	)

	const handleEdit = useCallback(
		(post: Post) => {
			navigate(`/posts/${post.slug}/edit`)
		},
		[navigate]
	)

	const handleDelete = useCallback((post: Post) => {
		setPostToDelete(post)
		setDeleteDialogOpen(true)
	}, [])

	const handleConfirmDelete = useCallback(async () => {
		if (!postToDelete) return

		try {
			await deletePost(postToDelete.slug)
			setDeleteDialogOpen(false)
			setPostToDelete(null)
			if (!useMock) {
				fetchMyPosts()
			}
		} catch {
			// Error is handled in the hook
		}
	}, [postToDelete, deletePost, fetchMyPosts, useMock])

	const columns = useMemo(
		() =>
			getColumns({
				onView: handleView,
				onEdit: handleEdit,
				onDelete: handleDelete,
			}),
		[handleView, handleEdit, handleDelete]
	)

	return (
		<div className="container mx-auto py-8">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold">Posts</h1>
					<p className="text-muted-foreground">
						Manage your blog posts and articles
					</p>
				</div>
				<Button onClick={() => navigate("/posts/new")}>
					<Plus className="size-4" />
					New Post
				</Button>
			</div>

			{error && (
				<div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
					{error}
				</div>
			)}

			<DataTable columns={columns} data={displayPosts} isLoading={isLoading} />

			<DeleteDialog
				post={postToDelete}
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onConfirm={handleConfirmDelete}
				isDeleting={isDeleting}
			/>
		</div>
	)
}
