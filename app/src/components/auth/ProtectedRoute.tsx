/**
 * @fileoverview Componente de protección de rutas
 *
 * Wrapper que verifica autenticación antes de renderizar children.
 * Si no está autenticado, redirige a login guardando la ruta original.
 */

import { useEffect } from "react";
import { Navigate, useLocation } from "react-router";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/auth";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

/**
 * Componente que protege rutas requiriendo autenticación
 *
 * Estados:
 * 1. `isInitialized=false`: Muestra spinner mientras verifica localStorage
 * 2. `isAuthenticated=false`: Redirige a /auth/login con returnUrl
 * 3. `isAuthenticated=true`: Renderiza children
 *
 * @example
 * // En App.tsx con React Router
 * <Route
 *   element={
 *     <ProtectedRoute>
 *       <Layout />
 *     </ProtectedRoute>
 *   }
 * >
 *   <Route index element={<Home />} />
 *   <Route path="/posts" element={<Posts />} />
 * </Route>
 *
 * @example
 * // Acceder a returnUrl después de login
 * const location = useLocation();
 * const from = location.state?.from || '/';
 * navigate(from);
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
	const location = useLocation();
	const { isAuthenticated, isInitialized, setInitialized } = useAuthStore();

	useEffect(() => {
		if (!isInitialized) {
			setInitialized(true);
		}
	}, [isInitialized, setInitialized]);

	if (!isInitialized) {
		return (
			<div className="flex h-screen w-full items-center justify-center">
				<Spinner className="size-8" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<Navigate to="/auth/login" state={{ from: location.pathname }} replace />
		);
	}

	return <>{children}</>;
}
