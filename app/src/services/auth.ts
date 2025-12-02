import { api } from "./api"
import type {
	LoginRequest,
	RegisterRequest,
	ConfirmCodeRequest,
	ForgotPasswordRequest,
	ResetPasswordRequest,
	AuthResponse,
	MessageResponse,
} from "@/types/auth"

const AUTH_ENDPOINT = "/auth"

export const authService = {
	login: async (data: LoginRequest) => {
		return api.post<AuthResponse>(`${AUTH_ENDPOINT}/login`, data)
	},

	register: async (data: RegisterRequest) => {
		return api.post<MessageResponse>(`${AUTH_ENDPOINT}/register`, data)
	},

	confirmCode: async (data: ConfirmCodeRequest) => {
		return api.post<AuthResponse>(`${AUTH_ENDPOINT}/confirm`, data)
	},

	resendCode: async (email: string) => {
		return api.post<MessageResponse>(`${AUTH_ENDPOINT}/resend-code`, { email })
	},

	forgotPassword: async (data: ForgotPasswordRequest) => {
		return api.post<MessageResponse>(`${AUTH_ENDPOINT}/forgot-password`, data)
	},

	resetPassword: async (data: ResetPasswordRequest) => {
		return api.post<MessageResponse>(`${AUTH_ENDPOINT}/reset-password`, data)
	},

	logout: async () => {
		return api.post<MessageResponse>(`${AUTH_ENDPOINT}/logout`, {})
	},

	refreshToken: async (refreshToken: string) => {
		return api.post<AuthResponse>(`${AUTH_ENDPOINT}/refresh`, { refreshToken })
	},
}
