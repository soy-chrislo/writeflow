import { useEffect } from "react"
import { Link, useNavigate } from "react-router"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
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

const confirmSchema = z.object({
	code: z.string().length(6, "Code must be 6 digits"),
})

type ConfirmFormValues = z.infer<typeof confirmSchema>

export default function ConfirmCode() {
	const navigate = useNavigate()
	const {
		pendingEmail,
		confirmCode,
		resendCode,
		isLoading,
		error,
		clearError,
	} = useAuth()

	const form = useForm<ConfirmFormValues>({
		resolver: zodResolver(confirmSchema),
		defaultValues: {
			code: "",
		},
	})

	useEffect(() => {
		if (!pendingEmail) {
			navigate("/auth/login")
		}
	}, [pendingEmail, navigate])

	async function onSubmit(data: ConfirmFormValues) {
		if (!pendingEmail) return

		try {
			await confirmCode({
				email: pendingEmail,
				code: data.code,
			})
		} catch {
			// Error handled in hook
		}
	}

	async function handleResend() {
		if (!pendingEmail) return

		try {
			await resendCode(pendingEmail)
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
					<CardTitle className="text-2xl">Verify your email</CardTitle>
					<CardDescription>
						We sent a 6-digit code to{" "}
						<span className="font-medium text-foreground">{pendingEmail}</span>
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
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? "Verifying..." : "Verify"}
							</Button>
						</form>
					</Form>

					<div className="mt-4 text-center text-sm">
						Didn't receive the code?{" "}
						<button
							type="button"
							onClick={handleResend}
							disabled={isLoading}
							className="text-primary hover:underline disabled:opacity-50"
						>
							Resend
						</button>
					</div>

					<div className="mt-2 text-center text-sm">
						<Link
							to="/auth/login"
							className="text-muted-foreground hover:text-primary"
						>
							Back to sign in
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
