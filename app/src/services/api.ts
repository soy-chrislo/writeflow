/**
 * @fileoverview API Client con manejo automático de autenticación
 *
 * Este módulo proporciona un cliente HTTP que:
 * - Inyecta automáticamente el idToken en el header Authorization
 * - Maneja refresh de tokens cuando recibe 401
 * - Previene race conditions con queue de refresh
 *
 * @see {@link file://./../../docs/adr/001-auth-token-management.md} para decisiones arquitectónicas
 *
 * @example
 * // GET request autenticado
 * const posts = await api.get<Post[]>('/my/posts');
 *
 * @example
 * // POST sin auth (ej: login)
 * const result = await api.post('/auth/login', credentials, { skipAuth: true });
 */

import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_KEY = import.meta.env.VITE_API_KEY || "";

/**
 * Error personalizado para respuestas HTTP no exitosas
 * @extends Error
 */
export class ApiError extends Error {
	/** Código de estado HTTP */
	status: number;
	/** Datos adicionales del error (body de la respuesta) */
	data?: unknown;

	constructor(status: number, message: string, data?: unknown) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.data = data;
	}
}

/**
 * Opciones para requests HTTP
 * @property skipAuth - Si true, no incluye Authorization header (útil para endpoints públicos)
 */
interface RequestOptions extends Omit<RequestInit, "body"> {
	body?: unknown;
	skipAuth?: boolean;
}

/**
 * Flag para evitar múltiples refresh simultáneos
 * @internal
 */
let isRefreshing = false;

/**
 * Promise compartida del refresh en curso
 * @internal
 */
let refreshPromise: Promise<boolean> | null = null;

/**
 * Intenta renovar los tokens usando el refreshToken almacenado
 *
 * Esta función es llamada automáticamente cuando un request recibe 401.
 * Usa un patrón de singleton para evitar múltiples refresh simultáneos.
 *
 * @returns true si refresh exitoso, false si falla (y hace logout)
 * @internal
 */
async function refreshToken(): Promise<boolean> {
	const { refreshToken: token, updateTokens, logout } = useAuthStore.getState();

	if (!token) {
		logout();
		toast.error("Your session has expired. Please log in again.");
		return false;
	}

	try {
		const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ refreshToken: token }),
		});

		if (!response.ok) {
			logout();
			toast.error("Your session has expired. Please log in again.");
			return false;
		}

		const json = await response.json();
		// Backend wraps response in { success: true, data: {...} }
		const data = json.data || json;
		updateTokens({
			accessToken: data.accessToken,
			idToken: data.idToken,
			expiresIn: data.expiresIn,
		});
		return true;
	} catch {
		logout();
		toast.error("Your session has expired. Please log in again.");
		return false;
	}
}

/**
 * Ejecuta un request HTTP con manejo automático de auth
 *
 * Flujo:
 * 1. Añade idToken al header si está disponible y skipAuth=false
 * 2. Ejecuta el request
 * 3. Si recibe 401, intenta refresh y retry
 * 4. Parsea respuesta JSON o lanza ApiError
 *
 * @template T - Tipo esperado de la respuesta
 * @param endpoint - Path del endpoint (ej: '/my/posts')
 * @param options - Opciones del request
 * @returns Respuesta parseada como JSON
 * @throws {ApiError} Si el response no es ok (status >= 400)
 */
async function request<T>(
	endpoint: string,
	options: RequestOptions = {},
): Promise<T> {
	const { body, headers, skipAuth, ...rest } = options;
	const { idToken } = useAuthStore.getState();

	const config: RequestInit = {
		...rest,
		headers: {
			"Content-Type": "application/json",
			...(API_KEY ? { "x-api-key": API_KEY } : {}),
			...(idToken && !skipAuth ? { Authorization: `Bearer ${idToken}` } : {}),
			...headers,
		},
	};

	if (body) {
		config.body = JSON.stringify(body);
	}

	let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

	// Refresh reactivo: si 401, intentar renovar token y retry
	if (response.status === 401 && !skipAuth && !endpoint.startsWith("/auth/")) {
		if (!isRefreshing) {
			isRefreshing = true;
			refreshPromise = refreshToken();
		}

		const refreshed = await refreshPromise;
		isRefreshing = false;
		refreshPromise = null;

		if (refreshed) {
			const { idToken: newToken } = useAuthStore.getState();
			config.headers = {
				...config.headers,
				Authorization: `Bearer ${newToken}`,
			};
			response = await fetch(`${API_BASE_URL}${endpoint}`, config);
		} else {
			throw new ApiError(401, "Session expired", null);
		}
	}

	if (!response.ok) {
		const errorData = await response.json().catch(() => null);
		// Backend error format: { success: false, error: "message" }
		const errorMessage =
			errorData?.error || errorData?.message || `HTTP error ${response.status}`;
		throw new ApiError(response.status, errorMessage, errorData);
	}

	if (response.status === 204) {
		return {} as T;
	}

	const json = await response.json();

	// Backend wraps responses in { success: true, data: T }
	// Extract the data field for consistent frontend usage
	if (
		json &&
		typeof json === "object" &&
		"success" in json &&
		json.data !== undefined
	) {
		return json.data as T;
	}

	return json as T;
}

/**
 * Cliente HTTP con métodos para cada verbo
 *
 * Todos los métodos inyectan automáticamente el token de auth.
 * Para requests sin auth, pasar `{ skipAuth: true }` en options.
 *
 * @example
 * // GET autenticado
 * const posts = await api.get<Post[]>('/my/posts');
 *
 * @example
 * // POST con body
 * const newPost = await api.post<Post>('/my/posts', { title: 'Hola' });
 *
 * @example
 * // DELETE
 * await api.delete('/my/posts/mi-post');
 */
export const api = {
	get: <T>(endpoint: string, options?: RequestOptions) =>
		request<T>(endpoint, { ...options, method: "GET" }),

	post: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
		request<T>(endpoint, { ...options, method: "POST", body }),

	put: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
		request<T>(endpoint, { ...options, method: "PUT", body }),

	patch: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
		request<T>(endpoint, { ...options, method: "PATCH", body }),

	delete: <T>(endpoint: string, options?: RequestOptions) =>
		request<T>(endpoint, { ...options, method: "DELETE" }),
};
