/**
 * @fileoverview Hook para refresh proactivo de tokens
 *
 * Este hook programa un timer para renovar tokens ANTES de que expiren,
 * evitando interrupciones en la UX del usuario.
 *
 * @see {@link file://./../../docs/adr/001-auth-token-management.md} para decisiones arquitectónicas
 */

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth";

/**
 * Buffer de tiempo antes de expiración para hacer refresh (5 minutos)
 * Si el token expira en 60 min, el refresh se hace a los 55 min.
 */
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

/**
 * Hook que maneja el refresh proactivo de tokens
 *
 * Debe usarse en el componente raíz de la aplicación (App.tsx).
 * Programa un setTimeout para renovar tokens antes de que expiren.
 *
 * Flujo:
 * 1. Calcula cuánto falta para expiración
 * 2. Programa refresh para (expiración - 5 minutos)
 * 3. Al ejecutar refresh, reprograma para el nuevo token
 * 4. Si refresh falla, hace logout
 *
 * @example
 * // En App.tsx
 * function App() {
 *   useTokenRefresh();
 *   return <Routes>...</Routes>;
 * }
 */
export function useTokenRefresh() {
	const {
		isAuthenticated,
		refreshToken,
		getTimeUntilExpiry,
		updateTokens,
		logout,
	} = useAuthStore();
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!isAuthenticated || !refreshToken) {
			return;
		}

		const scheduleRefresh = () => {
			const timeUntilExpiry = getTimeUntilExpiry();

			if (timeUntilExpiry === null) {
				return;
			}

			const timeUntilRefresh = timeUntilExpiry - REFRESH_BUFFER_MS;

			if (timeUntilRefresh <= 0) {
				performRefresh();
				return;
			}

			timeoutRef.current = setTimeout(() => {
				performRefresh();
			}, timeUntilRefresh);
		};

		const performRefresh = async () => {
			try {
				const response = await authService.refreshToken(refreshToken);
				updateTokens({
					accessToken: response.accessToken,
					idToken: response.idToken,
					expiresIn: response.expiresIn,
				});
				scheduleRefresh();
			} catch {
				logout();
				toast.error("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
			}
		};

		scheduleRefresh();

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [isAuthenticated, refreshToken, getTimeUntilExpiry, updateTokens, logout]);
}
