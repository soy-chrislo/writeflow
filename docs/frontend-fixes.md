# Frontend Architecture Fixes

> Documento de seguimiento para mejoras arquitectónicas del frontend de Writeflow.
> Generado a partir de auditoría de código con enfoque purista en diseño y buenas prácticas.

---

## Resumen Ejecutivo

| Severidad | Cantidad | Impacto Estimado |
|-----------|----------|------------------|
| Crítico (P0) | 4 | ~700 líneas redundantes, testabilidad comprometida |
| Diseño (P1) | 4 | Mantenibilidad reducida, inconsistencias |
| Code Smells (P2) | 3 | Deuda técnica menor |

---

## P0 - Problemas Críticos

### 1. Duplicación Masiva: Store vs Hooks

**Archivos afectados:**
- `src/store/posts.ts` (309 líneas)
- `src/hooks/use-posts.ts` (367 líneas)

**Descripción:**
Existen dos implementaciones paralelas para la gestión de posts:
1. `usePostsStore` - Zustand store con estado global
2. `usePosts()` / `usePost()` - Hooks con useState local

Ambas implementaciones contienen:
- Funciones idénticas: `fetchMyPosts`, `fetchPublicPosts`, `createPost`, `updatePost`, `deletePost`, `publishPost`, `unpublishPost`
- La función `generateSlug()` duplicada literalmente
- El mismo patrón de manejo de errores con `ApiError`
- Estados equivalentes: `isLoading`, `isSaving`, `isUploading`, `error`

**Código duplicado ejemplo:**
```typescript
// store/posts.ts:23-30
function generateSlug(title: string): string {
  return title.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// hooks/use-posts.ts:119-126 - IDÉNTICO
function generateSlug(title: string): string {
  return title.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

**Justificación técnica:**
- **DRY Principle** (Don't Repeat Yourself): Martin Fowler en *Refactoring: Improving the Design of Existing Code* identifica la duplicación como el "code smell" más severo porque multiplica el costo de mantenimiento.
- **Single Source of Truth**: React documentation enfatiza que el estado debe tener una única fuente de verdad para evitar inconsistencias.

**Impacto:**
- ~700 líneas de código redundante
- Bug fixes requieren cambios en dos lugares
- Riesgo de divergencia entre implementaciones
- Confusión sobre cuál usar en nuevos componentes

**Solución propuesta:**
Elegir UNA estrategia y eliminar la otra:
- **Opción A**: Mantener hooks con useState (más simple, estado local por componente)
- **Opción B**: Mantener Zustand store (estado global compartido)
- **Opción C** (recomendada): Migrar a TanStack Query para server state

**Referencias:**
- Fowler, M. (2018). *Refactoring: Improving the Design of Existing Code*
- Hunt, A. & Thomas, D. (1999). *The Pragmatic Programmer* - DRY Principle

---

### 2. Acoplamiento Store-Services (Violación de Capas)

**Archivos afectados:**
- `src/store/posts.ts`

**Descripción:**
El store de Zustand importa y ejecuta directamente llamadas a servicios HTTP:

```typescript
// store/posts.ts:3-5
import { ApiError } from "@/services/api";
import { postsService } from "@/services/posts";
import { uploadService } from "@/services/upload";

// store/posts.ts:154-158
createPost: async (input) => {
  const { contentKey } = await uploadService.uploadPostContent(slug, input.content);
  const response = await postsService.create({ title, contentKey, status });
  // ...
}
```

**Justificación técnica:**
- **Clean Architecture** (Robert C. Martin): Las capas internas no deben depender de capas externas. El state management es una capa interna; los servicios HTTP son externos.
- **Dependency Inversion Principle** (SOLID - D): Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de abstracciones.
- **Testability**: Con este acoplamiento, testear el store requiere mockear fetch/HTTP, complicando los tests unitarios.

**Arquitectura actual (incorrecta):**
```
Component → Store → Service → HTTP
                ↑
           (acoplado)
```

**Arquitectura correcta:**
```
Component → Hook → Service → HTTP
              ↓
           Store (state only)
```

**Impacto:**
- Tests unitarios del store requieren mocks de HTTP
- No se puede cambiar la implementación del servicio sin modificar el store
- Lógica de negocio (upload + create) mezclada con state management

**Solución propuesta:**
1. Stores solo manejan estado síncrono
2. Hooks orquestan operaciones async y actualizan stores
3. Services permanecen como capa de abstracción HTTP

**Referencias:**
- Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*
- Zustand docs: "Keep stores simple and synchronous when possible"

---

### 3. Side Effects Asíncronos en Stores

**Archivos afectados:**
- `src/store/posts.ts`
- `src/store/auth.ts` (en menor medida)

**Descripción:**
Los stores ejecutan operaciones asíncronas con efectos secundarios:

```typescript
// store/posts.ts:148-182
createPost: async (input) => {
  set({ isSaving: true, isUploading: true, postError: null });

  try {
    const slug = generateSlug(input.title);
    const { contentKey } = await uploadService.uploadPostContent(slug, input.content);
    set({ isUploading: false });
    const response = await postsService.create({ ... });
    set((state) => ({ ... }));
    return response;
  } catch (err) {
    set({ postError: message, isSaving: false, isUploading: false });
    throw err;
  }
}
```

**Justificación técnica:**
- **Redux Style Guide** (aplicable a Zustand): "Put as much logic as possible in reducers". Los reducers/stores deben ser funciones puras sin side effects.
- **Predictability**: Stores con async operations son difíciles de debuggear porque el estado puede cambiar en cualquier momento durante la ejecución.
- **Mark Erikson** (Redux maintainer): *"Keep your state management layer thin and predictable. Business logic belongs elsewhere."*

**Impacto:**
- Debugging complejo (múltiples `set()` calls en una operación)
- Estado intermedio visible (`isUploading: true` mientras `isSaving: true`)
- Race conditions potenciales si se llama la misma acción dos veces

**Solución propuesta:**
```typescript
// Hook maneja async
function useCreatePost() {
  const setPostState = usePostsStore(s => s.setPostState);

  return async (input) => {
    setPostState({ isSaving: true });
    try {
      const result = await postsService.create(input);
      setPostState({ isSaving: false, posts: [...] });
      return result;
    } catch (err) {
      setPostState({ isSaving: false, error: err.message });
    }
  };
}

// Store solo tiene setters síncronos
const usePostsStore = create((set) => ({
  posts: [],
  isSaving: false,
  setPostState: (partial) => set(partial),
}));
```

**Referencias:**
- Redux Style Guide: https://redux.js.org/style-guide/
- Zustand GitHub discussions on async actions

---

### 4. Múltiples Fuentes de Verdad para Server State

**Archivos afectados:**
- `src/store/posts.ts`
- `src/hooks/use-posts.ts`
- `src/pages/dashboard/MyPosts.tsx`
- `src/pages/Blog.tsx`

**Descripción:**
El estado de los posts (server state) existe en múltiples lugares:

```typescript
// MyPosts.tsx usa el hook (estado local)
const { posts, isLoading } = usePosts();

// El store también tiene posts (estado global)
const { posts } = usePostsStore();

// Ambos pueden tener datos diferentes
```

**Justificación técnica:**
- **Server State vs Client State**: TanStack Query documentation distingue claramente:
  - *Server state*: Datos que viven en el servidor (posts, users). Requieren sincronización, cache, revalidación.
  - *Client state*: Datos que solo existen en el cliente (UI state, forms). No requieren sincronización.

- **Stale Data Problem**: Sin una estrategia de cache centralizada, diferentes componentes pueden mostrar datos desactualizados.

**Impacto:**
- Usuario A crea post en NewPost → navega a MyPosts → puede no ver el post nuevo si usó diferentes fuentes
- No hay invalidación de cache automática
- Refetch manual requerido después de mutaciones

**Solución propuesta:**
Adoptar TanStack Query (React Query) para server state:

```typescript
// Centraliza fetching, caching, y sincronización
const { data: posts, isLoading } = useQuery({
  queryKey: ['posts', 'my'],
  queryFn: () => postsService.listMy(),
});

// Mutaciones invalidan cache automáticamente
const createPost = useMutation({
  mutationFn: postsService.create,
  onSuccess: () => queryClient.invalidateQueries(['posts']),
});
```

**Referencias:**
- TanStack Query docs: "Thinking in React Query"
- Kent C. Dodds: "Application State Management with React"

---

## P1 - Problemas de Diseño

### 5. God Component: PostForm

**Archivo afectado:**
- `src/components/posts/PostForm.tsx` (362 líneas)

**Descripción:**
`PostForm` tiene múltiples responsabilidades:
1. Manejo de formulario con react-hook-form
2. Estado del editor TipTap
3. Lógica de guardado (draft/publish/unpublish)
4. Confirmación de eliminación con AlertDialog
5. Detección de cambios no guardados (beforeunload)
6. Formateo de fechas
7. Renderizado condicional complejo (mode, status)

**Código problemático:**
```typescript
// 4 handlers de acción diferentes inline
const handleSaveDraft = async () => { ... }   // 12 líneas
const handlePublish = async () => { ... }      // 18 líneas
const handleUnpublish = async () => { ... }    // 10 líneas
const handleDelete = async () => { ... }       // 6 líneas
```

**Justificación técnica:**
- **Single Responsibility Principle** (SOLID - S): Una clase/componente debe tener una sola razón para cambiar.
- **Dan Abramov** - *Presentational and Container Components*: Separar lógica de presentación.
- **Component Composition**: React favorece componentes pequeños y composables sobre componentes monolíticos.

**Impacto:**
- Difícil de testear (muchos paths de ejecución)
- Cambios en una funcionalidad pueden afectar otras
- Difícil de reutilizar partes del componente
- Cognitive load alto para desarrolladores

**Solución propuesta:**
Descomponer en componentes más pequeños:

```
PostForm/
├── index.tsx           # Composición principal
├── PostFormHeader.tsx  # Back button, status badge, view link
├── PostFormActions.tsx # Save, Publish, Unpublish buttons
├── PostFormFields.tsx  # Title input + Editor
├── PostFormFooter.tsx  # Timestamps + Delete
├── DeletePostDialog.tsx
└── usePostForm.ts      # Custom hook con toda la lógica
```

**Referencias:**
- Abramov, D. "Presentational and Container Components"
- React docs: "Thinking in React" - Component composition

---

### 6. Lógica de Dominio Dispersa

**Archivos afectados:**
- `src/store/posts.ts` (generateSlug)
- `src/hooks/use-posts.ts` (generateSlug)
- `src/components/posts/PostForm.tsx` (validación de contenido)

**Descripción:**
La lógica de negocio está dispersa en múltiples capas:

```typescript
// Generación de slug (duplicada)
function generateSlug(title: string): string { ... }

// Validación de contenido vacío (en componente UI)
if (!editorContent || editorContent === "<p></p>") {
  form.setError("content", { message: "Content is required to publish" });
}
```

**Justificación técnica:**
- **Domain-Driven Design** (Eric Evans): La lógica de dominio debe estar centralizada en el domain layer, no dispersa en UI o infraestructura.
- **Cohesion**: Código relacionado debe estar junto. `generateSlug` y validación de posts son conceptos del dominio "Post".

**Impacto:**
- Reglas de negocio difíciles de encontrar y modificar
- Duplicación de lógica
- Tests de lógica de negocio requieren montar componentes React

**Solución propuesta:**
Crear módulo de dominio:

```typescript
// src/lib/posts/index.ts
export function generateSlug(title: string): string { ... }

export function isValidForPublish(post: { title: string; content: string }): ValidationResult {
  const errors: string[] = [];
  if (!post.title.trim()) errors.push("Title is required");
  if (!post.content || post.content === "<p></p>") errors.push("Content is required");
  return { valid: errors.length === 0, errors };
}

export const POST_CONSTANTS = {
  EMPTY_CONTENT: "<p></p>",
  MAX_TITLE_LENGTH: 200,
};
```

**Referencias:**
- Evans, E. (2003). *Domain-Driven Design: Tackling Complexity in the Heart of Software*
- Fowler, M. "Anemic Domain Model" (anti-pattern)

---

### 7. Manejo de Errores Inconsistente

**Archivos afectados:**
- `src/services/api.ts`
- `src/store/posts.ts`
- `src/hooks/use-auth.ts`
- `src/hooks/use-posts.ts`

**Descripción:**
Tres patrones diferentes de manejo de errores coexisten:

```typescript
// Patrón 1: Store - guarda error Y lanza
catch (err) {
  const message = err instanceof ApiError ? err.message : "Failed to fetch posts";
  set({ error: message, isLoading: false });
  throw err;  // ¿Por qué lanzar si ya guardaste el error?
}

// Patrón 2: API client - logout + toast, retorna boolean
catch {
  logout();
  toast.error("Your session has expired...");
  return false;
}

// Patrón 3: Hook - guarda error, lanza, no toast
catch (err) {
  const message = err instanceof ApiError ? err.message : "Failed to login";
  setError(message);
  throw err;
}
```

**Justificación técnica:**
- **Consistency**: Microsoft Error Handling Guidelines: *"Use a consistent strategy for catching, logging, and rethrowing exceptions throughout your application."*
- **Error Boundaries**: React recomienda usar Error Boundaries para errores de renderizado, pero necesitas una estrategia clara para errores async.

**Impacto:**
- Comportamiento impredecible (algunos errores muestran toast, otros no)
- Componentes deben conocer múltiples formas de manejar errores
- Debugging difícil

**Solución propuesta:**
Definir estrategia única:

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public isUserFacing: boolean = true
  ) {
    super(message);
  }
}

// Wrapper para operaciones async en hooks
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options: {
    onError?: (error: AppError) => void;
    showToast?: boolean;
  }
): Promise<T | null> {
  try {
    return await operation();
  } catch (err) {
    const appError = toAppError(err);
    if (options.showToast && appError.isUserFacing) {
      toast.error(appError.message);
    }
    options.onError?.(appError);
    return null;
  }
}
```

**Referencias:**
- Microsoft .NET Error Handling Guidelines
- React Error Boundaries documentation

---

### 8. Race Condition en Token Refresh

**Archivos afectados:**
- `src/services/api.ts` (refresh reactivo)
- `src/hooks/use-token-refresh.ts` (refresh proactivo)

**Descripción:**
Existen dos mecanismos de refresh independientes:

```typescript
// api.ts - variables módulo-level
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// use-token-refresh.ts - scheduling propio
useEffect(() => {
  const timeUntilExpiry = getTimeUntilExpiry();
  const refreshTime = timeUntilExpiry - REFRESH_BUFFER_MS;
  timeoutRef.current = setTimeout(attemptRefresh, refreshTime);
}, [...]);
```

**Problema:**
1. Proactive refresh inicia a las 4:55 (5 min antes de expiración)
2. Mientras tanto, un request HTTP falla con 401
3. Reactive refresh inicia en api.ts
4. Ambos llaman `/auth/refresh` simultáneamente
5. Uno usa token viejo, otro recibe error

El flag `isRefreshing` solo protege dentro de `api.ts`, no coordina con el hook.

**Justificación técnica:**
- **Auth0 Best Practices**: *"Implement a single source of truth for token refresh to prevent race conditions."*
- **Mutex Pattern**: Operaciones que modifican estado compartido (tokens) deben coordinarse.

**Impacto:**
- Logout inesperado en edge cases
- Requests fallidos durante window de refresh
- Difícil de reproducir y debuggear

**Solución propuesta:**
Centralizar refresh en un singleton:

```typescript
// src/lib/token-manager.ts
class TokenManager {
  private refreshPromise: Promise<boolean> | null = null;

  async ensureValidToken(): Promise<string | null> {
    if (this.isTokenValid()) {
      return this.getToken();
    }

    // Single refresh, múltiples waiters
    if (!this.refreshPromise) {
      this.refreshPromise = this.doRefresh();
    }

    await this.refreshPromise;
    this.refreshPromise = null;
    return this.getToken();
  }
}

export const tokenManager = new TokenManager();
```

**Referencias:**
- Auth0: "Token Best Practices"
- OAuth 2.0 RFC 6749 - Token Refresh

---

## P2 - Code Smells

### 9. Parámetro No Utilizado

**Archivo afectado:**
- `src/hooks/use-posts.ts:128`

**Código:**
```typescript
export function usePost(_slug?: string) {  // _slug nunca se usa
  const [state, setState] = useState<UsePostState>({ ... });
  // ...
}
```

**Justificación:**
- **ESLint no-unused-vars**: Parámetros no utilizados indican código muerto o intención no completada.
- El prefijo `_` es convención para "intencionalmente ignorado", pero si no se necesita, no debería existir.

**Solución:**
Eliminar el parámetro o implementar la funcionalidad pretendida (fetch automático por slug).

---

### 10. Type Assertions Inseguras

**Archivo afectado:**
- `src/services/api.ts:182-184`

**Código:**
```typescript
if (response.status === 204) {
  return {} as T;  // Unsafe: T podría ser Post[], string, etc.
}
```

**Justificación:**
- **TypeScript Handbook**: Type assertions (`as T`) bypasean el type checker. Si `T` es `Post[]`, devolver `{}` causará runtime errors.
- **Type Safety**: El propósito de TypeScript es prevenir estos errores en compile time.

**Solución:**
```typescript
// Opción 1: Retornar void/undefined para 204
async function request<T>(endpoint: string): Promise<T | void> {
  if (response.status === 204) return;
  // ...
}

// Opción 2: Sobrecargas de función
function del(endpoint: string): Promise<void>;
function get<T>(endpoint: string): Promise<T>;
```

---

### 11. Magic Strings

**Archivos afectados:**
- `src/store/auth.ts`
- `src/store/posts.ts`
- `src/components/posts/PostForm.tsx`

**Código:**
```typescript
// Dispersos en el código
persist(..., { name: "writeflow-auth" })  // localStorage key
devtools(..., { name: "posts-store" })     // Redux DevTools name
if (editorContent === "<p></p>")           // Empty TipTap content
```

**Justificación:**
- **Clean Code** (Robert C. Martin): Magic strings/numbers deben ser constantes nombradas para mejorar legibilidad y facilitar cambios.

**Solución:**
```typescript
// src/lib/constants.ts
export const STORAGE_KEYS = {
  AUTH: "writeflow-auth",
  POSTS: "posts-store",
} as const;

export const EDITOR = {
  EMPTY_CONTENT: "<p></p>",
  DEFAULT_CONTENT: "<p></p>",
} as const;
```

---

## Plan de Implementación Sugerido

### Fase 1: Eliminar Duplicación (P0)
1. [ ] Decidir estrategia: hooks vs store vs TanStack Query
2. [ ] Migrar componentes a la solución elegida
3. [ ] Eliminar código duplicado
4. [ ] Centralizar `generateSlug` en `lib/posts.ts`

### Fase 2: Desacoplar Capas (P0)
1. [ ] Extraer async operations de stores a hooks
2. [ ] Stores solo mantienen estado síncrono
3. [ ] Implementar patrón de inyección de dependencias

### Fase 3: Mejorar Arquitectura (P1)
1. [ ] Descomponer PostForm en componentes más pequeños
2. [ ] Crear módulo de dominio para posts
3. [ ] Unificar estrategia de manejo de errores
4. [ ] Centralizar token refresh en singleton

### Fase 4: Limpiar Code Smells (P2)
1. [ ] Eliminar parámetro no usado en usePost
2. [ ] Corregir type assertions inseguras
3. [ ] Extraer magic strings a constantes

---

## Referencias Bibliográficas

1. Martin, R. C. (2008). *Clean Code: A Handbook of Agile Software Craftsmanship*
2. Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*
3. Fowler, M. (2018). *Refactoring: Improving the Design of Existing Code*
4. Evans, E. (2003). *Domain-Driven Design: Tackling Complexity in the Heart of Software*
5. Hunt, A. & Thomas, D. (1999). *The Pragmatic Programmer*
6. TanStack Query Documentation: https://tanstack.com/query
7. Zustand Documentation: https://zustand-demo.pmnd.rs/
8. Redux Style Guide: https://redux.js.org/style-guide/
9. React Documentation: https://react.dev/
10. Auth0 Best Practices: https://auth0.com/docs/secure/tokens/token-best-practices
