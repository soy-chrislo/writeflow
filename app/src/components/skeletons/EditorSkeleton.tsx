import { Skeleton } from "@/components/ui/skeleton"

export function EditorSkeleton() {
	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-6xl mx-auto">
				{/* Title */}
				<Skeleton className="h-8 w-40 mb-6" />

				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-4 h-[600px]">
						{/* Editor panel */}
						<div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col">
							{/* Toolbar */}
							<div className="flex items-center gap-1 p-2 border-b border-gray-300 bg-gray-50">
								{Array.from({ length: 4 }).map((_, i) => (
									<Skeleton key={`format-${i}`} className="h-7 w-8" />
								))}
								<div className="w-px h-6 bg-gray-300 mx-1" />
								{Array.from({ length: 6 }).map((_, i) => (
									<Skeleton key={`heading-${i}`} className="h-7 w-8" />
								))}
								<div className="w-px h-6 bg-gray-300 mx-1" />
								{Array.from({ length: 2 }).map((_, i) => (
									<Skeleton key={`list-${i}`} className="h-7 w-8" />
								))}
								<div className="w-px h-6 bg-gray-300 mx-1" />
								{Array.from({ length: 3 }).map((_, i) => (
									<Skeleton key={`block-${i}`} className="h-7 w-8" />
								))}
							</div>
							{/* Editor content */}
							<div className="flex-1 p-4 space-y-3">
								<Skeleton className="h-8 w-3/4" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-5/6" />
								<Skeleton className="h-6 w-1/2 mt-4" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-4/5" />
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-6 w-2/5 mt-4" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-2/3" />
							</div>
						</div>

						{/* Preview panel */}
						<div className="border border-gray-300 rounded-lg overflow-hidden">
							{/* Preview header */}
							<div className="p-4 border-b border-gray-300 bg-gray-50">
								<Skeleton className="h-4 w-16" />
							</div>
							{/* Preview content */}
							<div className="p-4 space-y-3">
								<Skeleton className="h-8 w-3/4" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-5/6" />
								<Skeleton className="h-6 w-1/2 mt-4" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-4/5" />
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-6 w-2/5 mt-4" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-2/3" />
							</div>
						</div>
					</div>

					{/* Debug section */}
					<Skeleton className="h-5 w-48" />
				</div>
			</div>
		</div>
	)
}
