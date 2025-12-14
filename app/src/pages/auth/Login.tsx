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
			toast.success("Sesión iniciada correctamente");
			navigate(from, { replace: true });
		} catch {
			// Error handled in hook
		}
	}

	return (
		<div className="flex min-h-screen w-full items-center justify-center p-6">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
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
						<Link to="/auth/register" className="text-primary hover:underline">
							Sign up
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
