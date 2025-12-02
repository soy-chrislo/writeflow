import { NavLink } from "react-router"
import { FileText, PenSquare } from "lucide-react"
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"

const navItems = [
	{
		title: "Editor",
		href: "/",
		icon: PenSquare,
	},
	{
		title: "Posts",
		href: "/posts",
		icon: FileText,
	},
]

export function AppSidebar() {
	return (
		<Sidebar collapsible="none">
			<SidebarHeader className="border-b px-4 py-3">
				<span className="text-lg font-semibold">Writeflow</span>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => (
								<SidebarMenuItem key={item.href}>
									<SidebarMenuButton asChild>
										<NavLink
											to={item.href}
											className={({ isActive }) =>
												isActive ? "data-[active=true]" : ""
											}
										>
											{({ isActive }) => (
												<>
													<item.icon
														className="size-4"
														data-active={isActive}
													/>
													<span>{item.title}</span>
												</>
											)}
										</NavLink>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	)
}
