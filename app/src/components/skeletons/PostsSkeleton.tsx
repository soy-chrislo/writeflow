import { Skeleton } from "@/components/ui/skeleton"

export function PostsSkeleton() {
	return (
		<div className="container mx-auto py-8">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<Skeleton className="h-8 w-24 mb-2" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-9 w-28" />
			</div>

			{/* Table */}
			<div className="space-y-4">
				<div className="rounded-md border">
					{/* Table header */}
					<div className="border-b">
						<div className="flex items-center h-10 px-2 gap-4">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-40" />
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-8" />
						</div>
					</div>

					{/* Table rows */}
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className="flex items-center h-14 px-2 gap-4 border-b last:border-0"
						>
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-5 w-52 rounded" />
							<Skeleton className="h-5 w-20 rounded-full" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-8 w-8 rounded" />
						</div>
					))}
				</div>

				{/* Pagination */}
				<div className="flex items-center justify-end gap-2">
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-16" />
				</div>
			</div>
		</div>
	)
}
