# scaffold

Scaffold a new project from a description. Generates complete, working project structure.

## What it does
1. Reads your project description
2. Selects appropriate stack (Python/FastAPI, TS/Express, Rust/Axum, etc.)
3. Generates: directory structure, config files, entry point, tests, README
4. All files are complete and runnable immediately

## Supported stacks
- Python: FastAPI, Django, Flask, CLI (uv-based)
- TypeScript: Express, Fastify, Next.js (Bun-based)
- Rust: Axum, Actix, CLI
- Go: Chi, Gin
- Full-stack: Next.js + FastAPI, SvelteKit

## Usage
```
/scaffold "REST API for a todo app with SQLite and auth"
/scaffold "CLI tool in Rust for file encryption"
```
