import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { passwordSchema } from "@/lib/validations";

const loginSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: passwordSchema,
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
	const { login, isLoading, error, clearError } = useAuth();
	const location = useLocation();
	const navigate = useNavigate();

	// Obtener returnUrl del state (guardado por ProtectedRoute)
	const from = (location.state as { from?: string })?.from || "/dashboard";

	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	async function onSubmit(data: LoginFormValues) {
		try {
			await login(data, { skipNavigate: true });
			toast.success("Logged in successfully");
			navigate(from, { replace: true });
		} catch {
			// Error handled in hook
		}
	}

	return (
		<div className="flex min-h-screen w-full">
			{/* Left side - Branding */}
			<div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 flex-col justify-between">
				<Link to="/" className="text-3xl font-bold text-primary-foreground">
					Writeflow
				</Link>
				<div>
					<blockquote className="text-xl text-primary-foreground/90 font-medium mb-4">
						"The simple, serverless way to share your ideas with the world."
					</blockquote>
					<p className="text-primary-foreground/70">
						Start writing today, pay only for what you use.
					</p>
				</div>
				<p className="text-sm text-primary-foreground/50">
					Powered by AWS Serverless
				</p>
			</div>

			{/* Right side - Form */}
			<div className="flex w-full lg:w-1/2 items-center justify-center p-6">
				<Card className="w-full max-w-sm border-0 shadow-none lg:border lg:shadow-sm">
					<CardHeader className="text-center">
						<Link to="/" className="text-2xl font-bold text-primary lg:hidden mb-4 block">
							Writeflow
						</Link>
						<CardTitle className="text-2xl">Welcome back</CardTitle>
						<CardDescription>
							Enter your credentials to access your account
						</CardDescription>
					</CardHeader>
				<CardContent>
					{error && (
						<div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
							{error}
							<button
								type="button"
								onClick={clearError}
								className="ml-2 underline"
							>
								Dismiss
							</button>
						</div>
					)}

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												placeholder="email@example.com"
												type="email"
												autoComplete="email"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<div className="flex items-center justify-between">
											<FormLabel>Password</FormLabel>
											<Link
												to="/auth/forgot-password"
												className="text-sm text-muted-foreground hover:text-primary"
											>
												Forgot password?
											</Link>
										</div>
										<FormControl>
											<Input
												type="password"
												placeholder="••••••••"
												autoComplete="current-password"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? "Signing in..." : "Sign in"}
							</Button>
						</form>
					</Form>

					<div className="mt-4 text-center text-sm">
						Don't have an account?{" "}
						<Link to="/auth/register" className="text-primary hover:underline font-medium">
							Sign up
						</Link>
					</div>
				</CardContent>
				</Card>
			</div>
		</div>
	);
}
