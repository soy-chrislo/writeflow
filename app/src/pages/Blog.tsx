import { format } from "date-fns";
import { useEffect } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePosts } from "@/hooks/use-posts";
import { useAuthStore } from "@/store/auth";

export default function Blog() {
	const { posts, isLoading, error, fetchPublicPosts, hasMore, loadMore } =
		usePosts();
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	useEffect(() => {
		fetchPublicPosts();
	}, [fetchPublicPosts]);

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b">
				<div className="container mx-auto px-4 flex items-center justify-between py-4">
					<Link to="/" className="text-2xl font-bold">
						Writeflow
					</Link>
					<nav>
						{isAuthenticated ? (
							<Button asChild variant="outline">
								<Link to="/dashboard">Dashboard</Link>
							</Button>
						) : (
							<div className="flex gap-2">
								<Button asChild variant="ghost">
									<Link to="/auth/login">Login</Link>
								</Button>
								<Button asChild>
									<Link to="/auth/register">Register</Link>
								</Button>
							</div>
						)}
					</nav>
				</div>
			</header>

			{/* Main content */}
			<main className="container mx-auto px-4 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold mb-2">Blog</h1>
					<p className="text-muted-foreground">
						Latest posts from our community
					</p>
				</div>

				{error && (
					<div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
						{error}
					</div>
				)}

				{isLoading && posts.length === 0 ? (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{[...Array(6)].map((_, i) => (
							<Card key={i}>
								<CardHeader>
									<Skeleton className="h-6 w-3/4" />
									<Skeleton className="h-4 w-1/2" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-4 w-full mb-2" />
									<Skeleton className="h-4 w-2/3" />
								</CardContent>
							</Card>
						))}
					</div>
				) : posts.length === 0 ? (
					<div className="text-center py-12">
						<h2 className="text-xl font-semibold mb-2">No posts yet</h2>
						<p className="text-muted-foreground">
							Check back later for new content.
						</p>
					</div>
				) : (
					<>
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{posts.map((post) => (
								<Link key={post.slug} to={`/posts/${post.slug}`}>
									<Card className="h-full hover:shadow-md transition-shadow">
										<CardHeader>
											<div className="flex items-center gap-2 mb-2">
												<Badge variant="secondary">
													{post.status === "published" ? "Published" : "Draft"}
												</Badge>
											</div>
											<CardTitle className="line-clamp-2">
												{post.title}
											</CardTitle>
											<CardDescription>
												{post.publishedAt &&
													format(new Date(post.publishedAt), "MMMM d, yyyy")}
											</CardDescription>
										</CardHeader>
										<CardContent>
											<p className="text-sm text-muted-foreground line-clamp-3">
												Click to read more...
											</p>
										</CardContent>
									</Card>
								</Link>
							))}
						</div>

						{hasMore && (
							<div className="mt-8 text-center">
								<Button
									variant="outline"
									onClick={() => loadMore()}
									disabled={isLoading}
								>
									{isLoading ? "Loading..." : "Load more"}
								</Button>
							</div>
						)}
					</>
				)}
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
