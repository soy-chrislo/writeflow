# ADR 001: Gestión de Tokens de Autenticación

**Estado:** Aceptado
**Fecha:** 2025-12-02
**Autores:** Claude Code

## Contexto

Writeflow utiliza AWS Cognito como proveedor de identidad. El backend devuelve tres tokens tras autenticación exitosa:

- **accessToken**: Token JWT para autorización (scopes, permisos)
- **idToken**: Token JWT con claims de identidad del usuario (email, sub, etc.)
- **refreshToken**: Token opaco para renovar sesiones sin re-autenticación

Necesitamos definir:
1. Qué token usar para autorizar requests al API
2. Dónde almacenar los tokens en el frontend
3. Cómo y cuándo renovar tokens expirados

## Decisión

### 1. Token para Authorization Header

**Decisión:** Usar `idToken` en el header `Authorization: Bearer {idToken}`

**Alternativas consideradas:**
| Token | Pros | Contras |
|-------|------|---------|
| accessToken | Estándar OAuth 2.0, contiene scopes | No contiene claims de usuario |
| idToken | Contiene claims de usuario, el backend ya lo valida | Menos "estándar" para APIs |

**Justificación:** El backend de Writeflow ya está configurado para validar el `idToken` y extraer información del usuario (sub, email) de sus claims. Cambiar a `accessToken` requeriría modificaciones en el backend.

### 2. Almacenamiento de Tokens

**Decisión:** Almacenar todos los tokens en localStorage via Zustand persist

```typescript
// store/auth.ts
partialize: (state) => ({
  accessToken: state.accessToken,
  idToken: state.idToken,
  refreshToken: state.refreshToken,
  tokenExpiresAt: state.tokenExpiresAt,
  // ...
})
```

**Alternativas consideradas:**
| Almacenamiento | XSS Risk | CSRF Risk | Persistencia | Complejidad |
|----------------|----------|-----------|--------------|-------------|
| localStorage | Alto | Ninguno | Sí | Baja |
| Memory only | Bajo | Ninguno | No | Media |
| httpOnly cookie | Bajo | Alto | Sí | Alta (requiere backend) |
| Híbrido (memory + httpOnly) | Bajo | Medio | Parcial | Alta |

**Justificación:**
- El backend actual envía `refreshToken` en el body del response, no en httpOnly cookie
- Implementar httpOnly cookies requeriría cambios en el backend
- localStorage es suficiente para MVP con las siguientes mitigaciones:
  - CSP headers configurados
  - Sanitización de contenido HTML (ya implementada con `sanitize.ts`)
  - No uso de `dangerouslySetInnerHTML` con contenido no sanitizado

**Trade-offs aceptados:**
- Tokens vulnerables a XSS si hay vulnerabilidad en la app
- Mitigación: auditorías de dependencias, CSP estricto

### 3. Estrategia de Refresh de Tokens

**Decisión:** Estrategia híbrida - Refresh proactivo + Refresh reactivo

#### Refresh Proactivo
```typescript
// hooks/use-token-refresh.ts
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutos antes de expirar

// Se programa un setTimeout para renovar antes de que expire
```

#### Refresh Reactivo
```typescript
// services/api.ts
if (response.status === 401 && !skipAuth) {
  // Intentar refresh y retry del request original
}
```

**Alternativas consideradas:**
| Estrategia | UX | Complejidad | Requests extra |
|------------|-----|-------------|----------------|
| Solo reactivo | Primer request falla, luego retry | Baja | Solo cuando expira |
| Solo proactivo | Sin interrupciones | Media | Cada ~55 min |
| Híbrido | Sin interrupciones + fallback | Alta | Cada ~55 min |

**Justificación:** El híbrido ofrece la mejor UX:
- Proactivo evita que el usuario vea errores 401
- Reactivo es fallback si el timer falla (ej: tab en background, laptop en sleep)

### 4. Manejo de Requests Concurrentes durante Refresh

**Decisión:** Queue de requests con flag `isRefreshing`

```typescript
// services/api.ts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Si hay refresh en curso, esperar a que termine antes de retry
if (!isRefreshing) {
  isRefreshing = true;
  refreshPromise = refreshToken();
}
const refreshed = await refreshPromise;
```

**Justificación:** Evita race conditions donde múltiples requests 401 disparan múltiples refresh simultáneos, lo que podría:
- Generar tokens inconsistentes
- Causar logout innecesario si un refresh falla mientras otro tiene éxito

## Consecuencias

### Positivas
- UX fluida sin interrupciones por tokens expirados
- Código centralizado en `api.ts` - los componentes no manejan auth
- Persistencia de sesión entre recargas de página
- Queue de refresh previene race conditions

### Negativas
- Tokens en localStorage son vulnerables a XSS
- Complejidad adicional con estrategia híbrida
- `refreshToken` debe enviarse en cada request de refresh (no está en cookie)

### Riesgos
- Si hay XSS, atacante puede robar todos los tokens
- Mitigación: CSP, sanitización, auditorías de deps

## Archivos Relacionados

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/store/auth.ts` | Estado de auth, persistencia, helpers de expiración |
| `src/services/api.ts` | Inyección de token, refresh reactivo |
| `src/hooks/use-token-refresh.ts` | Refresh proactivo con timer |
| `src/hooks/use-auth.ts` | Acciones de auth (login, logout, refresh) |
| `src/components/auth/ProtectedRoute.tsx` | Guard de rutas protegidas |

## Referencias

- [AWS Cognito Token Types](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html)
- [JWT Storage Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Token Refresh Patterns](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/)
