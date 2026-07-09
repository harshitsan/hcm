# Prisma Schema Explorer — Design

**Date:** 2026-07-09
**Status:** Approved (verbal, in-session)
**Context:** `db/prisma/schema.prisma` holds 212 models across 15 Postgres schemas. A generated SVG ERD (54k×10k px) is unusable for exploration. We need an interactive, regenerable HTML explorer.

## Goal

A single self-contained HTML page for browsing the schema: find any model fast, read its fields and doc comments, and hop across relations. Regenerable from the schema with one command so it never goes stale.

## Architecture

Two units:

### 1. Generator script — `db/scripts/generate-schema-explorer.mjs`

- Run via `npm run schema:html` (script added to `db/package.json`).
- Parses `db/prisma/schema.prisma` with `getDMMF` from `@prisma/internals` (already present as a prisma dependency). No regex parsing of the schema text, with one exception: the Postgres schema per model comes from DMMF's `model.schema` when the installed Prisma version exposes it, else from the model's `///` doc comment (`schema.table_name` convention used consistently in this file), else from a text scan for `@@schema`.
- Extracts a compact JSON payload:
  - `models[]`: name, pgSchema, tableName (`@@map` or doc comment), doc comment, fields.
  - `field`: name, column name (`@map`), type, isId / isUnique / isRequired / isList, default, relation target + relation field pairs, doc comment (carries allowed status values etc.).
  - `edges[]`: deduped model→model relation pairs for the 1-hop diagram.
- Injects the payload as a `<script type="application/json">` block into an HTML template string kept inside the same script file (one file, no template dir).
- Output: `db/prisma/schema-explorer.html`, fully self-contained (inline CSS/JS, no CDN, works from `file://`).
- Fails loudly (non-zero exit, clear message) if the schema does not parse.

### 2. The HTML page (vanilla JS + inline CSS, no framework)

- **Sidebar:** 15 Postgres schemas as collapsible groups with model counts; fuzzy search filtering by model name or table name; ↑/↓/Enter keyboard navigation.
- **Main pane:** on model select — header (model name, `pgschema.table_name`, doc comment); fields table (column, Prisma type, PK/unique/optional/list badges, FK→Target clickable links, field doc comment); below, a 1-hop relation diagram: selected model centered, neighbors as clickable SVG nodes that navigate.
- **Navigation:** URL hash (`#ModelName`) drives selection → browser back/forward and deep links work.
- **Theme:** light/dark via `prefers-color-scheme`.
- **Empty states:** "no match" for empty search; landing view (schema counts) before any selection.

## Error handling

- Script: exit 1 with the Prisma parse error if the schema is invalid.
- Page: unknown hash → landing view; models with zero relations show fields only, no empty diagram box.

## Testing

Generate, open in browser, verify: search narrows correctly; selecting models across several pgSchemas renders fields matching the schema source; relation links and diagram nodes navigate; back button returns to prior model; payload model count equals 212.

## Out of scope (YAGNI)

Full-graph overview tab, multi-hop diagrams, edit capability, serving via HTTP, bundlers/frameworks.
