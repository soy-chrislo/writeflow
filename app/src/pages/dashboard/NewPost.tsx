import { useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { PostForm } from "@/components/posts";
import type { PostFormValues } from "@/lib/validations";
import { usePostsStore } from "@/store/posts";

export default function NewPost() {
	const navigate = useNavigate();
	const { createPost, isSaving, postError: error } = usePostsStore();

	const handleSave = useCallback(
		async (data: PostFormValues, action: "draft" | "publish") => {
			try {
				const post = await createPost({
					title: data.title,
					content: data.content,
					status: action === "publish" ? "published" : "draft",
				});

				if (action === "publish") {
					toast.success("Post published successfully");
				} else {
					toast.success("Draft saved successfully");
				}

				// Navigate to edit page with post data to avoid refetch
				navigate(`/dashboard/posts/${post.slug}/edit`, {
					state: { post: { ...post, content: data.content } },
					replace: true,
				});
			} catch {
				toast.error("Error saving post");
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
