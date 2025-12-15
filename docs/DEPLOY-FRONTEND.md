# Deploy Frontend - Cloudflare Pages

Guía completa para desplegar el frontend de Writeflow en Cloudflare Pages con CI/CD automatizado.

## Tabla de Contenidos

1. [Requisitos previos](#requisitos-previos)
2. [Configuración inicial en Cloudflare](#configuración-inicial-en-cloudflare)
3. [Configuración del proyecto](#configuración-del-proyecto)
4. [GitHub Actions CI/CD](#github-actions-cicd)
5. [Variables de entorno](#variables-de-entorno)
6. [Dominios personalizados](#dominios-personalizados)
7. [Estrategia de branches](#estrategia-de-branches)

---

## Requisitos previos

- Cuenta en [Cloudflare](https://dash.cloudflare.com/sign-up) (gratis)
- Repositorio en GitHub
- Backend desplegado en AWS (necesitas la `VITE_API_URL`)

---

## Configuración inicial en Cloudflare

### Paso 1: Crear proyecto en Cloudflare Pages

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Selecciona **Workers & Pages** en el menú lateral
3. Click en **Create application** → **Pages** → **Connect to Git**
4. Autoriza Cloudflare a acceder a tu cuenta de GitHub
5. Selecciona el repositorio `writeflow`

### Paso 2: Configurar el build

| Campo | Valor |
|-------|-------|
| Project name | `writeflow` |
| Production branch | `main` |
| Framework preset | `Vite` |
| Build command | `cd app && pnpm install && pnpm build` |
| Build output directory | `app/dist` |
| Root directory | `/` (dejar vacío) |

### Paso 3: Variables de entorno (en Cloudflare)

En la sección **Environment variables**, añade:

| Variable | Valor | Entorno |
|----------|-------|---------|
| `VITE_API_URL` | `https://xxx.execute-api.us-east-1.amazonaws.com/prod` | Production |
| `VITE_API_URL` | `https://xxx.execute-api.us-east-1.amazonaws.com/dev` | Preview |
| `NODE_VERSION` | `22` | All |

Click **Save and Deploy**.

---

## Configuración del proyecto

### Archivo `_redirects` para SPA routing

Crea el archivo `app/public/_redirects`:

```
/* /index.html 200
```

Esto asegura que todas las rutas del SPA funcionen correctamente (evita 404 en refresh).

### Archivo `_headers` para seguridad (opcional)

Crea el archivo `app/public/_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## GitHub Actions CI/CD

### Opción A: Deploy automático con Cloudflare (recomendado)

Cloudflare Pages ya incluye CI/CD integrado. Cada push a cualquier branch:
- `main` → Deploy a producción
- Otras branches → Deploy preview con URL única

**No necesitas GitHub Actions** si usas esta opción.

### Opción B: GitHub Actions con control total

Si prefieres más control (tests, lint, builds condicionales), usa GitHub Actions:

#### Paso 1: Obtener credenciales de Cloudflare

1. Ve a [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token** → **Custom token**
3. Configura:
   - **Token name**: `GitHub Actions - Writeflow`
   - **Permissions**:
     - Account → Cloudflare Pages → Edit
   - **Account Resources**: Include → Tu cuenta
4. Click **Continue to summary** → **Create Token**
5. Copia el token (solo se muestra una vez)

#### Paso 2: Obtener Account ID

1. Ve a **Workers & Pages** en Cloudflare Dashboard
2. El **Account ID** está en la barra lateral derecha

#### Paso 3: Configurar secretos en GitHub

Ve a tu repositorio → **Settings** → **Secrets and variables** → **Actions**

Añade estos secretos:

| Secret | Valor |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | El token creado en paso 1 |
| `CLOUDFLARE_ACCOUNT_ID` | Tu Account ID |

#### Paso 4: Crear workflow de GitHub Actions

Crea `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main, develop]
    paths:
      - 'app/**'
      - '.github/workflows/deploy-frontend.yml'
  pull_request:
    branches: [main]
    paths:
      - 'app/**'

env:
  NODE_VERSION: '22'

jobs:
  lint-and-test:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          cache-dependency-path: app/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install
        working-directory: app

      - name: Run linter
        run: pnpm lint
        working-directory: app

      - name: Type check
        run: pnpm exec tsc --noEmit
        working-directory: app

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          cache-dependency-path: app/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install
        working-directory: app

      - name: Build
        run: pnpm build
        working-directory: app
        env:
          VITE_API_URL: ${{ vars.VITE_API_URL_PROD }}

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: app/dist
          retention-days: 1

  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    permissions:
      contents: read
      deployments: write
      pull-requests: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: app/dist

      - name: Deploy to Cloudflare Pages (Preview)
        uses: cloudflare/wrangler-action@v3
        id: deploy
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy app/dist --project-name=writeflow --branch=${{ github.head_ref }}

      - name: Comment PR with preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🚀 Deploy Preview Ready!\n\n**Preview URL:** ${{ steps.deploy.outputs.deployment-url }}\n\n*Deployed commit: \`${{ github.sha }}\`*`
            })

  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    permissions:
      contents: read
      deployments: write
    environment:
      name: production
      url: ${{ steps.deploy.outputs.deployment-url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: app/dist

      - name: Deploy to Cloudflare Pages (Production)
        uses: cloudflare/wrangler-action@v3
        id: deploy
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy app/dist --project-name=writeflow --branch=main

      - name: Deployment Summary
        run: |
          echo "## 🎉 Production Deployment Complete!" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**URL:** ${{ steps.deploy.outputs.deployment-url }}" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Commit:** \`${{ github.sha }}\`" >> $GITHUB_STEP_SUMMARY

  deploy-staging:
    name: Deploy Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    permissions:
      contents: read
      deployments: write
    environment:
      name: staging
      url: ${{ steps.deploy.outputs.deployment-url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          cache-dependency-path: app/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install
        working-directory: app

      - name: Build for staging
        run: pnpm build
        working-directory: app
        env:
          VITE_API_URL: ${{ vars.VITE_API_URL_DEV }}

      - name: Deploy to Cloudflare Pages (Staging)
        uses: cloudflare/wrangler-action@v3
        id: deploy
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy app/dist --project-name=writeflow --branch=develop
```

#### Paso 5: Configurar variables en GitHub

Ve a **Settings** → **Secrets and variables** → **Actions** → **Variables**

| Variable | Valor |
|----------|-------|
| `VITE_API_URL_PROD` | `https://xxx.execute-api.us-east-1.amazonaws.com/prod` |
| `VITE_API_URL_DEV` | `https://xxx.execute-api.us-east-1.amazonaws.com/dev` |

---

## Variables de entorno

### Resumen de configuración

| Variable | Dónde configurar | Valor |
|----------|------------------|-------|
| `VITE_API_URL` | Cloudflare Pages | URL de tu API Gateway |
| `VITE_API_URL_PROD` | GitHub Actions (vars) | URL de producción |
| `VITE_API_URL_DEV` | GitHub Actions (vars) | URL de desarrollo |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions (secrets) | Token de API |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions (secrets) | Tu Account ID |

---

## Dominios personalizados

### Añadir dominio propio

1. En Cloudflare Pages → Tu proyecto → **Custom domains**
2. Click **Set up a custom domain**
3. Ingresa tu dominio (ej: `writeflow.tudominio.com`)
4. Cloudflare configurará automáticamente:
   - DNS (si el dominio está en Cloudflare)
   - Certificado SSL
   - Redirect de www → non-www (o viceversa)

### Si el dominio NO está en Cloudflare

Añade estos registros DNS en tu proveedor:

| Tipo | Nombre | Contenido |
|------|--------|-----------|
| CNAME | `writeflow` | `writeflow.pages.dev` |
| CNAME | `www.writeflow` | `writeflow.pages.dev` |

---

## Estrategia de branches

```
main (producción)
  │
  └── develop (staging)
        │
        ├── feature/nueva-funcionalidad
        ├── fix/bug-critico
        └── ...
```

### Flujo de trabajo

| Evento | Branch | Resultado |
|--------|--------|-----------|
| Push | `main` | Deploy a producción |
| Push | `develop` | Deploy a staging |
| Pull Request | cualquiera → `main` | Deploy preview + comentario en PR |
| Push | `feature/*` | Solo lint y build (sin deploy) |

### URLs generadas

| Entorno | URL |
|---------|-----|
| Producción | `https://writeflow.pages.dev` |
| Staging | `https://develop.writeflow.pages.dev` |
| Preview (PR #123) | `https://abc123.writeflow.pages.dev` |
| Custom domain | `https://writeflow.tudominio.com` |

---

## Verificación del deploy

### Checklist post-deploy

- [ ] La app carga correctamente
- [ ] El routing del SPA funciona (refresh en `/dashboard` no da 404)
- [ ] Las llamadas a la API funcionan (login, crear post)
- [ ] El certificado SSL está activo (candado verde)
- [ ] Las variables de entorno se aplicaron correctamente

### Debugging

**Ver logs de build en Cloudflare:**
1. Workers & Pages → Tu proyecto → **Deployments**
2. Click en el deployment → **View build log**

**Ver logs en GitHub Actions:**
1. Repository → **Actions** → Click en el workflow run
2. Expande cada job para ver los logs

---

## Rollback

### En Cloudflare (recomendado)

1. Ve a **Deployments** en tu proyecto
2. Encuentra el deployment anterior que funcionaba
3. Click en los 3 puntos → **Rollback to this deployment**

### Desde GitHub

```bash
# Revertir al commit anterior
git revert HEAD
git push origin main
```

---

## Costos

| Concepto | Free Tier | Pro ($20/mes) |
|----------|-----------|---------------|
| Requests | Ilimitados | Ilimitados |
| Bandwidth | Ilimitado | Ilimitado |
| Builds | 500/mes | 5,000/mes |
| Concurrent builds | 1 | 5 |
| Sites | Ilimitados | Ilimitados |

Para un proyecto personal/portfolio, el **Free Tier es más que suficiente**.
