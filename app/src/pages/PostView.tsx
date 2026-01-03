import { format } from "date-fns";
import { ArrowLeft, Pencil } from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth";
import { usePostsStore } from "@/store/posts";

export default function PostView() {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	const {
		currentPost: post,
		isLoadingPost: isLoading,
		postError: error,
		fetchPost,
		fetchMyPost,
	} = usePostsStore();
	const { user, isAuthenticated } = useAuthStore();

	useEffect(() => {
		if (!slug) return;

		const loadPost = async () => {
			// If authenticated, try to fetch as "my post" first (includes drafts)
			if (isAuthenticated) {
				try {
					await fetchMyPost(slug);
					return;
				} catch {
					// If 404, fall through to try public endpoint
					// (in case it's a published post by another author)
				}
			}

			// Try public endpoint (published posts only)
			try {
				await fetchPost(slug);
			} catch {
				// Error is already set in the store
			}
		};

		loadPost();
	}, [slug, isAuthenticated, fetchPost, fetchMyPost]);

	// Update document title when post loads
	useEffect(() => {
		if (post?.title) {
			document.title = `${post.title} - Writeflow`;
		}
		return () => {
			document.title = "Writeflow";
		};
	}, [post?.title]);

	const isOwner = isAuthenticated && user && post?.authorId === user.id;

	if (error) {
		return (
			<div className="min-h-screen bg-background">
				<header className="border-b">
					<div className="container mx-auto px-4 flex items-center justify-between py-4">
						<Link to="/" className="text-2xl font-bold">
							Writeflow
						</Link>
					</div>
				</header>
				<main className="container mx-auto px-4 py-8 max-w-4xl">
					<div className="text-center py-12">
						<h1 className="text-2xl font-bold mb-4">Post not found</h1>
						<p className="text-muted-foreground mb-6">{error}</p>
						<Button onClick={() => navigate("/")}>
							<ArrowLeft className="size-4" />
							Back to Blog
						</Button>
					</div>
				</main>
			</div>
		);
	}

	if (isLoading || !post) {
		return (
			<div className="min-h-screen bg-background">
				<header className="border-b">
					<div className="container mx-auto px-4 flex items-center justify-between py-4">
						<Link to="/" className="text-2xl font-bold">
							Writeflow
						</Link>
					</div>
				</header>
				<main className="container mx-auto px-4 py-8 max-w-4xl">
					<div className="mb-6">
						<Skeleton className="h-8 w-32 mb-4" />
						<Skeleton className="h-10 w-3/4 mb-2" />
						<Skeleton className="h-4 w-48" />
					</div>
					<div className="space-y-4">
						<Skeleton className="h-6 w-full" />
						<Skeleton className="h-4 w-5/6" />
						<Skeleton className="h-4 w-4/5" />
						<Skeleton className="h-4 w-full" />
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b">
				<div className="container mx-auto px-4 flex items-center justify-between py-4">
					<Link to="/" className="text-2xl font-bold">
						Writeflow
					</Link>
					<nav className="flex items-center gap-2">
						{isAuthenticated && (
							<Button asChild variant="outline">
								<Link to="/dashboard">Dashboard</Link>
							</Button>
						)}
					</nav>
				</div>
			</header>

			{/* Main content */}
			<main className="container mx-auto px-4 py-8 max-w-4xl">
				<div className="mb-8">
					<div className="flex items-center gap-4 mb-4">
						<Button variant="ghost" size="sm" asChild>
							<Link to="/">
								<ArrowLeft className="size-4" />
								Back
							</Link>
						</Button>
						{isOwner && (
							<Button variant="outline" size="sm" asChild>
								<Link to={`/dashboard/posts/${slug}/edit`}>
									<Pencil className="size-4" />
									Edit
								</Link>
							</Button>
						)}
					</div>

					{/* Draft warning for owner */}
					{isOwner && post.status === "draft" && (
						<div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
							This post is a draft and only visible to you.
						</div>
					)}

					<h1 className="text-3xl font-bold mb-3">{post.title}</h1>

					<div className="flex items-center gap-4 text-sm text-muted-foreground">
						{isOwner && (
							<Badge
								variant={post.status === "published" ? "default" : "secondary"}
							>
								{post.status}
							</Badge>
						)}
						{post.publishedAt && (
							<span>
								Published {format(new Date(post.publishedAt), "MMMM d, yyyy")}
							</span>
						)}
						<span>
							Updated {format(new Date(post.updatedAt), "MMMM d, yyyy")}
						</span>
					</div>
				</div>

				{/* Content */}
				<article
					className="content-body"
					dangerouslySetInnerHTML={{ __html: post.content }}
				/>
			</main>

			{/* Footer */}
			<footer className="border-t mt-auto">
				<div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
					Writeflow - A simple blogging platform
				</div>
			</footer>
		</div>
	);
}
