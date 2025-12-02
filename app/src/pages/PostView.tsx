import { useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router"
import { ArrowLeft, Pencil } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { usePost } from "@/hooks/use-posts"
import type { PostWithContent } from "@/types/post"

// Mock data for development
const MOCK_POST: PostWithContent = {
	slug: "getting-started-with-writeflow",
	title: "Getting Started with Writeflow",
	authorId: "user-1",
	status: "published",
	createdAt: "2024-01-15T10:00:00Z",
	updatedAt: "2024-01-16T14:30:00Z",
	publishedAt: "2024-01-16T14:30:00Z",
	content: `
		<h1>Getting Started with Writeflow</h1>
		<p>Welcome to <strong>Writeflow</strong>, a lightweight serverless CMS built for content creators who value simplicity and performance.</p>

		<h2>Why Writeflow?</h2>
		<p>Traditional CMS platforms often come with unnecessary complexity. Writeflow focuses on what matters most: <em>writing</em>.</p>

		<h3>Key Features</h3>
		<ul>
			<li>Rich text editor powered by Tiptap</li>
			<li>Live preview as you write</li>
			<li>Serverless architecture with AWS</li>
			<li>Fast CDN delivery via CloudFlare</li>
		</ul>

		<h3>Getting Started</h3>
		<ol>
			<li>Create a new post from the editor</li>
			<li>Write your content using the formatting toolbar</li>
			<li>Preview your changes in real-time</li>
			<li>Save as draft or publish directly</li>
		</ol>

		<blockquote>The best writing tool is one that gets out of your way.</blockquote>

		<h3>Code Example</h3>
		<p>Here's a simple code snippet:</p>
		<pre><code>const post = await createPost({
  title: "My First Post",
  content: sanitizedHTML,
  status: "draft"
})</code></pre>

		<p>For more information, check out our <a href="https://example.com/docs">documentation</a>.</p>
	`,
}

export default function PostView() {
	const { slug } = useParams<{ slug: string }>()
	const navigate = useNavigate()
	const { post, isLoading, error, fetchPost } = usePost()

	// Use mock data for development
	const useMock = true
	const displayPost = useMock ? MOCK_POST : post

	useEffect(() => {
		if (!slug || useMock) return
		fetchPost(slug)
	}, [slug, fetchPost, useMock])

	if (error) {
		return (
			<div className="container mx-auto py-8 max-w-4xl">
				<div className="text-center py-12">
					<h1 className="text-2xl font-bold mb-4">Error</h1>
					<p className="text-muted-foreground mb-6">{error}</p>
					<Button onClick={() => navigate("/posts")}>
						<ArrowLeft className="size-4" />
						Back to Posts
					</Button>
				</div>
			</div>
		)
	}

	if (isLoading || !displayPost) {
		return (
			<div className="container mx-auto py-8 max-w-4xl">
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
			</div>
		)
	}

	return (
		<div className="container mx-auto py-8 max-w-4xl">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-4 mb-4">
					<Button variant="ghost" size="sm" asChild>
						<Link to="/posts">
							<ArrowLeft className="size-4" />
							Back
						</Link>
					</Button>
					<Button variant="outline" size="sm" asChild>
						<Link to={`/posts/${slug}/edit`}>
							<Pencil className="size-4" />
							Edit
						</Link>
					</Button>
				</div>

				<h1 className="text-3xl font-bold mb-3">{displayPost.title}</h1>

				<div className="flex items-center gap-4 text-sm text-muted-foreground">
					<Badge variant={displayPost.status === "published" ? "default" : "secondary"}>
						{displayPost.status}
					</Badge>
					{displayPost.publishedAt && (
						<span>
							Published {format(new Date(displayPost.publishedAt), "MMMM d, yyyy")}
						</span>
					)}
					<span>
						Updated {format(new Date(displayPost.updatedAt), "MMMM d, yyyy")}
					</span>
				</div>
			</div>

			{/* Content */}
			<article
				className="content-body"
				dangerouslySetInnerHTML={{ __html: displayPost.content }}
			/>
		</div>
	)
}
