# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server with HMR
pnpm build        # Type-check with tsc then build with Vite
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
```

## Code Style

- **Formatter**: Biome with tabs and double quotes for JS/TS
- **Path alias**: Use `@/` for imports from `src/` (e.g., `@/components/ui/button`)
- **Components**: React functional components with TypeScript
- **Styling**: Tailwind CSS v4 with `cn()` utility from `@/lib/utils` for conditional classes

## Architecture

**Writeflow** is a rich text editor application with live preview.

### Editor (`src/components/Editor/`)
- `index.tsx` - Main editor component using TipTap with side-by-side preview
- `extensions.ts` - TipTap extensions config (headings 1-3, lists, links, code blocks, etc.)
- `Toolbar.tsx` - Formatting toolbar with active state tracking
- `Preview.tsx` - Real-time HTML preview rendered via `dangerouslySetInnerHTML`

### UI Components (`src/components/ui/`)
shadcn/ui component library built on Radix UI primitives. Components use `class-variance-authority` for variants.

### Key Dependencies
- TipTap for rich text editing (individual extensions imported separately)
- Radix UI for accessible primitives
- Tailwind CSS v4 + tw-animate-css
- react-hook-form + zod for forms
