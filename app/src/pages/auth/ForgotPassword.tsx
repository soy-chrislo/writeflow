import { Link } from "react-router"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { useAuth } from "@/hooks/use-auth"

const forgotPasswordSchema = z.object({
	email: z.string().email("Invalid email address"),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPassword() {
	const { forgotPassword, isLoading, error, clearError } = useAuth()

	const form = useForm<ForgotPasswordFormValues>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: {
			email: "",
		},
	})

	async function onSubmit(data: ForgotPasswordFormValues) {
		try {
			await forgotPassword(data)
		} catch {
			// Error handled in hook
		}
	}

	return (
		<div className="flex min-h-screen w-full items-center justify-center p-6">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Forgot password?</CardTitle>
					<CardDescription>
						Enter your email and we'll send you a code to reset your password
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

							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? "Sending..." : "Send reset code"}
							</Button>
						</form>
					</Form>

					<div className="mt-4 text-center">
						<Link
							to="/auth/login"
							className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
						>
							<ArrowLeft className="size-4" />
							Back to sign in
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
