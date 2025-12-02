# Writeflow Frontend Implementation Plan

## Executive Summary

El frontend actual tiene ~40% de completitud. La infraestructura está lista (servicios API, stores, componentes UI), pero faltan los flujos críticos de usuario para CRUD de posts.

---

## 1. AUTENTICACIÓN Y SEGURIDAD

### 1.1 Route Guards (Auth Protection)

**Archivo:** `src/components/auth/ProtectedRoute.tsx`

```
Funcionalidad:
- Wrapper que verifica isAuthenticated del store
- Si no autenticado → redirect a /auth/login
- Guardar returnUrl para redirect post-login
- Mostrar loading mientras verifica token
```

**Rutas a proteger:**
| Ruta | Requiere Auth |
|------|---------------|
| `/` | Sí (editor) |
| `/posts` | Sí (mis posts) |
| `/posts/new` | Sí |
| `/posts/:slug/edit` | Sí |
| `/posts/:slug` | No (vista pública) |
| `/auth/*` | No |

**UX Estados:**
- Loading: Spinner centrado mientras verifica
- No auth: Redirect con toast "Inicia sesión para continuar"
- Auth expirado: Redirect con toast "Tu sesión expiró"

### 1.2 Token Management

**Archivo:** `src/services/api.ts`

```
Modificaciones:
- Interceptor que añade Authorization header
- Leer token de authStore o localStorage
- Header: "Authorization: Bearer {accessToken}"
```

**Archivo:** `src/hooks/use-auth.ts`

```
Agregar:
- refreshToken() → POST /auth/refresh
- Llamar refresh cuando token cerca de expirar
- Si refresh falla → logout + redirect login
- Verificar expiración con jwt-decode
```

**UX Estados:**
- Token válido: Requests normales
- Token por expirar (<5min): Refresh silencioso en background
- Token expirado: Intentar refresh, si falla → logout
- Refresh failed: Modal "Tu sesión expiró" con botón "Iniciar sesión"

### 1.3 Logout UI

**Ubicación:** `src/components/layout/AppSidebar.tsx`

```
Agregar:
- Botón/link "Cerrar sesión" en sidebar
- Confirmación opcional
- Llamar authStore.logout()
- Redirect a /auth/login
- Toast "Has cerrado sesión"
```

---

## 2. GESTIÓN DE POSTS - CREAR

### 2.1 Página Crear Post

**Archivo:** `src/pages/posts/NewPost.tsx`
**Ruta:** `/posts/new`

```
Layout:
┌─────────────────────────────────────────────────┐
│ ← Volver a posts          [Guardar borrador] [Publicar] │
├─────────────────────────────────────────────────┤
│ Título: [________________________________]      │
│                                                 │
│ ┌─────────────────────┬───────────────────────┐ │
│ │     Editor          │      Preview          │ │
│ │   (TipTap)          │    (HTML render)      │ │
│ │                     │                       │ │
│ │                     │                       │ │
│ └─────────────────────┴───────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Campos del formulario:**
| Campo | Tipo | Validación | Requerido |
|-------|------|------------|-----------|
| title | Input text | 1-200 chars, no vacío | Sí |
| content | TipTap Editor | No vacío para publicar | Sí para publicar |
| status | Hidden/Select | draft \| published | No (default: draft) |

**Acciones:**
| Botón | Acción | Validación |
|-------|--------|------------|
| Guardar borrador | Crear con status=draft | Solo título requerido |
| Publicar | Crear con status=published | Título + contenido requeridos |
| Cancelar/Volver | Confirmar si hay cambios, navegar a /posts | - |

**Flujo técnico:**
```
1. Usuario escribe título y contenido
2. Click "Guardar borrador" o "Publicar"
3. Validar campos (Zod)
4. setIsSaving(true)
5. Generar slug temporal del título (para upload)
6. uploadService.getUploadUrl(slug)
7. uploadService.uploadContent(presignedUrl, htmlContent)
8. postsService.create({ title, contentKey, status })
9. setIsSaving(false)
10. Toast "Post creado"
11. Navigate a /posts/:slug/edit o /posts
```

**UX Estados:**
| Estado | UI |
|--------|-----|
| Inicial | Formulario vacío, botones habilitados |
| Escribiendo | isDirty=true, mostrar indicador "Sin guardar" |
| Guardando | Botones disabled, spinner en botón activo |
| Error validación | Mensaje bajo campo, borde rojo |
| Error API | Toast error + botones habilitados |
| Éxito | Toast + redirect |

**Manejo de errores:**
| Error | Código | UX |
|-------|--------|-----|
| Título vacío | 400 | "El título es obligatorio" bajo input |
| ContentKey inválido | 403 | Toast "Error al subir contenido" |
| Upload S3 falla | - | Toast "Error al subir, intenta de nuevo" + retry |
| Red/timeout | - | Toast "Sin conexión" + retry button |
| No autenticado | 401 | Redirect login |

### 2.2 Componente PostForm (Reutilizable)

**Archivo:** `src/components/posts/PostForm.tsx`

```typescript
interface PostFormProps {
  initialData?: {
    title: string;
    content: string;
    status: 'draft' | 'published';
  };
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  mode: 'create' | 'edit';
}
```

**Funcionalidad:**
- Formulario completo título + editor
- Validación con Zod
- Unsaved changes warning (beforeunload)
- Auto-save draft cada 30s (opcional)
- Keyboard shortcuts: Ctrl+S guardar, Ctrl+Enter publicar

---

## 3. GESTIÓN DE POSTS - EDITAR

### 3.1 Página Editar Post

**Archivo:** `src/pages/posts/EditPost.tsx`
**Ruta:** `/posts/:slug/edit`

```
Layout: (mismo que crear, con datos cargados)
┌─────────────────────────────────────────────────┐
│ ← Volver    [Estado: Borrador ▼]  [Guardar] [Publicar] │
├─────────────────────────────────────────────────┤
│ Título: [Post existente___________________]     │
│                                                 │
│ ┌─────────────────────┬───────────────────────┐ │
│ │     Editor          │      Preview          │ │
│ │   (contenido        │    (HTML render)      │ │
│ │    cargado)         │                       │ │
│ └─────────────────────┴───────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Creado: 2 dic 2025  |  Actualizado: hace 5 min  │
│ [Eliminar post]                                 │
└─────────────────────────────────────────────────┘
```

**Carga inicial:**
```
1. useEffect con slug de params
2. postsStore.fetchPost(slug) → GET /my/posts/{slug}
3. Si 404 → mostrar "Post no encontrado"
4. Si 403 → mostrar "No tienes permiso"
5. Poblar formulario con datos
```

**Campos adicionales vs crear:**
| Campo | Tipo | Editable |
|-------|------|----------|
| slug | Display only | No (generado) |
| createdAt | Display only | No |
| updatedAt | Display only | No |
| publishedAt | Display only | No |
| status | Select/Toggle | Sí |

**Acciones:**
| Botón | Acción | Condición |
|-------|--------|-----------|
| Guardar | PUT con cambios | Siempre visible |
| Publicar | PUT status=published | Si status=draft |
| Despublicar | PUT status=draft | Si status=published |
| Eliminar | DELETE + confirm | Siempre visible |
| Ver post | Link a /posts/:slug | Si published |

**Flujo técnico actualizar:**
```
1. Usuario modifica título/contenido/status
2. Click "Guardar"
3. Validar cambios
4. Si contenido cambió:
   a. uploadService.getUploadUrl(slug)
   b. uploadService.uploadContent(url, html)
   c. Incluir nuevo contentKey en update
5. postsService.update(slug, { title?, contentKey?, status? })
6. Actualizar store
7. Toast "Cambios guardados"
```

**Flujo técnico publicar/despublicar:**
```
1. Click "Publicar" / "Despublicar"
2. Si publicar: validar que tenga contenido
3. postsService.update(slug, { status: 'published'|'draft' })
4. Actualizar store
5. Toast "Post publicado" / "Post movido a borradores"
```

**Flujo técnico eliminar:**
```
1. Click "Eliminar"
2. Modal confirmación: "¿Eliminar '{título}'? Esta acción no se puede deshacer"
3. Si confirma:
   a. postsService.delete(slug)
   b. Toast "Post eliminado"
   c. Navigate a /posts
```

**UX Estados:**
| Estado | UI |
|--------|-----|
| Cargando post | Skeleton del formulario |
| Post no encontrado | Página error con link a /posts |
| Sin permiso | Página error "No tienes acceso a este post" |
| Editando | Formulario con datos, isDirty tracking |
| Guardando | Spinner en botón, inputs disabled |
| Publicando | Spinner, toast de progreso |
| Eliminando | Modal con spinner |

**Manejo de errores:**
| Error | Código | UX |
|-------|--------|-----|
| Post no existe | 404 | Página "Post no encontrado" |
| No es dueño | 403/404 | Página "No tienes permiso" |
| Conflicto (editado por otro) | 409 | Modal "Post modificado, recargar?" |
| Validación título | 400 | Error bajo input |
| Upload falla | - | Toast + retry |

---

## 4. GESTIÓN DE POSTS - LISTAR

### 4.1 Página Lista de Posts (Mejoras)

**Archivo:** `src/pages/Posts.tsx` (modificar existente)

**Mejoras necesarias:**

```
Layout mejorado:
┌─────────────────────────────────────────────────┐
│ Mis Posts                        [+ Nuevo Post] │
├─────────────────────────────────────────────────┤
│ Filtros: [Todos ▼] [Buscar...________] │
├─────────────────────────────────────────────────┤
│ ┌─────┬──────────┬─────────┬─────────┬────────┐ │
│ │ □   │ Título   │ Estado  │ Fecha   │ ···    │ │
│ ├─────┼──────────┼─────────┼─────────┼────────┤ │
│ │ □   │ Post 1   │ Publ.   │ 2 dic   │ ···    │ │
│ │ □   │ Post 2   │ Borr.   │ 1 dic   │ ···    │ │
│ └─────┴──────────┴─────────┴─────────┴────────┘ │
├─────────────────────────────────────────────────┤
│ Mostrando 1-10 de 25    [< Anterior] [Siguiente >] │
└─────────────────────────────────────────────────┘
```

**Funcionalidades a agregar:**

1. **Remover mock data** - Usar API real
2. **Filtro por estado** - Dropdown: Todos | Publicados | Borradores
3. **Búsqueda** - Input para filtrar por título (client-side o API)
4. **Paginación real** - Usar nextToken del API
5. **Selección múltiple** - Checkbox para acciones bulk
6. **Acciones bulk** - Eliminar seleccionados, Publicar seleccionados
7. **Ordenamiento** - Click en header para ordenar
8. **Refresh** - Botón para recargar lista

**Integración API:**
```typescript
// Cargar posts reales
useEffect(() => {
  const params: ListPostsParams = {};
  if (statusFilter !== 'all') params.status = statusFilter;
  if (limit) params.limit = limit;
  postsStore.fetchMyPosts(params);
}, [statusFilter]);

// Paginación
const handleLoadMore = () => {
  postsStore.loadMore();
};
```

**UX Estados:**
| Estado | UI |
|--------|-----|
| Cargando inicial | Skeleton table (5 rows) |
| Lista vacía | "No tienes posts. ¡Crea tu primero!" + CTA |
| Lista vacía filtrada | "No hay posts {status}" |
| Error carga | "Error al cargar posts" + retry |
| Cargando más | Spinner en botón "Cargar más" |
| No más páginas | Ocultar botón "Cargar más" |

### 4.2 Acciones en Tabla

**Dropdown por fila:**
| Acción | Icono | Navegación/Acción |
|--------|-------|-------------------|
| Ver | Eye | `/posts/:slug` (nueva pestaña si published) |
| Editar | Pencil | `/posts/:slug/edit` |
| Publicar | Upload | PUT status=published (si draft) |
| Despublicar | Download | PUT status=draft (si published) |
| Duplicar | Copy | Crear copia como borrador |
| Eliminar | Trash | Modal confirmación |

**Acciones bulk (con selección):**
| Acción | Confirmación |
|--------|--------------|
| Eliminar seleccionados | "¿Eliminar {n} posts?" |
| Publicar seleccionados | "¿Publicar {n} posts?" |
| Despublicar seleccionados | "¿Mover {n} posts a borradores?" |

---

## 5. GESTIÓN DE POSTS - VER (PÚBLICO)

### 5.1 Página Vista Post (Mejoras)

**Archivo:** `src/pages/PostView.tsx` (modificar existente)

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

**Mejoras necesarias:**

1. **Remover mock data** - Usar API real
2. **Metadata SEO** - Title, description, og:tags
3. **Fecha formateada** - "Publicado el {fecha}"
4. **Autor** - Mostrar nombre/email del autor (si disponible)
5. **Botón editar** - Solo si es el dueño (verificar authorId)
6. **Compartir** - Copiar URL, share to social
7. **Navegación** - Post anterior/siguiente (opcional)

**Lógica de permisos:**
```typescript
const isOwner = post.authorId === authStore.user?.id;
// Mostrar "Editar" solo si isOwner
// Mostrar "Este post es un borrador" si draft && isOwner
```

**UX Estados:**
| Estado | UI |
|--------|-----|
| Cargando | Skeleton (título + párrafos) |
| Post no encontrado | "Post no encontrado" + link home |
| Draft (no owner) | 404 (API lo maneja) |
| Draft (owner) | Banner "Este es un borrador" + contenido |
| Published | Contenido normal |
| Error | "Error al cargar" + retry |

### 5.2 Página Blog Público (Nueva)

**Archivo:** `src/pages/Blog.tsx`
**Ruta:** `/blog` o `/` (para visitantes no auth)

```
Layout:
┌─────────────────────────────────────────────────┐
│ Writeflow Blog                                  │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Post Title 1                                │ │
│ │ Extracto del contenido...                   │ │
│ │ 2 dic 2025 · 5 min lectura                  │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Post Title 2                                │ │
│ │ Extracto del contenido...                   │ │
│ │ 1 dic 2025 · 3 min lectura                  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Cargar más posts]                              │
└─────────────────────────────────────────────────┘
```

**Funcionalidad:**
- Lista posts públicos (GET /posts)
- Cards con título + extracto (primeros 150 chars)
- Fecha publicación
- Tiempo de lectura estimado
- Paginación infinita o botón "cargar más"
- Click → /posts/:slug

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

### Autenticación
- [ ] ProtectedRoute component
- [ ] Auth guards en rutas
- [ ] Token en headers API
- [ ] Token refresh automático
- [ ] Logout UI
- [ ] Redirect post-login

### Posts - Crear
- [ ] Ruta /posts/new
- [ ] PostForm component
- [ ] Validación Zod
- [ ] Upload content flow
- [ ] Create post API call
- [ ] Success/error feedback
- [ ] Redirect después de crear

### Posts - Editar
- [ ] Ruta /posts/:slug/edit
- [ ] Cargar post existente
- [ ] Detectar cambios (isDirty)
- [ ] Update content flow
- [ ] Update post API call
- [ ] Publicar/Despublicar
- [ ] Eliminar con confirmación

### Posts - Listar
- [ ] API real (no mock)
- [ ] Filtro por estado
- [ ] Paginación con nextToken
- [ ] Acciones por fila
- [ ] Empty state
- [ ] Error state
- [ ] Loading state

### Posts - Ver
- [ ] API real (no mock)
- [ ] Metadata (fecha, autor)
- [ ] Botón editar (si owner)
- [ ] Banner borrador (si owner)
- [ ] 404 page

### Editor
- [ ] Contenido inicial (edit mode)
- [ ] Word count
- [ ] Auto-save indicator

### Feedback
- [ ] Toast system
- [ ] Confirmación eliminar
- [ ] Unsaved changes warning
- [ ] Error boundaries

### Responsive
- [ ] Mobile editor
- [ ] Mobile lista
- [ ] Touch targets

### A11y
- [ ] Keyboard navigation
- [ ] Screen reader labels
- [ ] Focus management
- [ ] Color contrast
