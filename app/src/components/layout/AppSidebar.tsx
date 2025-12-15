import { FileText, LogOut, Plus } from "lucide-react";
import { NavLink } from "react-router";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth";

const navItems = [
	{
		title: "My Posts",
		href: "/dashboard/posts",
		icon: FileText,
	},
	{
		title: "New Post",
		href: "/dashboard/posts/new",
		icon: Plus,
	},
];

export function AppSidebar() {
	const { logout } = useAuth();
	const user = useAuthStore((state) => state.user);

	return (
		<Sidebar collapsible="none">
			<SidebarHeader className="border-b border-sidebar-border px-4 py-3">
				<span className="text-lg font-semibold text-sidebar-foreground">
					Writeflow
				</span>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => (
								<SidebarMenuItem key={item.href}>
									<NavLink
										to={item.href}
										end={item.href === "/dashboard/posts"}
									>
										{({ isActive }) => (
											<SidebarMenuButton
												isActive={isActive}
												className={
													isActive
														? "bg-sidebar-accent text-sidebar-accent-foreground"
														: "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
												}
											>
												<item.icon className="size-4" />
												<span>{item.title}</span>
											</SidebarMenuButton>
										)}
									</NavLink>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="border-t border-sidebar-border p-4">
				<div className="flex flex-col gap-3">
					{user && (
						<div className="truncate text-sm text-sidebar-foreground/70">
							{user.email}
						</div>
					)}
					<SidebarMenuButton
						onClick={logout}
						className="w-full justify-start text-red-400 hover:bg-red-500/20 hover:text-red-300"
					>
						<LogOut className="size-4" />
						<span>Log out</span>
					</SidebarMenuButton>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
