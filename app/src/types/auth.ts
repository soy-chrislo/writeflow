// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
	id: string;
	email: string;
	name: string;
}

export interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

// ============================================================================
// AWS COGNITO JWT CLAIMS
// Los datos dentro de un JWT se llaman "claims" (afirmaciones/reclamaciones)
// Docs: https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html
// ============================================================================

/**
 * Claims base compartidos entre ID Token y Access Token
 */
interface CognitoBaseJwtClaims {
	/** Subject - ID único del usuario (UUID) */
	sub: string;
	/** Issuer - URL del user pool (https://cognito-idp.{region}.amazonaws.com/{userPoolId}) */
	iss: string;
	/** Issued At - Unix timestamp de cuando se emitió el token */
	iat: number;
	/** Expiration - Unix timestamp de cuando expira el token */
	exp: number;
	/** JWT ID - Identificador único del token */
	jti: string;
	/** Authentication Time - Unix timestamp de cuando el usuario se autenticó */
	auth_time: number;
	/** Origin JWT ID - Para revocación de tokens (si está habilitado) */
	origin_jti?: string;
}

/**
 * Claims del ID Token de AWS Cognito
 * Contiene información de identidad del usuario
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-id-token.html
 */
export interface CognitoIdTokenClaims extends CognitoBaseJwtClaims {
	/** Tipo de token - siempre "id" para ID tokens */
	token_use: "id";
	/** Audience - App Client ID */
	aud: string;
	/** Email del usuario */
	email?: string;
	/** Si el email está verificado */
	email_verified?: boolean;
	/** Username en Cognito */
	"cognito:username": string;
	/** Grupos a los que pertenece el usuario */
	"cognito:groups"?: string[];
	/** Rol IAM preferido (si usa identity pools) */
	"cognito:preferred_role"?: string;
	/** Roles IAM disponibles (si usa identity pools) */
	"cognito:roles"?: string[];
	/** Nombre del usuario (si está configurado como atributo) */
	name?: string;
	/** Nombre de familia (si está configurado) */
	family_name?: string;
	/** Nombre de pila (si está configurado) */
	given_name?: string;
	/** Número de teléfono (si está configurado) */
	phone_number?: string;
	/** Si el teléfono está verificado */
	phone_number_verified?: boolean;
	/** Información de identidades federadas (Google, Facebook, etc.) */
	identities?: string;
	/**
	 * Atributos custom definidos en el user pool
	 * Siempre tienen prefijo "custom:"
	 * @example "custom:tenant_id", "custom:role"
	 */
	[key: `custom:${string}`]: string | number | boolean | undefined;
}

/**
 * Claims del Access Token de AWS Cognito
 * Contiene información de autorización (scopes, permisos)
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-access-token.html
 */
export interface CognitoAccessTokenClaims extends CognitoBaseJwtClaims {
	/** Tipo de token - siempre "access" para Access tokens */
	token_use: "access";
	/** App Client ID */
	client_id: string;
	/** Username en Cognito */
	username: string;
	/**
	 * Scopes OAuth 2.0 que el token autoriza
	 * @example "openid email profile aws.cognito.signin.user.admin"
	 */
	scope: string;
	/** Versión del token (si se usa pre-token generation trigger V2+) */
	version?: number;
	/** Grupos a los que pertenece el usuario (requiere V2+ trigger) */
	"cognito:groups"?: string[];
}

/**
 * Tipo genérico para decodificar cualquier JWT de Cognito
 * Útil cuando no sabes qué tipo de token estás decodificando
 */
export type CognitoJwtClaims = CognitoIdTokenClaims | CognitoAccessTokenClaims;

/**
 * Claims mínimos necesarios para verificar expiración
 * Usado internamente en el store para no requerir todos los claims
 */
export interface JwtExpirationClaims {
	exp: number;
	iat: number;
	sub: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	email: string;
	password: string;
}

export interface ConfirmCodeRequest {
	email: string;
	code: string;
}

export interface ForgotPasswordRequest {
	email: string;
}

export interface ResetPasswordRequest {
	email: string;
	code: string;
	newPassword: string;
}

/**
 * Response from POST /auth/login
 * Backend returns tokens directly, no user object
 */
export interface LoginResponse {
	accessToken: string;
	idToken: string;
	refreshToken: string;
	expiresIn: number;
}

/**
 * Response from POST /auth/register
 */
export interface RegisterResponse {
	userId: string;
	email: string;
	confirmed: boolean;
}

/**
 * Response from POST /auth/refresh
 * Note: Does not return a new refreshToken
 */
export interface RefreshTokenResponse {
	accessToken: string;
	idToken: string;
	expiresIn: number;
}

/**
 * Response from POST /auth/confirm, /auth/forgot-password, /auth/reset-password, /auth/resend-code
 */
export interface MessageResponse {
	message: string;
	destination?: string;
	deliveryMedium?: string;
}

/**
 * @deprecated Use LoginResponse instead
 */
export interface AuthResponse {
	user: User;
	accessToken: string;
	idToken?: string;
	refreshToken: string;
	expiresIn?: number;
}
