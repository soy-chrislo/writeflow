import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Layout } from "@/components/layout";
import {
	EditorSkeleton,
	PostsSkeleton,
	PostViewSkeleton,
} from "@/components/skeletons";
import { useTokenRefresh } from "@/hooks/use-token-refresh";

// Public pages
const Blog = lazy(() => import("@/pages/Blog"));
const PostView = lazy(() => import("@/pages/PostView"));

// Dashboard pages (protected)
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const MyPosts = lazy(() => import("@/pages/dashboard/MyPosts"));
const NewPost = lazy(() => import("@/pages/dashboard/NewPost"));
const EditPost = lazy(() => import("@/pages/dashboard/EditPost"));

// Auth pages
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const ConfirmCode = lazy(() => import("@/pages/auth/ConfirmCode"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));

function App() {
	useTokenRefresh();

	return (
		<>
			<ApiKeyDialog />
			<Routes>
				{/* Public routes */}
				<Route
					index
					element={
						<Suspense fallback={<PostsSkeleton />}>
							<Blog />
						</Suspense>
					}
				/>
				<Route
					path="/posts/:slug"
					element={
						<Suspense fallback={<PostViewSkeleton />}>
							<PostView />
						</Suspense>
					}
				/>

				{/* Auth routes */}
				<Route
					path="/auth/login"
					element={
						<Suspense fallback={null}>
							<Login />
						</Suspense>
					}
				/>
				<Route
					path="/auth/register"
					element={
						<Suspense fallback={null}>
							<Register />
						</Suspense>
					}
				/>
				<Route
					path="/auth/confirm"
					element={
						<Suspense fallback={null}>
							<ConfirmCode />
						</Suspense>
					}
				/>
				<Route
					path="/auth/forgot-password"
					element={
						<Suspense fallback={null}>
							<ForgotPassword />
						</Suspense>
					}
				/>
				<Route
					path="/auth/reset-password"
					element={
						<Suspense fallback={null}>
							<ResetPassword />
						</Suspense>
					}
				/>

				{/* Protected dashboard routes */}
				<Route
					path="/dashboard"
					element={
						<ProtectedRoute>
							<Layout />
						</ProtectedRoute>
					}
				>
					<Route
						index
						element={
							<Suspense fallback={<EditorSkeleton />}>
								<Dashboard />
							</Suspense>
						}
					/>
					<Route
						path="posts"
						element={
							<Suspense fallback={<PostsSkeleton />}>
								<MyPosts />
							</Suspense>
						}
					/>
					<Route
						path="posts/new"
						element={
							<Suspense fallback={<EditorSkeleton />}>
								<NewPost />
							</Suspense>
						}
					/>
					<Route
						path="posts/:slug/edit"
						element={
							<Suspense fallback={<EditorSkeleton />}>
								<EditPost />
							</Suspense>
						}
					/>
				</Route>
			</Routes>
		</>
	);
}

export default App;
