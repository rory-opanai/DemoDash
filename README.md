# OpenAI API Demo Hub (Phase 1)

A frontend-only Next.js scaffold inspired by the OpenAI product UI. Phase 1 builds the complete UI/UX, state, and mocks - no real API calls or credentials required.

## Tech
- Next.js (App Router) + TypeScript + React 18
- Tailwind CSS + small shadcn-style primitives + lucide-react
- Zustand for global/state persistence (localStorage)
- react-hook-form + zod for forms (Settings)
- framer-motion for light animations
- recharts for the Forecasting mock

## Getting started
```bash
# install
pnpm i   # or: npm i

# run dev server
pnpm dev # or: npm run dev
```

Open `http://localhost:3000`.

No keys are required in Phase 1. The Settings page lets you enter a token, but it is only stored locally and validated syntactically.

## Project structure
```
app/                      # Next.js App Router pages
  layout.tsx              # Global layout + header/footer
  page.tsx                # Dashboard
  */page.tsx              # Feature routes
src/
  components/             # UI and feature components
  stores/                 # Zustand stores (app, auth, history)
  mocks/                  # Local mocks that simulate API output
  types/                  # Shared types (history items)
  lib/                    # Utilities (cn, ids, download)
styles/gradients.css      # Gradient utilities used on hero cards
```

## Feature pages
All feature routes use the shared `FeaturePage` layout:
- Left: `HistoryPanel` with `HistoryCard` entries (Remix/Download/Delete)
- Right: `PromptPanel` with Prompt Optimiser modal and Advanced Params accordion
- Generate/Run actions create a mocked item with running -> ready state

Routes:
- `/` Dashboard with three hero cards and nine feature tiles (Connectors disabled with tooltip)
- `/image-gen`, `/video-gen`, `/realtime`, `/knowledge-assistant`, `/embeddings-search`, `/structured-output`, `/support-bot`, `/forecasting`, `/connectors` (coming soon)
- `/settings` for BYOK + model + toggles
- `/mcp-dev` hidden dev page

## Design
- Soft, neutral palette; rounded cards; subtle shadows
- Light/Dark via `next-themes`
- Focus-visible rings, keyboard-accessible components
- Gradients in `styles/gradients.css`

## Phase plan
- Phase 1 (this repo): UI, stores, mocks - no network calls
- Phase 2: Replace mocks with real API calls per page. TODO markers are placed around mocks. Wire BYOK to actual requests.

## Where to add real API logic (Phase 2)
- Replace modules in `src/mocks/*` with real service modules
- In each page within `app/*/page.tsx`, swap the call from the mock to your API client and continue creating `HistoryItem` objects

## CI
A small GitHub Actions workflow (optional) runs type-check and build. See `.github/workflows/ci.yml`.

## License
MIT
