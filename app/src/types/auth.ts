export interface User {
	id: string
	email: string
	name: string
}

export interface AuthState {
	user: User | null
	isAuthenticated: boolean
	isLoading: boolean
	error: string | null
}

export interface LoginRequest {
	email: string
	password: string
}

export interface RegisterRequest {
	name: string
	email: string
	password: string
}

export interface ConfirmCodeRequest {
	email: string
	code: string
}

export interface ForgotPasswordRequest {
	email: string
}

export interface ResetPasswordRequest {
	email: string
	code: string
	newPassword: string
}

export interface AuthResponse {
	user: User
	accessToken: string
	refreshToken: string
}

export interface MessageResponse {
	message: string
}
