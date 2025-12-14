import { useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { PostForm, type PostFormInitialData } from "@/components/posts";
import { EditorSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { usePost } from "@/hooks/use-posts";
import type { PostFormValues } from "@/lib/validations";

export default function EditPost() {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	const {
		post,
		isLoading,
		isSaving,
		error,
		fetchMyPost,
		updatePost,
		deletePost,
		unpublishPost,
	} = usePost();

	useEffect(() => {
		if (slug) {
			fetchMyPost(slug);
		}
	}, [slug, fetchMyPost]);

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
					toast.success("Post publicado correctamente");
				} else {
					toast.success("Cambios guardados correctamente");
				}

				// Refresh post data to get updated status/dates
				fetchMyPost(slug);
			} catch {
				toast.error("Error al guardar el post");
			}
		},
		[slug, updatePost, fetchMyPost],
	);

	const handleCancel = useCallback(() => {
		navigate("/dashboard/posts");
	}, [navigate]);

	const handleDelete = useCallback(async () => {
		if (!slug) return;

		try {
			await deletePost(slug);
			toast.success("Post eliminado correctamente");
			navigate("/dashboard/posts");
		} catch {
			toast.error("Error al eliminar el post");
		}
	}, [slug, deletePost, navigate]);

	const handleUnpublish = useCallback(async () => {
		if (!slug) return;

		try {
			await unpublishPost(slug);
			toast.success("Post movido a borradores");
			// Refresh post data to get updated status
			fetchMyPost(slug);
		} catch {
			toast.error("Error al despublicar el post");
		}
	}, [slug, unpublishPost, fetchMyPost]);

	// Loading state
	if (isLoading) {
		return (
			<div className="container mx-auto max-w-6xl">
				<EditorSkeleton />
			</div>
		);
	}

	// Error state (post not found)
	if (error && !post) {
		return (
			<div className="container mx-auto max-w-6xl">
				<div className="text-center py-12">
					<h1 className="text-2xl font-bold mb-4">Post no encontrado</h1>
					<p className="text-muted-foreground mb-6">{error}</p>
					<Button onClick={() => navigate("/dashboard/posts")}>
						Volver a mis posts
					</Button>
				</div>
			</div>
		);
	}

	// No post loaded yet
	if (!post) {
		return null;
	}

	const initialData: PostFormInitialData = {
		title: post.title,
		content: post.content,
		status: post.status,
		slug: post.slug,
		createdAt: post.createdAt,
		updatedAt: post.updatedAt,
		publishedAt: post.publishedAt,
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
