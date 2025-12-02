import { Skeleton } from "@/components/ui/skeleton"

export function PostViewSkeleton() {
	return (
		<div className="container mx-auto py-8 max-w-4xl">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-4 mb-4">
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-16" />
				</div>

				<Skeleton className="h-10 w-3/4 mb-3" />

				<div className="flex items-center gap-4">
					<Skeleton className="h-5 w-20 rounded-full" />
					<Skeleton className="h-4 w-36" />
					<Skeleton className="h-4 w-36" />
				</div>
			</div>

			{/* Content */}
			<div className="space-y-4">
				<Skeleton className="h-8 w-2/3" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-5/6" />
				<Skeleton className="h-4 w-4/5" />

				<Skeleton className="h-6 w-1/3 mt-6" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />

				<Skeleton className="h-6 w-2/5 mt-6" />
				<div className="space-y-2 pl-6">
					<Skeleton className="h-4 w-48" />
					<Skeleton className="h-4 w-56" />
					<Skeleton className="h-4 w-44" />
					<Skeleton className="h-4 w-52" />
				</div>

				<Skeleton className="h-6 w-1/4 mt-6" />
				<div className="space-y-2 pl-6">
					<Skeleton className="h-4 w-64" />
					<Skeleton className="h-4 w-72" />
					<Skeleton className="h-4 w-60" />
				</div>

				<Skeleton className="h-20 w-full mt-6 rounded-lg" />

				<Skeleton className="h-6 w-1/3 mt-6" />
				<Skeleton className="h-32 w-full rounded-lg" />

				<Skeleton className="h-4 w-2/3 mt-6" />
			</div>
		</div>
	)
}
