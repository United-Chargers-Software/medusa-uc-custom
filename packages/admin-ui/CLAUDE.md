# CLAUDE.md

@.claude/CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package overview

`@medusajs/admin-ui` is a United Chargers fork of the upstream Medusa JS admin UI. It is consumed by the `@medusajs/admin` plugin, which embeds this SPA into the Medusa backend server. Do not install or use this package standalone.

## Commands

```bash
# Start dev server (proxies to backend at BE_URL, default http://localhost:9000)
BE_URL=http://localhost:9000 yarn dev          # served at http://localhost:7001

# Build the publishable package (tsup → dist/)
yarn build

# Run tests (Node-side utilities only; no UI tests exist)
yarn test

# Run a single test file
yarn test -- src/node/utils/__tests__/normalize-path.spec.ts

# Sync i18n translation keys from source
yarn sync:i18n

# Analyze bundle size
yarn analyze:bundle
```

## Architecture

### Two distinct layers

The package publishes two separate layers from a single source tree:

1. **Node utilities** (`src/node/`) — exported as `dist/index.{js,mjs}`. Provides `build`, `develop`, `clean` lifecycle actions, webpack config helpers (`withCustomWebpackConfig`, `getWebpackConfig`), and extension validators used by the parent `@medusajs/admin` plugin at build time.

2. **React SPA** (`ui/src/`) — bundled by webpack (not tsup). Entry point is `ui/src/main.tsx`. This is the actual browser application.

The root `src/index.ts` re-exports both layers, and `src/client/index.ts` re-exports the public extension types from the UI layer so plugin authors can reference them.

### React SPA internals (`ui/src/`)

**Bootstrap flow**: `main.tsx` → `MedusaApp` class → registers extensions (widgets/routes/settings) from `_main-entry.ts` (generated at build time) → renders `<Providers>` wrapping `<App>`.

**Routing**: `App.tsx` defines top-level routes (`/`, `/login`, `/a/*`, etc.). The authenticated dashboard at `/a/*` is in `pages/a.tsx`, which mounts all domain routes:

| Route | Domain |
|---|---|
| `orders/*` | `domain/orders` |
| `products/*` | `domain/products` |
| `customers/*` | `domain/customers` |
| `settings/*` | `domain/settings` |
| `draft-orders/*` | `domain/orders/draft-orders` |
| `pricing/*` | `domain/pricing` |
| `inventory/*` | `domain/inventory` |
| `collections/*`, `gift-cards/*`, `discounts/*`, `sales-channels/*`, `publishable-api-keys/*` | respective `domain/` folders |

**Provider stack** (outer → inner): `HelmetProvider` → `MedusaProvider` (React Query + API client) → `AccessProvider` (RBAC) → `FeatureFlagProvider` → `PollingProvider` → `ImportRefresh` → `SteppedProvider` / `LayeredModalProvider` → `WidgetProvider` / `RouteProvider` / `SettingProvider`.

**Component hierarchy**: `atoms/` → `fundamentals/` → `molecules/` → `organisms/` → `templates/`. Domain pages compose these from bottom up.

**API communication**: Most requests use `medusa-react` hooks (React Query wrappers). Custom endpoints use the `medusaRequest` axios utility (`utils/request.ts`), which points at `MEDUSA_BACKEND_URL` (env var, default `http://localhost:9000`).

**Extension system**: Three registries (`WidgetRegistry`, `RouteRegistry`, `SettingRegistry`) allow plugins to inject UI at named `InjectionZone` slots, add top-level routes, or add cards to the Settings overview. Zones are enumerated in `constants/injection-zones.ts`.

### United Chargers customizations

These features are UC-specific additions not in upstream Medusa:

- **`AccessProvider`** — calls `GET /admin/access` to get per-path RBAC permissions; gates navigation based on the response.
- **`domain/settings/printers/`** — PrintNode printer management (sync, add, edit).
- **`domain/settings/users-roles/`** — custom user role management.
- **`domain/settings/users-permissions/`** — per-user permission assignment.
- **`domain/orders/sales-report/`** and **`domain/orders/packing-slips-report/`** — custom batch export features in the Orders list.

### Styling

Tailwind CSS with `@medusajs/ui-preset`. The grey scale (`grey-0` → `grey-90`) and spacing tokens (`xsmall`, `base`, `xlarge`, etc.) come from the preset. Dark mode uses the `class` strategy.

### i18n

i18next with `i18next-http-backend` (loads translation JSON at runtime) and `i18next-browser-languagedetector`. Translation keys are extracted with `yarn sync:i18n`. Supported locales: `en`, `de`, `fr`, `it`, `pt`, `ar`.

## Key files

| File | Purpose |
|---|---|
| `ui/src/medusa-app.tsx` | App class, extension registration |
| `ui/src/App.tsx` | Top-level router |
| `ui/src/pages/a.tsx` | Authenticated dashboard + all domain routes |
| `ui/src/providers/providers.tsx` | Full provider composition |
| `ui/src/providers/access-provider.tsx` | UC custom RBAC |
| `ui/src/utils/request.ts` | Raw axios client for custom API calls |
| `ui/src/constants/medusa-backend-url.ts` | Backend URL resolution |
| `ui/src/types/extensions.ts` | Public extension type contracts |
| `src/node/webpack/get-webpack-config.ts` | Webpack config factory |
| `webpack.config.dev.ts` | Dev server configuration (port 7001) |
| `tsup.config.ts` | Package build configuration |
