import { useCallback } from "react"
import { useNavigate } from "react-router"
import { useAuthStore } from "@/store/auth"
import { authService } from "@/services/auth"
import { ApiError } from "@/services/api"
import type {
	LoginRequest,
	RegisterRequest,
	ConfirmCodeRequest,
	ForgotPasswordRequest,
	ResetPasswordRequest,
} from "@/types/auth"

export function useAuth() {
	const navigate = useNavigate()
	const {
		user,
		isAuthenticated,
		isLoading,
		error,
		pendingEmail,
		setUser,
		setLoading,
		setError,
		setPendingEmail,
		logout: logoutStore,
		clearError,
	} = useAuthStore()

	const login = useCallback(
		async (data: LoginRequest) => {
			setLoading(true)
			clearError()

			try {
				const response = await authService.login(data)
				setUser(response.user, response.accessToken)
				navigate("/")
				return response
			} catch (err) {
				const message =
					err instanceof ApiError ? err.message : "Failed to login"
				setError(message)
				throw err
			}
		},
		[navigate, setUser, setLoading, setError, clearError]
	)

	const register = useCallback(
		async (data: RegisterRequest) => {
			setLoading(true)
			clearError()

			try {
				const response = await authService.register(data)
				setPendingEmail(data.email)
				navigate("/auth/confirm")
				return response
			} catch (err) {
				const message =
					err instanceof ApiError ? err.message : "Failed to register"
				setError(message)
				throw err
			}
		},
		[navigate, setLoading, setError, clearError, setPendingEmail]
	)

	const confirmCode = useCallback(
		async (data: ConfirmCodeRequest) => {
			setLoading(true)
			clearError()

			try {
				const response = await authService.confirmCode(data)
				setUser(response.user, response.accessToken)
				setPendingEmail(null)
				navigate("/")
				return response
			} catch (err) {
				const message =
					err instanceof ApiError ? err.message : "Invalid confirmation code"
				setError(message)
				throw err
			}
		},
		[navigate, setUser, setLoading, setError, clearError, setPendingEmail]
	)

	const resendCode = useCallback(
		async (email: string) => {
			setLoading(true)
			clearError()

			try {
				const response = await authService.resendCode(email)
				return response
			} catch (err) {
				const message =
					err instanceof ApiError ? err.message : "Failed to resend code"
				setError(message)
				throw err
			} finally {
				setLoading(false)
			}
		},
		[setLoading, setError, clearError]
	)

	const forgotPassword = useCallback(
		async (data: ForgotPasswordRequest) => {
			setLoading(true)
			clearError()

			try {
				const response = await authService.forgotPassword(data)
				setPendingEmail(data.email)
				navigate("/auth/reset-password")
				return response
			} catch (err) {
				const message =
					err instanceof ApiError ? err.message : "Failed to send reset email"
				setError(message)
				throw err
			}
		},
		[navigate, setLoading, setError, clearError, setPendingEmail]
	)

	const resetPassword = useCallback(
		async (data: ResetPasswordRequest) => {
			setLoading(true)
			clearError()

			try {
				const response = await authService.resetPassword(data)
				setPendingEmail(null)
				navigate("/auth/login")
				return response
			} catch (err) {
				const message =
					err instanceof ApiError ? err.message : "Failed to reset password"
				setError(message)
				throw err
			}
		},
		[navigate, setLoading, setError, clearError, setPendingEmail]
	)

	const logout = useCallback(async () => {
		try {
			await authService.logout()
		} catch {
			// Ignore errors on logout
		} finally {
			logoutStore()
			navigate("/auth/login")
		}
	}, [navigate, logoutStore])

	return {
		user,
		isAuthenticated,
		isLoading,
		error,
		pendingEmail,
		login,
		register,
		confirmCode,
		resendCode,
		forgotPassword,
		resetPassword,
		logout,
		clearError,
	}
}
