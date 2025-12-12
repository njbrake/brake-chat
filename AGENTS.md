# Repository Guidelines

Brake Chat combines a SvelteKit frontend with a FastAPI backend; use this guide to stay consistent.

## Project Structure & Module Organization

- `src/` SvelteKit app (`routes/` pages, `lib/components` reusable UI, `lib/utils|stores|apis` helpers); shared assets in `static/`.
- `backend/open_webui/` FastAPI service (`routers/` APIs, `models/` data, `storage/` persistence, `retrieval/` search). `backend/dev.sh` runs it locally.
- Tests: `backend/open_webui/test/` (pytest) and `cypress/` (E2E); fixtures in `test/test_files/`.
- Ops: `docker-compose.yaml` + `Makefile` for docker, `kubernetes/` manifests, build output in `build/`.

## Build, Test, and Development Commands

- Install frontend deps: `npm install` (Node 18–22). Run UI: `npm run dev` (5173) or `npm run dev:5050`.
- Build/preview: `npm run build`, `npm run preview`.
- Lint/format/types: `npm run check`, `npm run lint`, `npm run lint:backend`, `npm run format`, `npm run format:backend`.
- Tests: `npm run test:frontend` (vitest) and `npm run cy:open` (Cypress).
- Backend app: `cd backend && uv sync --locked` (or `uv pip install -r requirements.txt`), then `uv run uvicorn open_webui.main:app --reload --port 8080` or `./dev.sh`. Docker: `make install` to start, `make stop` to halt.

## Coding Style & Naming Conventions

- Prettier controls formatting (tabs, single quotes, width 100, LF). Prefer TypeScript, PascalCase component files, camelCase helpers/stores, kebab-case routes.
- ESLint is permissive on unused/any; still keep lint clean before PR.
- Python 3.11–3.12; Ruff (line 120) and pylint run on backend. Use snake_case for functions/modules and CapWords for classes.

## Testing Guidelines

- Add vitest specs near the UI logic; mock network calls.
- Cypress flows live in `cypress/e2e`; avoid brittle selectors and explain waits.
- Backend: `uv run pytest backend/open_webui/test` with `test_*.py` and fixtures from `backend/open_webui/test/util`. Cover error cases and schema validation for new endpoints.

## Commit & Pull Request Guidelines

- Match the short, prefixed commit style in history (`feat:`, `chore:`, `fix:`) with imperative wording; add scope/PR number if useful.
- PRs: include a summary, linked issue, screenshots/GIFs for UI changes, API/migration notes, and rollback/feature-flag plans for risky work.
- Ensure `npm run lint`, frontend tests, and pytest pass before requesting review; call out any skipped suites.

## Environment & Security Notes

- Start from `.env.example`; do not commit secrets. `backend/start.sh` can generate `WEBUI_SECRET_KEY`, but set real values locally or in a secret manager.
- External providers or Redis need URLs/keys; use placeholders for tests and avoid logging credentials.
