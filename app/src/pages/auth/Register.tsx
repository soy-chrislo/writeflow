import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
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

const registerSchema = z
	.object({
		email: z.string().email("Invalid email address"),
		password: passwordSchema,
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
	const { register, isLoading, error, clearError } = useAuth();

	const form = useForm<RegisterFormValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	async function onSubmit(data: RegisterFormValues) {
		try {
			await register({
				email: data.email,
				password: data.password,
			});
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
						"Join thousands of writers sharing their stories."
					</blockquote>
					<p className="text-primary-foreground/70">
						Create, publish, and grow your audience.
					</p>
				</div>
				<p className="text-sm text-primary-foreground/50">
					Free to start • Pay as you grow
				</p>
			</div>

			{/* Right side - Form */}
			<div className="flex w-full lg:w-1/2 items-center justify-center p-6">
				<Card className="w-full max-w-sm border-0 shadow-none lg:border lg:shadow-sm">
					<CardHeader className="text-center">
						<Link to="/" className="text-2xl font-bold text-primary lg:hidden mb-4 block">
							Writeflow
						</Link>
						<CardTitle className="text-2xl">Create an account</CardTitle>
						<CardDescription>Enter your details to get started</CardDescription>
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
										<FormLabel>Password</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder="••••••••"
												autoComplete="new-password"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Confirm Password</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder="••••••••"
												autoComplete="new-password"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? "Creating account..." : "Create account"}
							</Button>
						</form>
					</Form>

					<div className="mt-4 text-center text-sm">
						Already have an account?{" "}
						<Link to="/auth/login" className="text-primary hover:underline font-medium">
							Sign in
						</Link>
					</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
