# AGENTS.md

## Build, Lint, and Test Commands

### Build

```bash
# Frontend build
npm run build

# Backend build (Docker)
docker-compose build
```

### Development Server

```bash
# Frontend development server
npm run dev

# Backend development server (Docker)
docker-compose up
```

### Linting and Formatting

```bash
# Run all pre-commit hooks
uv run pre-commit run --all-files

# Run specific hooks
uv run pre-commit run ruff --all-files
uv run pre-commit run ruff-format --all-files
uv run pre-commit run mypy --all-files

# Auto-fix issues
uv run ruff check --fix backend/
uv run ruff format backend/
```

### Testing

```bash
# Python backend tests
pytest backend/

# E2E tests
npm run test:e2e
```

## Code Style Guidelines

### Python Backend

- Line length: 120 characters
- Use ruff for linting and formatting
- Type hints encouraged where practical

### Frontend (Svelte/TypeScript)

- Follow existing code style
- Use prettier for formatting (if configured)

## Setup

### Install Dependencies

```bash
# Frontend
npm install

# Backend (with lint tools)
uv sync --group lint
uv run pre-commit install
```
