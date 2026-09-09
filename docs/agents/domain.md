# Domain Docs Layout

This project uses a **single-context** layout.

- `CONTEXT.md` at the project root contains the domain glossary and ubiquitous language.
- `docs/adr/` contains Architecture Decision Records formatted per `ADR-FORMAT.md`.

## Consumer Rules
1. Before creating or reviewing tickets or tests, read `CONTEXT.md`.
2. Do not introduce vocabulary that conflicts with `CONTEXT.md`.
3. Consult `docs/adr/` before proposing architectural modifications.
