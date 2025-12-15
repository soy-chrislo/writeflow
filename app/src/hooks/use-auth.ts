import { jwtDecode } from "jwt-decode";
import { useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ApiError } from "@/services/api";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import type {
	CognitoIdTokenClaims,
	ConfirmCodeRequest,
	ForgotPasswordRequest,
	LoginRequest,
	RegisterRequest,
	ResetPasswordRequest,
} from "@/types/auth";

interface LoginOptions {
	/** Si true, no navega automáticamente después del login */
	skipNavigate?: boolean;
}

export function useAuth() {
	const navigate = useNavigate();
	const {
		user,
		isAuthenticated,
		isLoading,
		isInitialized,
		error,
		pendingEmail,
		refreshToken,
		setTokens,
		updateTokens,
		setLoading,
		setInitialized,
		setError,
		setPendingEmail,
		logout: logoutStore,
		clearError,
		isTokenExpired,
		getTimeUntilExpiry,
	} = useAuthStore();

	const login = useCallback(
		async (data: LoginRequest, options?: LoginOptions) => {
			setLoading(true);
			clearError();

			try {
				const response = await authService.login(data);

				// Extract user info from idToken claims
				const claims = jwtDecode<CognitoIdTokenClaims>(response.idToken);
				const user = {
					id: claims.sub,
					email: claims.email || data.email,
					name: claims.name || claims.email || data.email,
				};

				setTokens({
					user,
					accessToken: response.accessToken,
					idToken: response.idToken,
					refreshToken: response.refreshToken,
				});
				if (!options?.skipNavigate) {
					navigate("/dashboard");
				}
				return response;
			} catch (err) {
				const message =
					err instanceof ApiError ? err.message : "Failed to login";

				// If account not confirmed, resend code and redirect to confirm page
				if (
					err instanceof ApiError &&
					message.toLowerCase().includes("not confirmed")
				) {
					setPendingEmail(data.email);
					// Send confirmation code automatically
					authService.resendCode(data.email).catch(() => {
						// Ignore errors, user can manually resend
					});
					toast.info(
						"Your account is not confirmed. We sent a new verification code to your email.",
					);
					navigate("/auth/confirm");
				} else {
					setError(message);
				}
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[navigate, setTokens, setLoading, setError, clearError, setPendingEmail],
	);

	const register = useCallback(
		async (data: RegisterRequest) => {
			setLoading(true);
			clearError();

			try {
				const response = await authService.register({
					email: data.email,
					password: data.password,
				});
				setPendingEmail(data.email);
				toast.success(
					"Account created! Please check your email for the confirmation code.",
				);
				navigate("/auth/confirm");
				return response;
			} catch (err) {
				// Check if registration is disabled (403)
				if (err instanceof ApiError && err.status === 403) {
					setError("REGISTRATION_DISABLED");
					throw err;
				}

				const message =
					err instanceof ApiError ? err.message : "Failed to register";
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[navigate, setLoading, setError, clearError, setPendingEmail],
	);

	const confirmCode = useCallback(
		async (data: ConfirmCodeRequest) => {
			setLoading(true);
			clearError();

			try {
				const response = await authService.confirmCode(data);
				setPendingEmail(null);
				toast.success("Email verified! Please sign in.");
				navigate("/auth/login");
				return response;
			} catch (err) {
				// Check if registration is disabled (403)
				if (err instanceof ApiError && err.status === 403) {
					setError("REGISTRATION_DISABLED");
					throw err;
				}

				const message =
					err instanceof ApiError ? err.message : "Invalid confirmation code";
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[navigate, setLoading, setError, clearError, setPendingEmail],
	);

	const resendCode = useCallback(
		async (email: string) => {
			setLoading(true);
			clearError();

			try {
				const response = await authService.resendCode(email);
				toast.success("Confirmation code sent! Check your email.");
				return response;
			} catch (err) {
				// Check if registration is disabled (403)
				if (err instanceof ApiError && err.status === 403) {
					setError("REGISTRATION_DISABLED");
					throw err;
				}

				const message =
					err instanceof ApiError ? err.message : "Failed to resend code";
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[setLoading, setError, clearError],
	);

	const forgotPassword = useCallback(
		async (data: ForgotPasswordRequest) => {
			setLoading(true);
			clearError();

			try {
				const response = await authService.forgotPassword(data);
				setPendingEmail(data.email);
				toast.success("Password reset code sent! Check your email.");
				navigate("/auth/reset-password");
				return response;
			} catch (err) {
				const message =
					err instanceof ApiError ? err.message : "Failed to send reset email";
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[navigate, setLoading, setError, clearError, setPendingEmail],
	);

	const resetPassword = useCallback(
		async (data: ResetPasswordRequest) => {
			setLoading(true);
			clearError();

			try {
				const response = await authService.resetPassword(data);
				setPendingEmail(null);
				toast.success("Password reset successfully! Please sign in.");
				navigate("/auth/login");
				return response;
			} catch (err) {
				const message =
					err instanceof ApiError ? err.message : "Failed to reset password";
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[navigate, setLoading, setError, clearError, setPendingEmail],
	);

	const logout = useCallback(async () => {
		try {
			await authService.logout();
		} catch {
			// Ignore errors on logout
		} finally {
			logoutStore();
			toast.success("Logged out successfully");
			navigate("/auth/login");
		}
	}, [navigate, logoutStore]);

	const refreshAccessToken = useCallback(async () => {
		if (!refreshToken) {
			logoutStore();
			return false;
		}

		try {
			const response = await authService.refreshToken(refreshToken);
			updateTokens({
				accessToken: response.accessToken,
				idToken: response.idToken,
				expiresIn: response.expiresIn,
			});
			return true;
		} catch {
			logoutStore();
			return false;
		}
	}, [refreshToken, updateTokens, logoutStore]);

	const initializeAuth = useCallback(async () => {
		if (!refreshToken) {
			setInitialized(true);
			return;
		}

		if (isTokenExpired()) {
			const success = await refreshAccessToken();
			if (!success) {
				logoutStore();
			}
		}
		setInitialized(true);
	}, [
		refreshToken,
		isTokenExpired,
		refreshAccessToken,
		setInitialized,
		logoutStore,
	]);

	return {
		user,
		isAuthenticated,
		isLoading,
		isInitialized,
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
		refreshAccessToken,
		initializeAuth,
		isTokenExpired,
		getTimeUntilExpiry,
	};
}
