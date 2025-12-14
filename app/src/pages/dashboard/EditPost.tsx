import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { PostForm, type PostFormInitialData } from "@/components/posts";
import { EditorSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { usePost } from "@/hooks/use-posts";
import type { PostFormValues } from "@/lib/validations";
import type { PostWithContent } from "@/types/post";

export default function EditPost() {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const {
		post,
		isLoading,
		isSaving,
		error,
		fetchMyPost,
		updatePost,
		deletePost,
		unpublishPost,
		setPost,
	} = usePost();

	// Check if post data was passed through navigation state (from NewPost)
	const initialPost = (location.state as { post?: PostWithContent })?.post;
	const hasInitialized = useRef(false);

	useEffect(() => {
		if (hasInitialized.current) return;

		if (initialPost) {
			// Use pre-loaded data from navigation state
			setPost(initialPost);
			// Clear the state to prevent stale data on refresh
			window.history.replaceState({}, document.title);
			hasInitialized.current = true;
		} else if (slug) {
			fetchMyPost(slug);
			hasInitialized.current = true;
		}
	}, [slug, fetchMyPost, setPost, initialPost]);

	const handleSave = useCallback(
		async (data: PostFormValues, action: "draft" | "publish") => {
			if (!slug) return;

			try {
				await updatePost(slug, {
					title: data.title,
					content: data.content,
					status: action === "publish" ? "published" : undefined,
				});

				if (action === "publish") {
					toast.success("Post published successfully");
				} else {
					toast.success("Changes saved successfully");
				}
			} catch {
				toast.error("Error saving post");
			}
		},
		[slug, updatePost],
	);

	const handleCancel = useCallback(() => {
		navigate("/dashboard/posts");
	}, [navigate]);

	const handleDelete = useCallback(async () => {
		if (!slug) return;

		try {
			await deletePost(slug);
			toast.success("Post deleted successfully");
			navigate("/dashboard/posts");
		} catch {
			toast.error("Error deleting post");
		}
	}, [slug, deletePost, navigate]);

	const handleUnpublish = useCallback(async () => {
		if (!slug) return;

		try {
			await unpublishPost(slug);
			toast.success("Post moved to drafts");
		} catch {
			toast.error("Error unpublishing post");
		}
	}, [slug, unpublishPost]);

	// Use post from hook state, or initialPost from navigation (for seamless transition)
	const currentPost = post || initialPost;

	// Loading state (only show skeleton if we don't have any post data)
	if (isLoading && !currentPost) {
		return (
			<div className="container mx-auto max-w-6xl">
				<EditorSkeleton />
			</div>
		);
	}

	// Error state (post not found)
	if (error && !currentPost) {
		return (
			<div className="container mx-auto max-w-6xl">
				<div className="text-center py-12">
					<h1 className="text-2xl font-bold mb-4">Post not found</h1>
					<p className="text-muted-foreground mb-6">{error}</p>
					<Button onClick={() => navigate("/dashboard/posts")}>
						Back to my posts
					</Button>
				</div>
			</div>
		);
	}

	// No post loaded yet
	if (!currentPost) {
		return null;
	}

	const initialData: PostFormInitialData = {
		title: currentPost.title,
		content: currentPost.content,
		status: currentPost.status,
		slug: currentPost.slug,
		createdAt: currentPost.createdAt,
		updatedAt: currentPost.updatedAt,
		publishedAt: currentPost.publishedAt,
	};

	return (
		<div className="container mx-auto max-w-6xl">
			<PostForm
				mode="edit"
				initialData={initialData}
				onSave={handleSave}
				onCancel={handleCancel}
				onDelete={handleDelete}
				onUnpublish={handleUnpublish}
				isSaving={isSaving}
				error={error}
			/>
		</div>
	);
}
