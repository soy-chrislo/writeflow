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
			<SidebarFooter className="border-t p-4">
				<div className="flex flex-col gap-2">
					{user && (
						<div className="truncate text-sm text-muted-foreground">
							{user.email}
						</div>
					)}
					<SidebarMenuButton
						onClick={logout}
						className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
					>
						<LogOut className="size-4" />
						<span>Cerrar sesión</span>
					</SidebarMenuButton>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
