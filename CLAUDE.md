# TypeSafe Jev Decision Studio — Agent Instructions & Rules

This project is the official portfolio workbench for **TypeSafe Jev (`typesafe/jev-1.13`)** via OpenRouter.
All agent workflows in this repository MUST follow the internal operational rules defined below and in [`docs/INTERNAL_RULES.md`](docs/INTERNAL_RULES.md).

---

## 1. Architecture & Dual Repository Model

- **Public Release Repo**: `https://github.com/Romain-Jochum/typesafe-jev-decision-studio` (`origin`)
- **Private Development Repo**: `https://github.com/Romain-Jochum/typesafe-jev-decision-studio-dev` (`dev`)
- **Git Remotes**:
  - `origin` = Public release (squashed commits only)
  - `dev` = Private staging / development environment

---

## 2. Release & Git Policies

- **Squashed Public Commits**: Public releases must ALWAYS be squashed into a single clean commit. Never leave intermediate/debug commits on the public repo.
- **Explicit User Approval**: NEVER publish to public or change visibility without explicit user confirmation.
- **Minimal Footprint**: Keep tracked files minimal (prune unused images, duplicate icons, dead code).
- **Never Track Secrets**: `.env` and `.env*.local` must NEVER be committed. Only `.env.example` with blank placeholders is tracked.

---

## 3. Mandatory Pre-Release Verification

Before any public release, execute:
1. **Clean-Room Sandbox Simulation**: Clone into `/tmp/...`, run `npm install`, configure `.env`, run `npm test -- --coverage` (>80% required), `npm run lint`, `npm run build`, and test a live inference call against `typesafe/jev-1.13`.
2. **Independent Safety Audit**: Scan all git objects and commits for zero API keys (`sk-or-v1-`), verify `.gitignore`, check for zero local path leaks (e.g. `/Users/<username>/...`), and verify masked key display in UI.

---

## 4. Design & UI Standards

- **Theme**: TypeSafe design language (Paper white `#fefefe` in light mode, Obsidian `#0e0d0f` in dark mode, crisp `#10b981` emerald accents).
- **Default State**: Context, Instructions, and Options/Rubrics must start EMPTY on initial load. They populate only when a preset is selected.
- **Card Subtitles**: Preserve explanatory subtitles (`The statement, document, or event being evaluated.`).
- **Hierarchy**: Compact presets selector in top tab bar row, single scrollable ranked results list, interactive SVG calibration curves, and fullscreen raw JSON modal.

---

## 5. Roadmap Priorities

1. **Jev CLI for Agentic Workflows**: Build a zero-dependency CLI tool for coding agents (e.g. Claude Code CLI) to invoke Jev for deterministic decision-making and rapid hypothesis testing.
2. **Agent Skill Integration**: Deliver an official Skill (rather than a heavy MCP) for friction-free agent integration with minimal token footprint.

---

## Commands

```bash
npm run dev           # Start Next.js development server
npm test              # Run Vitest suite (41/41 passing required)
npm run test:coverage # Run Vitest with V8 code coverage (>80% required)
npm run lint          # Run ESLint (0 errors, 0 warnings required)
npm run build         # Build production Next.js bundle
npm start             # Start production server
```
