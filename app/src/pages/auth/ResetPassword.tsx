import { useEffect } from "react"
import { Link, useNavigate } from "react-router"
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
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
	InputOTPSeparator,
} from "@/components/ui/input-otp"
import { useAuth } from "@/hooks/use-auth"
import { passwordSchema } from "@/lib/validations"

const resetPasswordSchema = z
	.object({
		code: z.string().length(6, "Code must be 6 digits"),
		password: passwordSchema,
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPassword() {
	const navigate = useNavigate()
	const { pendingEmail, resetPassword, isLoading, error, clearError } =
		useAuth()

	const form = useForm<ResetPasswordFormValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: {
			code: "",
			password: "",
			confirmPassword: "",
		},
	})

	useEffect(() => {
		if (!pendingEmail) {
			navigate("/auth/forgot-password")
		}
	}, [pendingEmail, navigate])

	async function onSubmit(data: ResetPasswordFormValues) {
		if (!pendingEmail) return

		try {
			await resetPassword({
				email: pendingEmail,
				code: data.code,
				newPassword: data.password,
			})
		} catch {
			// Error handled in hook
		}
	}

	if (!pendingEmail) {
		return null
	}

	return (
		<div className="flex min-h-screen w-full items-center justify-center p-6">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Reset your password</CardTitle>
					<CardDescription>
						Enter the code sent to{" "}
						<span className="font-medium text-foreground">{pendingEmail}</span>{" "}
						and your new password
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
								name="code"
								render={({ field }) => (
									<FormItem className="flex flex-col items-center">
										<FormLabel>Verification Code</FormLabel>
										<FormControl>
											<InputOTP
												maxLength={6}
												{...field}
											>
												<InputOTPGroup>
													<InputOTPSlot index={0} />
													<InputOTPSlot index={1} />
													<InputOTPSlot index={2} />
												</InputOTPGroup>
												<InputOTPSeparator />
												<InputOTPGroup>
													<InputOTPSlot index={3} />
													<InputOTPSlot index={4} />
													<InputOTPSlot index={5} />
												</InputOTPGroup>
											</InputOTP>
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
										<FormLabel>New Password</FormLabel>
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
										<FormLabel>Confirm New Password</FormLabel>
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
								{isLoading ? "Resetting..." : "Reset password"}
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
