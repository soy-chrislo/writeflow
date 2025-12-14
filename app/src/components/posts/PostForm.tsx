import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import Editor from "@/components/Editor";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type PostFormValues, postFormSchema } from "@/lib/validations";
import type { PostStatus } from "@/types/post";

export interface PostFormInitialData {
	title: string;
	content: string;
	status: PostStatus;
	slug?: string;
	createdAt?: string;
	updatedAt?: string;
	publishedAt?: string;
}

interface PostFormProps {
	/** Form mode */
	mode: "create" | "edit";
	/** Initial data for edit mode */
	initialData?: PostFormInitialData;
	/** Callback when saving */
	onSave: (data: PostFormValues, action: "draft" | "publish") => Promise<void>;
	/** Callback when canceling */
	onCancel: () => void;
	/** Callback when deleting (edit mode only) */
	onDelete?: () => Promise<void>;
	/** Callback when unpublishing (edit mode only, when status is published) */
	onUnpublish?: () => Promise<void>;
	/** Whether the form is currently saving */
	isSaving: boolean;
	/** Whether the form is currently deleting */
	isDeleting?: boolean;
	/** API error message */
	error?: string | null;
}

export function PostForm({
	mode,
	initialData,
	onSave,
	onCancel,
	onDelete,
	onUnpublish,
	isSaving,
	isDeleting = false,
	error,
}: PostFormProps) {
	const [editorContent, setEditorContent] = useState(
		initialData?.content || "",
	);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const form = useForm<PostFormValues>({
		resolver: zodResolver(postFormSchema),
		defaultValues: {
			title: initialData?.title || "",
			content: initialData?.content || "",
		},
	});

	// Track if form has unsaved changes
	const isDirty =
		form.formState.isDirty || editorContent !== (initialData?.content || "");

	// Warn user before leaving with unsaved changes
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (isDirty && !isSaving) {
				e.preventDefault();
				e.returnValue = "";
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isDirty, isSaving]);

	const handleEditorChange = useCallback(
		(_raw: string, sanitized: string) => {
			setEditorContent(sanitized);
			form.setValue("content", sanitized, { shouldDirty: true });
		},
		[form],
	);

	const handleSaveDraft = async () => {
		const isValid = await form.trigger("title");
		if (!isValid) return;

		const values = form.getValues();
		values.content = editorContent;
		await onSave(values, "draft");
	};

	const handlePublish = async () => {
		const values = form.getValues();
		values.content = editorContent;

		// Validate title
		const isValid = await form.trigger("title");
		if (!isValid) return;

		// Validate content for publish
		if (!editorContent || editorContent === "<p></p>") {
			form.setError("content", {
				type: "manual",
				message: "El contenido es obligatorio para publicar",
			});
			return;
		}

		await onSave(values, "publish");
	};

	const handleDelete = async () => {
		if (onDelete) {
			await onDelete();
			setDeleteDialogOpen(false);
		}
	};

	const isDisabled = isSaving || isDeleting;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onCancel}
						disabled={isDisabled}
					>
						<ArrowLeft className="size-4" />
						Volver
					</Button>
					{mode === "edit" && initialData?.status && (
						<Badge
							variant={
								initialData.status === "published" ? "default" : "secondary"
							}
						>
							{initialData.status === "published" ? "Publicado" : "Borrador"}
						</Badge>
					)}
					{/* Link to view published post */}
					{mode === "edit" &&
						initialData?.status === "published" &&
						initialData?.slug && (
							<Button variant="ghost" size="sm" asChild>
								<Link to={`/posts/${initialData.slug}`} target="_blank">
									<ExternalLink className="size-4" />
									Ver post
								</Link>
							</Button>
						)}
				</div>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={handleSaveDraft}
						disabled={isDisabled}
					>
						{isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
						{mode === "create" ? "Guardar borrador" : "Guardar"}
					</Button>
					{/* Show Unpublish button for published posts, Publish for drafts */}
					{mode === "edit" &&
					initialData?.status === "published" &&
					onUnpublish ? (
						<Button
							type="button"
							variant="secondary"
							onClick={onUnpublish}
							disabled={isDisabled}
						>
							{isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
							Despublicar
						</Button>
					) : (
						<Button
							type="button"
							onClick={handlePublish}
							disabled={isDisabled}
						>
							{isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
							Publicar
						</Button>
					)}
				</div>
			</div>

			{/* Error message */}
			{error && (
				<div className="p-4 bg-destructive/10 text-destructive rounded-md">
					{error}
				</div>
			)}

			{/* Form */}
			<Form {...form}>
				<form className="space-y-6">
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Título</FormLabel>
								<FormControl>
									<Input
										placeholder="Escribe el título de tu post..."
										disabled={isDisabled}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="content"
						render={() => (
							<FormItem>
								<FormLabel>Contenido</FormLabel>
								<FormControl>
									<Editor
										initialContent={initialData?.content}
										onContentChange={handleEditorChange}
										readOnly={isDisabled}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</form>
			</Form>

			{/* Footer (edit mode only) */}
			{mode === "edit" && initialData && (
				<div className="flex items-center justify-between pt-6 border-t">
					<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
						{initialData.slug && <span>Slug: {initialData.slug}</span>}
						{initialData.createdAt && (
							<span>
								Creado: {format(new Date(initialData.createdAt), "d MMM yyyy")}
							</span>
						)}
						{initialData.updatedAt && (
							<span>
								Actualizado:{" "}
								{format(new Date(initialData.updatedAt), "d MMM yyyy")}
							</span>
						)}
						{initialData.publishedAt && (
							<span>
								Publicado:{" "}
								{format(new Date(initialData.publishedAt), "d MMM yyyy")}
							</span>
						)}
					</div>
					{onDelete && (
						<AlertDialog
							open={deleteDialogOpen}
							onOpenChange={setDeleteDialogOpen}
						>
							<AlertDialogTrigger asChild>
								<Button
									type="button"
									variant="destructive"
									size="sm"
									disabled={isDisabled}
								>
									<Trash2 className="size-4" />
									Eliminar post
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>¿Eliminar post?</AlertDialogTitle>
									<AlertDialogDescription>
										Esta acción no se puede deshacer. El post "
										{initialData.title}" será eliminado permanentemente.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel disabled={isDeleting}>
										Cancelar
									</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleDelete}
										disabled={isDeleting}
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									>
										{isDeleting ? (
											<Loader2 className="size-4 animate-spin" />
										) : null}
										Eliminar
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}
				</div>
			)}
		</div>
	);
}
