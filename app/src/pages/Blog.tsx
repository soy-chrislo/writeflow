import { format } from "date-fns";
import { useEffect } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
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
			<header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
				<div className="container mx-auto px-4 flex items-center justify-between py-4">
					<Link to="/" className="text-2xl font-bold text-primary">
						Writeflow
					</Link>
					<nav>
						{isAuthenticated ? (
							<Button asChild>
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

			{/* Hero Section */}
			<section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-accent/10">
				<div className="container mx-auto px-4 py-16 md:py-24">
					<div className="max-w-2xl">
						<h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
							Welcome to <span className="text-primary">Writeflow</span>
						</h1>
						<p className="text-lg text-muted-foreground mb-6">
							Discover stories, ideas, and insights from our community of
							writers.
						</p>
						{!isAuthenticated && (
							<Button asChild size="lg">
								<Link to="/auth/register">Start Writing</Link>
							</Button>
						)}
					</div>
				</div>
				<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
			</section>

			{/* Main content */}
			<main className="container mx-auto px-4 py-12">
				<div className="mb-8">
					<h2 className="text-2xl font-bold mb-2">Latest Posts</h2>
					<p className="text-muted-foreground">
						Fresh content from our community
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
									<Card className="group h-full hover:shadow-lg hover:border-primary/20 transition-all duration-300">
										<CardHeader className="space-y-3">
											<div className="flex items-center gap-2">
												<Badge
													variant="secondary"
													className="bg-primary/10 text-primary hover:bg-primary/20"
												>
													{post.status === "published" ? "Published" : "Draft"}
												</Badge>
												{post.publishedAt && (
													<span className="text-xs text-muted-foreground">
														{format(new Date(post.publishedAt), "MMM d, yyyy")}
													</span>
												)}
											</div>
											<CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
												{post.title}
											</CardTitle>
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
					<p>Writeflow - A simple blogging platform</p>
					<p className="mt-1">
						Made by{" "}
						<a
							href="https://github.com/soy-chrislo"
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
						>
							Chrislo
						</a>
					</p>
				</div>
			</footer>
		</div>
	);
}
