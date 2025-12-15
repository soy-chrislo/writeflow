import { FileText, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { DataTable, DeleteDialog, getColumns } from "@/components/posts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { usePostsStore } from "@/store/posts";
import type { Post, PostStatus } from "@/types/post";

type StatusFilter = PostStatus | "all";

export default function MyPosts() {
	const navigate = useNavigate();
	const {
		posts,
		isLoading,
		error,
		nextToken,
		isSaving: isDeleting,
		fetchMyPosts,
		loadMore,
		removePost,
		restorePost,
		deletePost,
	} = usePostsStore();
	const hasMore = !!nextToken;

	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [search, setSearch] = useState("");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [postToDelete, setPostToDelete] = useState<Post | null>(null);

	useEffect(() => {
		fetchMyPosts({
			status: statusFilter === "all" ? undefined : statusFilter,
		});
	}, [fetchMyPosts, statusFilter]);

	const filteredPosts = useMemo(() => {
		if (!search.trim()) return posts;
		const searchLower = search.toLowerCase();
		return posts.filter((p) => p.title.toLowerCase().includes(searchLower));
	}, [posts, search]);

	const handleView = useCallback(
		(post: Post) => {
			navigate(`/posts/${post.slug}`);
		},
		[navigate],
	);

	const handleEdit = useCallback(
		(post: Post) => {
			navigate(`/dashboard/posts/${post.slug}/edit`);
		},
		[navigate],
	);

	const handleDelete = useCallback((post: Post) => {
		setPostToDelete(post);
		setDeleteDialogOpen(true);
	}, []);

	const handleConfirmDelete = useCallback(async () => {
		if (!postToDelete) return;

		const deletedPost = postToDelete;

		// Optimistic UI: remove immediately and close dialog
		removePost(deletedPost.slug);
		setDeleteDialogOpen(false);
		setPostToDelete(null);

		try {
			await deletePost(deletedPost.slug);
			toast.success("Post deleted successfully");
		} catch {
			// Restore on error
			restorePost(deletedPost);
			toast.error("Failed to delete post. Please try again.");
		}
	}, [postToDelete, deletePost, removePost, restorePost]);

	const columns = useMemo(
		() =>
			getColumns({
				onView: handleView,
				onEdit: handleEdit,
				onDelete: handleDelete,
			}),
		[handleView, handleEdit, handleDelete],
	);

	const showEmptyState =
		!isLoading && posts.length === 0 && statusFilter === "all" && !search;

	return (
		<div className="container mx-auto">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold">My Posts</h1>
					<p className="text-muted-foreground">
						Manage your blog posts and articles
					</p>
				</div>
				<Button onClick={() => navigate("/dashboard/posts/new")}>
					<Plus className="size-4" />
					New Post
				</Button>
			</div>

			{error && (
				<div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
					{error}
				</div>
			)}

			{showEmptyState ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<FileText className="size-12 text-muted-foreground/50 mb-4" />
					<h2 className="text-lg font-semibold mb-1">No posts yet</h2>
					<p className="text-muted-foreground mb-4">
						Create your first post to start writing
					</p>
					<Button onClick={() => navigate("/dashboard/posts/new")}>
						<Plus className="size-4" />
						New Post
					</Button>
				</div>
			) : (
				<>
					<div className="flex items-center gap-4 mb-4">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								placeholder="Search by title..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-9"
							/>
						</div>
						<Select
							value={statusFilter}
							onValueChange={(v) => setStatusFilter(v as StatusFilter)}
						>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="published">Published</SelectItem>
								<SelectItem value="draft">Drafts</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<DataTable
						columns={columns}
						data={filteredPosts}
						isLoading={isLoading}
					/>

					{hasMore && (
						<div className="flex justify-center mt-4">
							<Button
								variant="outline"
								onClick={() =>
									loadMore({
										status: statusFilter === "all" ? undefined : statusFilter,
									})
								}
								disabled={isLoading}
							>
								{isLoading ? "Loading..." : "Load more"}
							</Button>
						</div>
					)}
				</>
			)}

			<DeleteDialog
				post={postToDelete}
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onConfirm={handleConfirmDelete}
				isDeleting={isDeleting}
			/>
		</div>
	);
}
