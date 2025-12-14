/**
 * @fileoverview Auth Store - Gestión centralizada del estado de autenticación
 *
 * Este store maneja:
 * - Almacenamiento de tokens (accessToken, idToken, refreshToken)
 * - Estado de autenticación del usuario
 * - Persistencia en localStorage via Zustand persist
 * - Helpers para verificar expiración de tokens
 *
 * @see {@link file://./../../docs/adr/001-auth-token-management.md} para decisiones arquitectónicas
 *
 * @example
 * // Acceder al estado
 * const { user, isAuthenticated } = useAuthStore();
 *
 * @example
 * // Acceder fuera de React (ej: en api.ts)
 * const { idToken } = useAuthStore.getState();
 */

import { jwtDecode } from "jwt-decode";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JwtExpirationClaims, User } from "@/types/auth";

/**
 * Estado de autenticación
 * @property user - Usuario autenticado o null
 * @property accessToken - Token de acceso JWT (para scopes/permisos)
 * @property idToken - Token de identidad JWT (usado en Authorization header)
 * @property refreshToken - Token para renovar sesión
 * @property tokenExpiresAt - Timestamp de expiración en ms
 * @property isAuthenticated - Si hay sesión activa
 * @property isInitialized - Si el store ya verificó persistencia
 * @property isLoading - Si hay operación de auth en curso
 * @property error - Mensaje de error de la última operación
 * @property pendingEmail - Email pendiente de confirmación (registro/reset)
 */
interface AuthState {
	user: User | null;
	accessToken: string | null;
	idToken: string | null;
	refreshToken: string | null;
	tokenExpiresAt: number | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	isInitialized: boolean;
	error: string | null;
	pendingEmail: string | null;
}

/**
 * Acciones disponibles en el store
 */
interface AuthActions {
	/**
	 * Guarda todos los tokens después de login/registro exitoso
	 * @param tokens - Objeto con user, accessToken, idToken (opcional), refreshToken
	 */
	setTokens: (tokens: {
		user: User;
		accessToken: string;
		idToken?: string;
		refreshToken: string;
	}) => void;

	/**
	 * Actualiza tokens después de un refresh (no cambia user ni refreshToken)
	 * @param tokens - Nuevos accessToken e idToken
	 */
	updateTokens: (tokens: {
		accessToken: string;
		idToken?: string;
		expiresIn?: number;
	}) => void;

	setLoading: (isLoading: boolean) => void;
	setInitialized: (isInitialized: boolean) => void;
	setError: (error: string | null) => void;
	setPendingEmail: (email: string | null) => void;

	/**
	 * Limpia el estado de auth (logout)
	 * Mantiene isInitialized=true para evitar loading flash
	 */
	logout: () => void;

	clearError: () => void;

	/**
	 * Verifica si el token actual está expirado
	 * @returns true si expirado o no hay token
	 */
	isTokenExpired: () => boolean;

	/**
	 * Obtiene milisegundos hasta expiración del token
	 * @returns ms restantes, negativo si expirado, null si no hay token
	 */
	getTimeUntilExpiry: () => number | null;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
	user: null,
	accessToken: null,
	idToken: null,
	refreshToken: null,
	tokenExpiresAt: null,
	isAuthenticated: false,
	isLoading: false,
	isInitialized: false,
	error: null,
	pendingEmail: null,
};

/**
 * Extrae timestamp de expiración de un JWT
 * @param token - JWT string
 * @returns Timestamp en ms o null si inválido
 */
const getExpirationFromToken = (token: string): number | null => {
	try {
		const decoded = jwtDecode<JwtExpirationClaims>(token);
		return decoded.exp * 1000;
	} catch {
		return null;
	}
};

export const useAuthStore = create<AuthStore>()(
	persist(
		(set, get) => ({
			...initialState,

			setTokens: ({ user, accessToken, idToken, refreshToken }) => {
				const tokenExpiresAt = getExpirationFromToken(accessToken);
				set({
					user,
					accessToken,
					idToken: idToken ?? accessToken,
					refreshToken,
					tokenExpiresAt,
					isAuthenticated: true,
					isInitialized: true,
					error: null,
				});
			},

			updateTokens: ({ accessToken, idToken, expiresIn }) => {
				const tokenExpiresAt = expiresIn
					? Date.now() + expiresIn * 1000
					: getExpirationFromToken(accessToken);
				set({
					accessToken,
					idToken: idToken ?? accessToken,
					tokenExpiresAt,
					error: null,
				});
			},

			setLoading: (isLoading) => set({ isLoading }),

			setInitialized: (isInitialized) => set({ isInitialized }),

			setError: (error) => set({ error, isLoading: false }),

			setPendingEmail: (pendingEmail) => set({ pendingEmail }),

			logout: () =>
				set({
					...initialState,
					isInitialized: true,
				}),

			clearError: () => set({ error: null }),

			isTokenExpired: () => {
				const { tokenExpiresAt } = get();
				if (!tokenExpiresAt) return true;
				return Date.now() >= tokenExpiresAt;
			},

			getTimeUntilExpiry: () => {
				const { tokenExpiresAt } = get();
				if (!tokenExpiresAt) return null;
				return tokenExpiresAt - Date.now();
			},
		}),
		{
			name: "writeflow-auth",
			partialize: (state) => ({
				user: state.user,
				accessToken: state.accessToken,
				idToken: state.idToken,
				refreshToken: state.refreshToken,
				tokenExpiresAt: state.tokenExpiresAt,
				isAuthenticated: state.isAuthenticated,
			}),
		},
	),
);
