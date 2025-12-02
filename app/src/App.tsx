import { Suspense, lazy } from "react"
import { Routes, Route } from "react-router"
import { Layout } from "@/components/layout"
import {
	EditorSkeleton,
	PostsSkeleton,
	PostViewSkeleton,
} from "@/components/skeletons"

const Home = lazy(() => import("@/pages/Home"))
const Posts = lazy(() => import("@/pages/Posts"))
const PostView = lazy(() => import("@/pages/PostView"))

const Login = lazy(() => import("@/pages/auth/Login"))
const Register = lazy(() => import("@/pages/auth/Register"))
const ConfirmCode = lazy(() => import("@/pages/auth/ConfirmCode"))
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"))
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"))

function App() {
	return (
		<Routes>
			{/* Auth routes - no layout */}
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

			{/* App routes - with layout */}
			<Route element={<Layout />}>
				<Route
					index
					element={
						<Suspense fallback={<EditorSkeleton />}>
							<Home />
						</Suspense>
					}
				/>
				<Route
					path="/posts"
					element={
						<Suspense fallback={<PostsSkeleton />}>
							<Posts />
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
			</Route>
		</Routes>
	)
}

export default App
