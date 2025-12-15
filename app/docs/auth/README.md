# Authentication Module

Quick guide to use and extend the Writeflow authentication system.

## Architecture

```
src/
├── store/auth.ts              # Global state (Zustand)
├── services/
│   ├── api.ts                 # HTTP client with automatic auth
│   └── auth.ts                # Auth endpoints
├── hooks/
│   ├── use-auth.ts            # Main auth hook
│   └── use-token-refresh.ts   # Proactive refresh
├── components/auth/
│   └── ProtectedRoute.tsx     # Route guard
└── types/auth.ts              # TypeScript types
```

## Basic Usage

### Check if user is authenticated

```tsx
import { useAuthStore } from "@/store/auth";

function MyComponent() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <p>Not authenticated</p>;
  }

  return <p>Hello, {user?.name}</p>;
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
    // Automatically redirects to "/" on success
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="text-red-500">{error}</p>}
      {/* inputs... */}
      <button disabled={isLoading}>
        {isLoading ? "Loading..." : "Sign in"}
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
      Log out
    </button>
  );
}
```

### Protect a route

```tsx
// In App.tsx
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

### Make authenticated requests

```tsx
import { api } from "@/services/api";

// Token is automatically added
const posts = await api.get<Post[]>("/my/posts");

// POST with body
const newPost = await api.post<Post>("/my/posts", {
  title: "My post",
  contentKey: "abc123",
});

// Request without auth (public)
const publicPosts = await api.get<Post[]>("/posts", { skipAuth: true });
```

### Access token outside React

```tsx
import { useAuthStore } from "@/store/auth";

// In a service or utility
const { idToken } = useAuthStore.getState();

// Check expiration
const isExpired = useAuthStore.getState().isTokenExpired();
```

## Auth Flows

### New user registration

```
1. User fills registration form
2. useAuth().register() → POST /auth/register
3. Backend creates user in Cognito (UNCONFIRMED state)
4. Redirects to /auth/confirm with pendingEmail saved
5. User enters 6-digit code
6. useAuth().confirmCode() → POST /auth/confirm
7. Backend confirms and returns tokens
8. setTokens() saves to store
9. Redirects to "/"
```

### Existing user login

```
1. User enters email/password
2. useAuth().login() → POST /auth/login
3. Backend validates with Cognito
4. Returns { user, accessToken, idToken, refreshToken }
5. setTokens() saves to store + localStorage
6. Redirects to "/"
```

### Token refresh

```
Proactive (useTokenRefresh):
1. Timer is scheduled for 5 min before expiration
2. When triggered, calls authService.refreshToken()
3. updateTokens() updates store
4. Timer is rescheduled for new token

Reactive (api.ts):
1. Request receives 401
2. Calls refreshToken()
3. If successful, retries original request
4. If fails, logout()
```

## Extending the module

### Add new field to user

1. Update type in `types/auth.ts`:
```ts
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string; // new field
}
```

2. Backend must include it in login/confirm response

### Add new auth endpoint

1. Add to service `services/auth.ts`:
```ts
export const authService = {
  // ... existing

  changePassword: async (data: ChangePasswordRequest) => {
    return api.post<MessageResponse>("/auth/change-password", data);
  },
};
```

2. Add to hook `hooks/use-auth.ts`:
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

### Add new protected route

```tsx
// In App.tsx, inside the Route with ProtectedRoute
<Route path="/my-new-route" element={<MyNewPage />} />
```

### Add public route

```tsx
// In App.tsx, outside ProtectedRoute
<Route path="/public" element={<PublicPage />} />
```

## Debugging

### View store state

```ts
// In browser console
localStorage.getItem("writeflow-auth");
```

### Force logout

```ts
// In console
localStorage.removeItem("writeflow-auth");
location.reload();
```

### View decoded token

```ts
import { jwtDecode } from "jwt-decode";

const { idToken } = useAuthStore.getState();
console.log(jwtDecode(idToken));
// { sub, email, exp, iat, ... }
```

## Architectural decisions

See [ADR 001: Token Management](../adr/001-auth-token-management.md) to understand:
- Why we use `idToken` in Authorization header
- Why we store in localStorage
- Hybrid refresh strategy (proactive + reactive)
- Handling concurrent requests during refresh
