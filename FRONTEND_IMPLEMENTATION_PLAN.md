# Writeflow Frontend Implementation Plan

## Executive Summary

El frontend tiene **~85% de completitud**. Todas las funcionalidades core del MVP están implementadas:

- ✅ Autenticación completa (login, registro, tokens, refresh)
- ✅ CRUD de posts (crear, editar, listar, eliminar)
- ✅ Publicar/Despublicar posts
- ✅ Editor TipTap funcional con preview
- ✅ Blog público (lista de posts sin auth)
- ✅ Vista de post individual

**Pendiente (nice-to-have):** Responsive mobile, accesibilidad, tests, optimizaciones de performance.

---

## 1. AUTENTICACIÓN Y SEGURIDAD ✅ COMPLETADO

> **Fecha de implementación:** 2025-12-02
> **Implementado por:** Claude Code

### 1.1 Route Guards (Auth Protection) ✅

**Archivo creado:** `app/src/components/auth/ProtectedRoute.tsx`

**Implementación:**
- Componente wrapper que verifica `isAuthenticated` del store
- Si no autenticado → redirect a `/auth/login` con `state.from` para returnUrl
- Muestra `<Spinner>` mientras `isInitialized=false`
- Integrado en `App.tsx` envolviendo el `<Layout>`

**Rutas protegidas actualmente:**
| Ruta | Requiere Auth | Estado |
|------|---------------|--------|
| `/` | Sí (editor) | ✅ Protegida |
| `/posts` | Sí (mis posts) | ✅ Protegida |
| `/posts/:slug` | Sí (ver post) | ✅ Protegida |
| `/posts/new` | Sí | ⏳ Ruta no creada aún |
| `/posts/:slug/edit` | Sí | ⏳ Ruta no creada aún |
| `/auth/*` | No | ✅ Pública |

### 1.2 Token Management ✅

#### Decisiones Arquitectónicas

| Decisión | Elección | Justificación |
|----------|----------|---------------|
| Token para Authorization | `idToken` | Backend ya valida idToken y extrae claims de usuario |
| Almacenamiento | localStorage (Zustand persist) | Backend envía refreshToken en body, no en httpOnly cookie |
| Estrategia de refresh | Híbrida (proactivo + reactivo) | Mejor UX sin interrupciones + fallback |

> **Documentación completa:** Ver `app/docs/adr/001-auth-token-management.md`

#### Archivos Modificados

**`app/src/store/auth.ts`** - Auth Store
- Añadido `refreshToken`, `idToken`, `tokenExpiresAt` al estado
- Añadido `isInitialized` para evitar flash de loading
- Nuevas acciones: `setTokens()`, `updateTokens()`
- Helpers: `isTokenExpired()`, `getTimeUntilExpiry()`
- Persistencia en localStorage con key `writeflow-auth`

**`app/src/services/api.ts`** - HTTP Client
- Inyección automática de `idToken` en header `Authorization: Bearer {token}`
- Refresh reactivo: si recibe 401, intenta refresh y retry
- Queue de requests para evitar múltiples refresh simultáneos
- Opción `skipAuth: true` para endpoints públicos

**`app/src/hooks/use-auth.ts`** - Auth Hook
- Actualizado para usar `setTokens()` en login/confirm
- Nuevas funciones: `refreshAccessToken()`, `initializeAuth()`
- Exports adicionales: `isTokenExpired`, `getTimeUntilExpiry`

**`app/src/hooks/use-token-refresh.ts`** - NUEVO
- Hook para refresh proactivo
- Timer programado 5 minutos antes de expiración
- Se ejecuta en `App.tsx` a nivel raíz

#### Tipos de JWT Claims

**`app/src/types/auth.ts`** - Tipos completos de AWS Cognito
```typescript
// Claims del ID Token (identidad del usuario)
interface CognitoIdTokenClaims {
  sub: string;              // UUID del usuario
  email?: string;
  "cognito:username": string;
  "cognito:groups"?: string[];
  token_use: "id";
  // ... más claims documentados
}

// Claims del Access Token (autorización)
interface CognitoAccessTokenClaims {
  sub: string;
  username: string;
  scope: string;            // OAuth scopes
  token_use: "access";
  // ... más claims documentados
}
```

#### Flujo de Refresh Implementado

```
PROACTIVO (useTokenRefresh):
┌─────────────────────────────────────────────────────────┐
│ 1. Token expira en 60 min                               │
│ 2. Timer se programa para 55 min (5 min antes)          │
│ 3. Al dispararse → POST /auth/refresh                   │
│ 4. updateTokens() actualiza store                       │
│ 5. Se reprograma timer para nuevo token                 │
└─────────────────────────────────────────────────────────┘

REACTIVO (api.ts):
┌─────────────────────────────────────────────────────────┐
│ 1. Request recibe 401                                   │
│ 2. Si no hay refresh en curso → refreshToken()          │
│ 3. Si hay refresh en curso → esperar promise existente  │
│ 4. Si exitoso → retry request original con nuevo token  │
│ 5. Si falla → logout() + throw ApiError(401)            │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Logout UI ✅

**Archivo modificado:** `app/src/components/layout/AppSidebar.tsx`

**Implementación:**
- Botón "Cerrar sesión" en `<SidebarFooter>`
- Muestra email del usuario autenticado
- Llama `useAuth().logout()` que:
  - Intenta `POST /auth/logout` (ignora errores)
  - Limpia estado del store
  - Redirige a `/auth/login`

### Documentación Generada

| Archivo | Descripción |
|---------|-------------|
| `app/docs/adr/001-auth-token-management.md` | ADR con decisiones arquitectónicas, trade-offs y justificaciones |
| `app/docs/auth/README.md` | Guía de uso y extensión del módulo de auth |
| JSDoc en archivos clave | Documentación inline con ejemplos |

### Dependencias Añadidas

```json
{
  "jwt-decode": "^4.0.0"
}
```

### Checklist Final

- [x] ProtectedRoute component
- [x] Auth guards en rutas (/, /posts, /posts/:slug)
- [x] Token en headers API (idToken)
- [x] Token refresh automático (proactivo + reactivo)
- [x] Logout UI en sidebar
- [x] Persistencia de sesión en localStorage
- [x] Tipos completos de JWT claims de Cognito
- [x] Documentación ADR
- [x] Documentación de uso (README)
- [x] JSDoc en archivos clave
- [x] Redirect post-login a returnUrl
- [x] Toast de feedback en logout/sesión expirada

---

## 2. GESTIÓN DE POSTS - CREAR ✅ COMPLETADO

> **Fecha de implementación:** 2025-12-02
> **Implementado por:** Claude Code

### 2.1 Página Crear Post ✅

**Archivo:** `app/src/pages/dashboard/NewPost.tsx`
**Ruta:** `/dashboard/posts/new`

**Layout implementado:**
```
┌─────────────────────────────────────────────────┐
│ ← Volver  [Badge status]    [Guardar borrador] [Publicar] │
├─────────────────────────────────────────────────┤
│ Título: [________________________________]      │
│                                                 │
│ ┌─────────────────────┬───────────────────────┐ │
│ │     Editor          │      Preview          │ │
│ │   (TipTap)          │    (HTML render)      │ │
│ │                     │                       │ │
│ └─────────────────────┴───────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Funcionalidades implementadas:**

| Feature | Estado | Detalles |
|---------|--------|----------|
| Campo título | ✅ | Input con validación Zod (1-200 chars) |
| Editor TipTap | ✅ | Con preview side-by-side |
| Guardar borrador | ✅ | Solo requiere título |
| Publicar | ✅ | Requiere título + contenido |
| Validación Zod | ✅ | `postFormSchema` en `lib/validations.ts` |
| Toast feedback | ✅ | Sonner para éxito/error |
| Redirect post-crear | ✅ | Navega a `/dashboard/posts/:slug/edit` |
| Unsaved changes warning | ✅ | `beforeunload` event |

**Funcionalidades opcionales no implementadas:**
- Auto-save draft cada 30s
- Keyboard shortcuts (Ctrl+S, Ctrl+Enter)

### 2.2 Componente PostForm (Reutilizable) ✅

**Archivo:** `app/src/components/posts/PostForm.tsx`

```typescript
interface PostFormProps {
  mode: 'create' | 'edit';
  initialData?: PostFormInitialData;
  onSave: (data: PostFormValues, action: 'draft' | 'publish') => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  onUnpublish?: () => Promise<void>;
  isSaving: boolean;
  isDeleting?: boolean;
  error?: string | null;
}

interface PostFormInitialData {
  title: string;
  content: string;
  status: PostStatus;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}
```

**Funcionalidades:**
- [x] Formulario completo título + editor
- [x] Validación con Zod
- [x] Unsaved changes warning (beforeunload)
- [x] isDirty tracking
- [x] Estados de loading/saving/deleting
- [ ] Auto-save draft cada 30s (opcional, no implementado)
- [ ] Keyboard shortcuts (opcional, no implementado)

---

## 3. GESTIÓN DE POSTS - EDITAR ✅ COMPLETADO

> **Fecha de implementación:** 2025-12-02
> **Implementado por:** Claude Code

### 3.1 Página Editar Post ✅

**Archivo:** `app/src/pages/dashboard/EditPost.tsx`
**Ruta:** `/dashboard/posts/:slug/edit`

**Layout implementado:**
```
┌───────────────────────────────────────────────────────────┐
│ ← Volver [Borrador] [Ver post ↗]    [Guardar] [Publicar]  │
│                                   o [Guardar] [Despublicar]│
├───────────────────────────────────────────────────────────┤
│ Título: [Post existente___________________]               │
│                                                           │
│ ┌─────────────────────────┬─────────────────────────────┐ │
│ │     Editor              │      Preview                │ │
│ │   (contenido cargado)   │    (HTML render)            │ │
│ └─────────────────────────┴─────────────────────────────┘ │
├───────────────────────────────────────────────────────────┤
│ Slug: mi-post | Creado: 2 Dec | Actualizado: 2 Dec        │
│ Publicado: 2 Dec                          [Eliminar post] │
└───────────────────────────────────────────────────────────┘
```

**Funcionalidades implementadas:**

| Feature | Estado | Detalles |
|---------|--------|----------|
| Cargar post existente | ✅ | `fetchMyPost()` → `GET /my/posts/:slug` |
| Mostrar metadata | ✅ | slug, createdAt, updatedAt, publishedAt |
| Badge de estado | ✅ | "Publicado" / "Borrador" |
| Botón Guardar | ✅ | Guarda cambios sin modificar status |
| Botón Publicar | ✅ | Visible solo si status=draft |
| Botón Despublicar | ✅ | Visible solo si status=published |
| Link Ver post | ✅ | Abre `/posts/:slug` en nueva pestaña (solo si published) |
| Botón Eliminar | ✅ | Modal de confirmación con AlertDialog |
| isDirty tracking | ✅ | Detecta cambios en título y contenido |
| Unsaved changes warning | ✅ | `beforeunload` event |
| Estado: Cargando | ✅ | EditorSkeleton |
| Estado: Post no encontrado | ✅ | Página error con botón volver |
| Toast feedback | ✅ | Éxito/error en todas las acciones |

**Archivos modificados para esta funcionalidad:**

| Archivo | Cambios |
|---------|---------|
| `hooks/use-posts.ts` | Añadido `fetchMyPost()`, `unpublishPost()` |
| `services/posts.ts` | Añadido `getMyBySlug()` |
| `components/posts/PostForm.tsx` | Añadido `onUnpublish`, link "Ver post", `publishedAt` |

**Flujos implementados:**

1. **Guardar**: `updatePost(slug, { title, content })` → Toast "Cambios guardados"
2. **Publicar**: `updatePost(slug, { ..., status: 'published' })` → Toast "Post publicado"
3. **Despublicar**: `unpublishPost(slug)` → Toast "Post movido a borradores"
4. **Eliminar**: Modal confirmación → `deletePost(slug)` → Toast + Navigate a `/dashboard/posts`

---

## 4. GESTIÓN DE POSTS - LISTAR ✅ COMPLETADO

> **Fecha de implementación:** 2025-12-02
> **Implementado por:** Claude Code

### 4.1 Página Lista de Posts ✅

**Archivo:** `app/src/pages/dashboard/MyPosts.tsx`

**Layout implementado:**
```
┌─────────────────────────────────────────────────┐
│ My Posts                         [+ New Post]   │
│ Manage your blog posts and articles             │
├─────────────────────────────────────────────────┤
│ 🔍 [Buscar por título...____] [Todos ▼]        │
├─────────────────────────────────────────────────┤
│ │ Title │ Slug │ Status │ Created │ Updated │···│
│ ├───────┼──────┼────────┼─────────┼─────────┼───┤
│ │ Post 1│ ...  │ Publ.  │ Dec 2   │ Dec 2   │ ⋮ │
│ │ Post 2│ ...  │ Draft  │ Dec 1   │ Dec 1   │ ⋮ │
├─────────────────────────────────────────────────┤
│              [Cargar más]                       │
└─────────────────────────────────────────────────┘
```

**Funcionalidades implementadas:**

| Feature | Estado | Detalles |
|---------|--------|----------|
| API real (no mock) | ✅ | `fetchMyPosts()` llama a `GET /my/posts` |
| Filtro por estado | ✅ | `<Select>` con Todos / Publicados / Borradores |
| Búsqueda | ✅ | Input con filtrado client-side por título |
| Paginación con nextToken | ✅ | Botón "Cargar más" que mantiene el filtro de estado |
| Acciones por fila | ✅ | Dropdown: Ver, Editar, Eliminar |
| Empty state | ✅ | Icono + mensaje + CTA "Crear post" |
| Error state | ✅ | Banner con mensaje de error |
| Loading state | ✅ | "Loading..." en tabla |

**Funcionalidades pendientes (nice-to-have):**

| Feature | Prioridad | Notas |
|---------|-----------|-------|
| Selección múltiple | Baja | Checkbox para acciones bulk |
| Acciones bulk | Baja | Eliminar/Publicar seleccionados |
| Ordenamiento por columna | Baja | TanStack Table lo soporta, solo falta UI |
| Botón refresh | Baja | Recargar lista manualmente |

### 4.2 Acciones en Tabla ✅

**Dropdown por fila (implementado):**
| Acción | Icono | Navegación/Acción |
|--------|-------|-------------------|
| Ver | Eye | `/posts/:slug` |
| Editar | Pencil | `/dashboard/posts/:slug/edit` |
| Eliminar | Trash | Modal confirmación con `DeleteDialog` |

**Acciones no implementadas:**
| Acción | Prioridad | Notas |
|--------|-----------|-------|
| Publicar/Despublicar | Media | Cambiar status desde dropdown |
| Duplicar | Baja | Crear copia como borrador |

### 4.3 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `app/src/pages/dashboard/MyPosts.tsx` | Añadido filtro, búsqueda, paginación, empty state |
| `app/src/hooks/use-posts.ts` | `loadMore()` ahora acepta `{ status }` |
| `app/src/pages/Blog.tsx` | Fix: `onClick={() => loadMore()}` |

### 4.4 Componentes Utilizados

- `@/components/posts/DataTable` - Tabla con TanStack Table
- `@/components/posts/columns` - Definición de columnas
- `@/components/posts/DeleteDialog` - Modal de confirmación
- `@/components/ui/select` - Filtro de estado
- `@/components/ui/input` - Campo de búsqueda

---

## 5. GESTIÓN DE POSTS - VER (PÚBLICO) ✅ COMPLETADO

> **Fecha de implementación:** 2025-12-02
> **Implementado por:** Claude Code

### 5.1 Página Vista Post ✅

**Archivo:** `app/src/pages/PostView.tsx`
**Ruta:** `/posts/:slug` (pública)

```
Layout público:
┌─────────────────────────────────────────────────┐
│ ← Volver                              [Editar]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Título del Post                                │
│  ─────────────────                              │
│  Publicado el 2 de diciembre, 2025              │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │         Contenido HTML                  │    │
│  │         renderizado                     │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Funcionalidades implementadas:**

| Feature | Estado | Detalles |
|---------|--------|----------|
| API real (no mock) | ✅ | `fetchPost()` → `GET /posts/:slug` |
| Fecha formateada | ✅ | "Published on {fecha}" con date-fns |
| Botón editar | ✅ | Solo visible si `isOwner` |
| Banner borrador | ✅ | "This is a draft" si `status=draft && isOwner` |
| Loading state | ✅ | `PostViewSkeleton` |
| 404 page | ✅ | "Post not found" + link a home |
| Error state | ✅ | Mensaje de error con retry |

**UX Estados implementados:**

| Estado | UI |
|--------|-----|
| Cargando | PostViewSkeleton |
| Post no encontrado | "Post not found" + botón "Go to Blog" |
| Draft (no owner) | 404 (API retorna 404) |
| Draft (owner) | Banner "This is a draft" + contenido |
| Published | Contenido normal |
| Error | Mensaje error + botón retry |

### 5.2 Página Blog Público ✅

**Archivo:** `app/src/pages/Blog.tsx`
**Ruta:** `/` (index, pública)

**Layout implementado:**
```
┌─────────────────────────────────────────────────┐
│ Writeflow              [Login] [Register]       │
│                    o   [Dashboard] si auth      │
├─────────────────────────────────────────────────┤
│ Blog                                            │
│ Latest posts from our community                 │
├─────────────────────────────────────────────────┤
│ ┌─────────────┬─────────────┬─────────────┐     │
│ │ Post Title  │ Post Title  │ Post Title  │     │
│ │ Dec 2, 2025 │ Dec 1, 2025 │ Nov 30      │     │
│ └─────────────┴─────────────┴─────────────┘     │
│                                                 │
│              [Load more]                        │
├─────────────────────────────────────────────────┤
│ Writeflow - A simple blogging platform          │
└─────────────────────────────────────────────────┘
```

**Funcionalidades implementadas:**

| Feature | Estado | Detalles |
|---------|--------|----------|
| Lista posts públicos | ✅ | `fetchPublicPosts()` → `GET /posts` |
| Cards con título + fecha | ✅ | Grid responsive 1/2/3 columnas |
| Paginación | ✅ | Botón "Load more" con `hasMore` |
| Loading state | ✅ | Skeleton grid de 6 cards |
| Empty state | ✅ | "No posts yet" + mensaje |
| Error state | ✅ | Banner con mensaje de error |
| Header dinámico | ✅ | Login/Register o Dashboard según auth |
| Click → post | ✅ | Link a `/posts/:slug` |

**Funcionalidades opcionales no implementadas:**
- Extracto del contenido (solo "Click to read more...")
- Tiempo de lectura estimado

---

## 6. EDITOR - MEJORAS

### 6.1 Integración con Flujo de Guardado

**Archivo:** `src/components/Editor/index.tsx` (modificar)

**Agregar props:**
```typescript
interface EditorProps {
  initialContent?: string;
  onContentChange: (raw: string, sanitized: string) => void;
  readOnly?: boolean;
}
```

**Mejoras:**
1. **Contenido inicial** - Cargar HTML existente al editar
2. **Read-only mode** - Para vista previa sin edición
3. **Placeholder** - "Comienza a escribir tu historia..."
4. **Word count** - Contador de palabras en footer
5. **Character count** - Con límite visual si aplica
6. **Auto-save indicator** - "Guardado" / "Guardando..." / "Sin guardar"

### 6.2 Toolbar Mejorado

**Agregar a Toolbar.tsx:**
| Botón | Función | Shortcut |
|-------|---------|----------|
| Imagen | Insertar imagen (URL o upload) | - |
| Tabla | Insertar tabla básica | - |
| Divider | Línea horizontal | --- |
| Fullscreen | Expandir editor | F11 |
| Preview toggle | Mostrar/ocultar preview | Ctrl+P |

### 6.3 Manejo de Imágenes

**Opción A: URL externa**
```
- Botón "Imagen" abre modal
- Input para URL de imagen
- Preview de la imagen
- Insertar como <img src="url">
```

**Opción B: Upload a S3 (futuro)**
```
- Botón "Imagen" abre file picker
- Upload a S3 con presigned URL
- Insertar con URL de S3
- Requiere nuevo endpoint en backend
```

---

## 7. FEEDBACK Y NOTIFICACIONES

### 7.1 Sistema de Toasts

**Usar:** Sonner (ya instalado en shadcn)

**Tipos de toast:**
| Tipo | Uso | Duración |
|------|-----|----------|
| success | Operación exitosa | 3s |
| error | Error de operación | 5s + dismiss |
| warning | Advertencia | 4s |
| info | Información | 3s |
| loading | Operación en progreso | Hasta completar |

**Mensajes estándar:**
| Acción | Toast |
|--------|-------|
| Post creado | "✓ Post creado como borrador" |
| Post publicado | "✓ Post publicado" |
| Post actualizado | "✓ Cambios guardados" |
| Post eliminado | "✓ Post eliminado" |
| Error red | "✗ Error de conexión. Intenta de nuevo" |
| Error auth | "✗ Sesión expirada. Inicia sesión" |
| Error validación | "✗ {mensaje específico}" |

### 7.2 Confirmaciones

**Usar:** AlertDialog de shadcn

**Casos que requieren confirmación:**
| Acción | Mensaje | Botones |
|--------|---------|---------|
| Eliminar post | "¿Eliminar '{título}'?" | Cancelar / Eliminar |
| Descartar cambios | "¿Descartar cambios sin guardar?" | Cancelar / Descartar |
| Despublicar | "¿Mover a borradores?" | Cancelar / Despublicar |
| Eliminar múltiples | "¿Eliminar {n} posts?" | Cancelar / Eliminar |
| Cerrar sesión | (opcional) "¿Cerrar sesión?" | Cancelar / Cerrar sesión |

### 7.3 Unsaved Changes Warning

**Implementar en PostForm:**
```typescript
// Hook useUnsavedChanges
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);

// React Router blocker
const blocker = useBlocker(isDirty);
// Mostrar modal si blocker.state === 'blocked'
```

---

## 8. ESTADOS VACÍOS Y ERRORES

### 8.1 Empty States

**Componente:** `src/components/ui/empty-state.tsx`

```typescript
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Casos:**
| Ubicación | Icono | Título | Descripción | Acción |
|-----------|-------|--------|-------------|--------|
| Posts (sin posts) | FileText | "No tienes posts" | "Crea tu primer post" | "Crear post" |
| Posts (filtro vacío) | Search | "Sin resultados" | "No hay posts {status}" | "Limpiar filtro" |
| Blog (sin posts) | FileText | "Próximamente" | "Aún no hay publicaciones" | - |

### 8.2 Error States

**Componente:** `src/components/ui/error-state.tsx`

```typescript
interface ErrorStateProps {
  title: string;
  description: string;
  retry?: () => void;
}
```

**Casos:**
| Error | Título | Descripción | Acción |
|-------|--------|-------------|--------|
| 404 Post | "Post no encontrado" | "El post que buscas no existe" | "Ir a posts" |
| 403 | "Sin permiso" | "No tienes acceso a este recurso" | "Ir a inicio" |
| 500 | "Error del servidor" | "Algo salió mal" | "Reintentar" |
| Network | "Sin conexión" | "Verifica tu conexión" | "Reintentar" |

### 8.3 Loading States

**Ya existen skeletons, verificar uso:**
- `EditorSkeleton` → Usar en NewPost/EditPost mientras carga
- `PostsSkeleton` → Usar en Posts mientras carga lista
- `PostViewSkeleton` → Usar en PostView mientras carga post

---

## 9. RESPONSIVE Y MOBILE

### 9.1 Breakpoints

```
sm: 640px   - Mobile landscape
md: 768px   - Tablet
lg: 1024px  - Desktop small
xl: 1280px  - Desktop
2xl: 1536px - Desktop large
```

### 9.2 Adaptaciones Mobile

**Editor:**
- < md: Ocultar preview, mostrar tabs "Editar | Preview"
- < md: Toolbar en 2 filas o dropdown
- < md: Botones de acción en bottom fixed bar

**Lista posts:**
- < md: Cards en vez de tabla
- < md: Acciones en swipe o long-press
- < md: Filtros en drawer/sheet

**Sidebar:**
- < md: Sheet que se abre con hamburger menu
- Ya implementado en AppSidebar con useMobile()

### 9.3 Touch Interactions

- Botones mínimo 44x44px para touch
- Swipe en lista para acciones rápidas
- Pull-to-refresh en listas (opcional)

---

## 10. ACCESIBILIDAD (A11Y)

### 10.1 Requisitos WCAG 2.1 AA

**Navegación por teclado:**
- Tab order lógico en formularios
- Focus visible en todos los elementos interactivos
- Escape cierra modales/dropdowns
- Enter/Space activa botones

**Screen readers:**
- Labels en todos los inputs
- Alt text en imágenes
- Aria-labels en botones con solo icono
- Live regions para toasts/errores
- Roles semánticos (nav, main, article)

**Contraste:**
- Texto: ratio mínimo 4.5:1
- UI components: ratio mínimo 3:1
- Verificar con herramienta de contraste

### 10.2 Implementación

**Toolbar buttons:**
```tsx
<Button aria-label="Negrita" title="Negrita (Ctrl+B)">
  <Bold className="h-4 w-4" />
</Button>
```

**Form fields:**
```tsx
<FormField>
  <FormLabel htmlFor="title">Título</FormLabel>
  <FormControl>
    <Input id="title" aria-describedby="title-error" />
  </FormControl>
  <FormMessage id="title-error" role="alert" />
</FormField>
```

**Toast announcements:**
```tsx
<Toaster
  toastOptions={{
    role: 'status',
    'aria-live': 'polite'
  }}
/>
```

---

## 11. PERFORMANCE

### 11.1 Optimizaciones

**Code splitting:**
- Lazy load páginas (ya implementado)
- Lazy load editor (pesado con TipTap)
- Dynamic import para modales grandes

**Caching:**
- React Query / SWR para cache de API (considerar migrar)
- localStorage para drafts (auto-save)
- Service worker para offline (futuro)

**Bundle size:**
- Analizar con `vite-bundle-visualizer`
- Tree-shaking de iconos (usar imports específicos)
- Lazy load TipTap extensions

### 11.2 Métricas Target

| Métrica | Target |
|---------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| TTI | < 3.5s |

---

## 12. TESTING FRONTEND

### 12.1 Unit Tests

**Herramientas:** Vitest + React Testing Library

**Prioridad alta:**
- `PostForm` - Validación, submit, estados
- `useAuth` - Login, logout, token refresh
- `usePosts` - CRUD operations
- Validaciones Zod

### 12.2 Integration Tests

**Herramientas:** Vitest + MSW (mock service worker)

**Flujos a testear:**
- Login → redirect → acceso a posts
- Crear post → ver en lista
- Editar post → ver cambios
- Eliminar post → no aparece en lista

### 12.3 E2E Tests

**Herramientas:** Playwright o Cypress

**Flujos críticos:**
- Registro → confirmación → login
- CRUD completo de post
- Publicar/despublicar
- Navegación autenticada vs pública

---

## 13. ROADMAP DE IMPLEMENTACIÓN

### Fase 1: Core CRUD (Crítico)
1. ProtectedRoute + auth guards
2. Token en API requests
3. Página `/posts/new` con PostForm
4. Página `/posts/:slug/edit`
5. Remover mock data de Posts.tsx
6. Conectar lista real con API

### Fase 2: UX Essentials
7. Toasts para feedback
8. Confirmaciones de acciones destructivas
9. Unsaved changes warning
10. Empty states y error states
11. Loading skeletons en uso

### Fase 3: Polish
12. Filtros y búsqueda en lista
13. Paginación real
14. Acciones bulk
15. Mejoras responsive
16. Accesibilidad

### Fase 4: Features
17. Blog público
18. Duplicar post
19. Auto-save drafts
20. Imágenes en editor
21. SEO metadata

---

## 14. CHECKLIST DE COMPLETITUD

### Autenticación ✅
- [x] ProtectedRoute component
- [x] Auth guards en rutas
- [x] Token en headers API
- [x] Token refresh automático
- [x] Logout UI
- [x] Redirect post-login

### Posts - Crear ✅
- [x] Ruta /dashboard/posts/new
- [x] PostForm component
- [x] Validación Zod
- [x] Upload content flow
- [x] Create post API call
- [x] Success/error feedback (Toast)
- [x] Redirect después de crear

### Posts - Editar ✅
- [x] Ruta /dashboard/posts/:slug/edit
- [x] Cargar post existente (`fetchMyPost`)
- [x] Detectar cambios (isDirty)
- [x] Update content flow
- [x] Update post API call
- [x] Publicar/Despublicar
- [x] Eliminar con confirmación
- [x] Link "Ver post" (si published)
- [x] Mostrar publishedAt

### Posts - Listar ✅
- [x] API real (no mock)
- [x] Filtro por estado
- [x] Búsqueda client-side
- [x] Paginación con nextToken
- [x] Acciones por fila
- [x] Empty state
- [x] Error state
- [x] Loading state

### Posts - Ver ✅
- [x] API real (no mock)
- [x] Metadata (fecha, autor)
- [x] Botón editar (si owner)
- [x] Banner borrador (si owner)
- [x] 404 page

### Editor ✅ (parcial)
- [x] Contenido inicial (edit mode)
- [ ] Word count (opcional)
- [ ] Auto-save indicator (opcional)

### Feedback ✅
- [x] Toast system (Sonner)
- [x] Confirmación eliminar
- [x] Unsaved changes warning (beforeunload)
- [ ] Error boundaries (opcional)

### Responsive
- [ ] Mobile editor
- [ ] Mobile lista
- [ ] Touch targets

### A11y
- [ ] Keyboard navigation
- [ ] Screen reader labels
- [ ] Focus management
- [ ] Color contrast
