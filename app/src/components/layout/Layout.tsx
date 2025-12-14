import { Outlet } from "react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export function Layout() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<main className="p-6">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
