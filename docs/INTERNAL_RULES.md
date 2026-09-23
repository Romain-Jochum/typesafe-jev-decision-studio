# Internal Rules & Operational Runbook

These rules govern the development, testing, verification, and release workflow for **TypeSafe Jev Decision Studio**.

---

## 1. Dual Repository Architecture & Remotes

The project maintains two distinct GitHub repositories with strict roles:

| Repository | Visibility | Role | Remote Name |
| :--- | :---: | :--- | :---: |
| **`Romain-Jochum/typesafe-jev-decision-studio`** | **Public** | Official portfolio release. | `origin` |
| **`Romain-Jochum/typesafe-jev-decision-studio-dev`** | **Private** | Development, staging, testing & feature branches. | `dev` |

### Git Remote Mapping
```bash
git remote -v
origin  https://github.com/Romain-Jochum/typesafe-jev-decision-studio.git (public release)
dev     https://github.com/Romain-Jochum/typesafe-jev-decision-studio-dev.git (private staging)
```

---

## 2. Release & Git Policies

1. **Squash Rule for Public Releases**:
   - The public repository must **always** contain clean, squashed release commits (or a single clean initial commit).
   - Never push intermediate debugging or noisy development commits to `origin/main`.
   - Active, multi-step development commits live on `dev/main` or feature branches.

2. **Explicit User Approval Gate**:
   - **Never** publish changes to the public repository or change repository visibility autonomously.
   - Always present verification receipts and consult the user for explicit approval prior to any public release.

3. **Minimalism & Hygiene**:
   - Keep the repository lean and minimal.
   - Strictly avoid committing unused binary images, duplicate icons, test mocks, or temporary files.
   - Every file must have an active, verified purpose.

---

## 3. Mandatory Pre-Release Clean-Room Test

Before any public release, an independent clean-room verification must be executed in an isolated temporary sandbox (`/tmp/...`):

1. **Clone Fresh**:
   ```bash
   rm -rf /tmp/cleanroom-jev-test
   git clone https://github.com/Romain-Jochum/typesafe-jev-decision-studio.git /tmp/cleanroom-jev-test
   cd /tmp/cleanroom-jev-test
   ```
2. **Install**:
   ```bash
   npm install
   ```
3. **Environment**:
   Copy `.env` from `.env.example` and supply valid OpenRouter credentials.
4. **Verification Gates**:
   ```bash
   npm test -- --coverage   # Must be 100% passing and >80% coverage
   npm run lint             # Must be 0 errors, 0 warnings
   npm run build            # Must compile cleanly without errors
   ```
5. **Live Inference E2E Test**:
   - Launch server (`PORT=3030 npm start`).
   - Execute a real inference query against `POST /api/decisions` (`typesafe/jev-1.13`).
   - Verify: Key is loaded, latency is sub-second (<1s), JSON response is parsed into calibrated rankings.
6. **Teardown**:
   - Kill test server and delete `/tmp/cleanroom-jev-test`.

---

## 4. Mandatory Independent Safety Audit

Before any public release, dispatch an independent safety auditor agent to verify:

1. **Secret Leak Prevention**:
   - Deep regex scan across all git history, commit diffs, and tree objects for `sk-or-v1-`, `ghp_`, tokens, and private keys.
   - Confirm `.gitignore` strictly protects `.env`, `.env*.local`, `.env.*`.
   - Confirm `.env.example` contains only template placeholders and zero secrets.
2. **PII & Path Sanitization**:
   - Confirm zero absolute local paths (e.g. `/Users/<username>/...`) in tracked code.
3. **API Boundary**:
   - Confirm `app/api/decisions/route.ts` only exposes masked key previews (`sk-or-v1-••••••••XXXX`) and never returns raw server credentials.
4. **Dependency Audit**:
   - Check `npm audit` for supply chain risks.

---

## 5. UI & Design System Standards

1. **TypeSafe Aesthetic**:
   - Light mode: paper white (`#fefefe`), charcoal text (`#1e1e1e`), light borders (`#e5e5e5`).
   - Dark mode: obsidian (`#0e0d0f`), card (`#151317`), border (`#2c272b`).
   - Emerald accents (`#10b981`) reserved for winners, positive verdicts, and active key badges.
   - Consistent corner radii (`rounded-lg` for cards, `rounded-md` for buttons/badges; no pill shapes).
2. **Default Empty Inputs**:
   - On initial page load, `Context`, `Instructions`, and `Candidate Options` (or `Rubric Levels`) must start empty (`[]` or `""`).
   - Populated only when the user selects a preset from the presets dropdown.
3. **Preserve Subtitle Descriptions**:
   - Maintain helpful descriptive subtitles under card titles (`The statement, document, or event being evaluated.`, etc.).
4. **Unified Decision Results**:
   - Choice view: Single unified scrollable candidate ranking with winner highlight.
   - Noul view: Single verdict banner with SVG validation curve and threshold slider.
   - Score view: Single score rating verdict with rubric distribution bars.
   - Fullscreen raw JSON modal with one-click copy button.

---

## 6. Product Roadmap

1. **Jev CLI for Agentic Workflows**:
   - Build a dedicated, zero-dependency command-line interface to invoke Jev directly in autonomous agent loops (such as Claude Code CLI).
   - Allows agents to use deterministic, calibrated System One decisions for hypothesis testing and execution branch pruning.
2. **Agent Skill Integration**:
   - Deliver an official lightweight Skill instead of a heavyweight MCP to minimize token consumption and context bloat.
3. **Multi-Model Benchmarking**:
   - Systematic latency, cost, and consistency benchmarks comparing Jev against traditional LLM tool-calling.
