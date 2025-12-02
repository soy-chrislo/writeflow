import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/types/auth"

interface AuthState {
	user: User | null
	accessToken: string | null
	isAuthenticated: boolean
	isLoading: boolean
	error: string | null
	pendingEmail: string | null
}

interface AuthActions {
	setUser: (user: User, accessToken: string) => void
	setLoading: (isLoading: boolean) => void
	setError: (error: string | null) => void
	setPendingEmail: (email: string | null) => void
	logout: () => void
	clearError: () => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
	user: null,
	accessToken: null,
	isAuthenticated: false,
	isLoading: false,
	error: null,
	pendingEmail: null,
}

export const useAuthStore = create<AuthStore>()(
	persist(
		(set) => ({
			...initialState,

			setUser: (user, accessToken) =>
				set({
					user,
					accessToken,
					isAuthenticated: true,
					error: null,
				}),

			setLoading: (isLoading) => set({ isLoading }),

			setError: (error) => set({ error, isLoading: false }),

			setPendingEmail: (pendingEmail) => set({ pendingEmail }),

			logout: () =>
				set({
					...initialState,
				}),

			clearError: () => set({ error: null }),
		}),
		{
			name: "writeflow-auth",
			partialize: (state) => ({
				user: state.user,
				accessToken: state.accessToken,
				isAuthenticated: state.isAuthenticated,
			}),
		}
	)
)
