import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Post } from "@/types/post";

interface ColumnsProps {
	onEdit: (post: Post) => void;
	onView: (post: Post) => void;
	onDelete: (post: Post) => void;
}

export function getColumns({
	onEdit,
	onView,
	onDelete,
}: ColumnsProps): ColumnDef<Post>[] {
	return [
		{
			accessorKey: "title",
			header: "Title",
			cell: ({ row }) => {
				const title = row.getValue("title") as string;
				return (
					<div className="font-medium max-w-[300px] truncate" title={title}>
						{title}
					</div>
				);
			},
		},
		{
			accessorKey: "slug",
			header: "Slug",
			cell: ({ row }) => {
				const slug = row.getValue("slug") as string;
				return (
					<code className="text-xs bg-muted px-1.5 py-0.5 rounded">{slug}</code>
				);
			},
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => {
				const status = row.getValue("status") as string;
				return (
					<Badge variant={status === "published" ? "default" : "secondary"}>
						{status}
					</Badge>
				);
			},
		},
		{
			accessorKey: "createdAt",
			header: "Created",
			cell: ({ row }) => {
				const date = row.getValue("createdAt") as string;
				return (
					<span className="text-muted-foreground text-sm">
						{format(new Date(date), "MMM d, yyyy")}
					</span>
				);
			},
		},
		{
			accessorKey: "updatedAt",
			header: "Updated",
			cell: ({ row }) => {
				const date = row.getValue("updatedAt") as string;
				return (
					<span className="text-muted-foreground text-sm">
						{format(new Date(date), "MMM d, yyyy")}
					</span>
				);
			},
		},
		{
			id: "actions",
			header: () => <span className="sr-only">Actions</span>,
			cell: ({ row }) => {
				const post = row.original;

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon-sm">
								<MoreHorizontal className="size-4" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onView(post)}>
								<Eye className="size-4" />
								View
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onEdit(post)}>
								<Pencil className="size-4" />
								Edit
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => onDelete(post)}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 className="size-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];
}
