import { useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { PostForm } from "@/components/posts";
import { usePost } from "@/hooks/use-posts";
import type { PostFormValues } from "@/lib/validations";

export default function NewPost() {
	const navigate = useNavigate();
	const { createPost, isSaving, error } = usePost();

	const handleSave = useCallback(
		async (data: PostFormValues, action: "draft" | "publish") => {
			try {
				const post = await createPost({
					title: data.title,
					content: data.content,
					status: action === "publish" ? "published" : "draft",
				});

				if (action === "publish") {
					toast.success("Post publicado correctamente");
				} else {
					toast.success("Borrador guardado correctamente");
				}

				// Navigate to edit page to continue editing or to posts list
				navigate(`/dashboard/posts/${post.slug}/edit`);
			} catch {
				toast.error("Error al guardar el post");
			}
		},
		[createPost, navigate],
	);

	const handleCancel = useCallback(() => {
		navigate("/dashboard/posts");
	}, [navigate]);

	return (
		<div className="container mx-auto max-w-6xl">
			<PostForm
				mode="create"
				onSave={handleSave}
				onCancel={handleCancel}
				isSaving={isSaving}
				error={error}
			/>
		</div>
	);
}
