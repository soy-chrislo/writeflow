# Módulo de Autenticación

Guía rápida para usar y extender el sistema de autenticación de Writeflow.

## Arquitectura

```
src/
├── store/auth.ts              # Estado global (Zustand)
├── services/
│   ├── api.ts                 # HTTP client con auth automático
│   └── auth.ts                # Endpoints de auth
├── hooks/
│   ├── use-auth.ts            # Hook principal de auth
│   └── use-token-refresh.ts   # Refresh proactivo
├── components/auth/
│   └── ProtectedRoute.tsx     # Guard de rutas
└── types/auth.ts              # Tipos TypeScript
```

## Uso Básico

### Verificar si usuario está autenticado

```tsx
import { useAuthStore } from "@/store/auth";

function MyComponent() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <p>No autenticado</p>;
  }

  return <p>Hola, {user?.name}</p>;
}
```

### Login

```tsx
import { useAuth } from "@/hooks/use-auth";

function LoginForm() {
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login({ email, password });
    // Redirige automáticamente a "/" si exitoso
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="text-red-500">{error}</p>}
      {/* inputs... */}
      <button disabled={isLoading}>
        {isLoading ? "Cargando..." : "Iniciar sesión"}
      </button>
    </form>
  );
}
```

### Logout

```tsx
import { useAuth } from "@/hooks/use-auth";

function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button onClick={logout}>
      Cerrar sesión
    </button>
  );
}
```

### Proteger una ruta

```tsx
// En App.tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

<Route
  element={
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  }
>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/settings" element={<Settings />} />
</Route>
```

### Hacer requests autenticados

```tsx
import { api } from "@/services/api";

// El token se añade automáticamente
const posts = await api.get<Post[]>("/my/posts");

// POST con body
const newPost = await api.post<Post>("/my/posts", {
  title: "Mi post",
  contentKey: "abc123",
});

// Request sin auth (público)
const publicPosts = await api.get<Post[]>("/posts", { skipAuth: true });
```

### Acceder al token fuera de React

```tsx
import { useAuthStore } from "@/store/auth";

// En un service o utility
const { idToken } = useAuthStore.getState();

// Verificar expiración
const isExpired = useAuthStore.getState().isTokenExpired();
```

## Flujos de Auth

### Registro nuevo usuario

```
1. Usuario llena formulario de registro
2. useAuth().register() → POST /auth/register
3. Backend crea usuario en Cognito (estado UNCONFIRMED)
4. Redirige a /auth/confirm con pendingEmail guardado
5. Usuario ingresa código de 6 dígitos
6. useAuth().confirmCode() → POST /auth/confirm
7. Backend confirma y retorna tokens
8. setTokens() guarda en store
9. Redirige a "/"
```

### Login existente

```
1. Usuario ingresa email/password
2. useAuth().login() → POST /auth/login
3. Backend valida con Cognito
4. Retorna { user, accessToken, idToken, refreshToken }
5. setTokens() guarda en store + localStorage
6. Redirige a "/"
```

### Refresh de tokens

```
Proactivo (useTokenRefresh):
1. Timer se programa para 5 min antes de expiración
2. Al dispararse, llama authService.refreshToken()
3. updateTokens() actualiza store
4. Se reprograma timer para nuevo token

Reactivo (api.ts):
1. Request recibe 401
2. Llama refreshToken()
3. Si exitoso, retry del request original
4. Si falla, logout()
```

## Extender el módulo

### Agregar nuevo campo al usuario

1. Actualizar tipo en `types/auth.ts`:
```ts
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string; // nuevo campo
}
```

2. El backend debe incluirlo en la respuesta de login/confirm

### Agregar nuevo endpoint de auth

1. Agregar al service `services/auth.ts`:
```ts
export const authService = {
  // ... existentes

  changePassword: async (data: ChangePasswordRequest) => {
    return api.post<MessageResponse>("/auth/change-password", data);
  },
};
```

2. Agregar al hook `hooks/use-auth.ts`:
```ts
const changePassword = useCallback(
  async (data: ChangePasswordRequest) => {
    setLoading(true);
    try {
      await authService.changePassword(data);
      // toast success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  },
  [setLoading, setError]
);
```

### Agregar nueva ruta protegida

```tsx
// En App.tsx, dentro del Route con ProtectedRoute
<Route path="/mi-nueva-ruta" element={<MiNuevaPage />} />
```

### Agregar ruta pública

```tsx
// En App.tsx, fuera del ProtectedRoute
<Route path="/public" element={<PublicPage />} />
```

## Debugging

### Ver estado del store

```ts
// En consola del browser
localStorage.getItem("writeflow-auth");
```

### Forzar logout

```ts
// En consola
localStorage.removeItem("writeflow-auth");
location.reload();
```

### Ver token decodificado

```ts
import { jwtDecode } from "jwt-decode";

const { idToken } = useAuthStore.getState();
console.log(jwtDecode(idToken));
// { sub, email, exp, iat, ... }
```

## Decisiones arquitectónicas

Ver [ADR 001: Gestión de Tokens](../adr/001-auth-token-management.md) para entender:
- Por qué usamos `idToken` en Authorization header
- Por qué almacenamos en localStorage
- Estrategia híbrida de refresh (proactivo + reactivo)
- Manejo de requests concurrentes durante refresh
