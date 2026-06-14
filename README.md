# 4+N SDD — Modular Spec-Driven Development for AI Agents

> **Stop vibe coding. Start spec driving.** A lightweight topology-based workflow that prevents AI attention dilution, fake progress checkmarks, and historical context pollution — with **four-role isolation** (PM / Architect / Designer / Developer).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/zhgstudio/ai-agent-4-n-sdd-skill/actions/workflows/ci.yml/badge.svg)](https://github.com/zhgstudio/ai-agent-4-n-sdd-skill/actions/workflows/ci.yml)
[![skills.sh](https://skills.sh/b/zhgstudio/ai-agent-4-n-sdd-skill)](https://skills.sh/zhgstudio/ai-agent-4-n-sdd-skill/ai-agent-4-n-sdd)

---

## The Pain

AI coding agents suffer from three fatal flaws:

| # | Problem | Symptom |
|---|---------|---------|
| 1 | **Attention Dilution** | All design in one file → AI gets confused as context grows |
| 2 | **Fake Checkmarks** | Tasks marked done before tests pass → broken code ships |
| 3 | **History Pollution** | Old review docs pile up → AI stitches new logic onto dead designs |

**4+N SDD solves all three** by physically isolating global specs from modular designs, and assigning each phase to a dedicated role with its own context scope.

---

## The 4+N Topology

```
├── docs/
│   ├── SPEC.md             # 👑 1. Global Requirements (WHAT)
│   ├── ARCHITECTURE.md     # 🏛️ 2. Global Architecture (HOW)
│   ├── PLAN.md             # 🏃 3. Execution Plan
│   │
│   └── modules/            # 📦 N. Isolated Module Designs
│       ├── {module_a}/     # data-model.md, api.md
│       └── {module_b}/     # protocol.md, state.md
└── AGENTS.md               # 👑 4. Global Agent Behavior Contract
```

---

## The Four-Role Model

| Role | Phase | Reads | Writes |
|------|-------|-------|--------|
| **PM Agent** | Stage 1 | Nothing (fresh session) | SPEC.md |
| **Architect Agent** | Stage 2 | SPEC.md (read-only) | ARCHITECTURE.md, AGENTS.md |
| **Designer Agent** | Stage 3 | ARCHITECTURE.md (dependency matrix) | docs/modules/{module}/ |
| **Developer Agent** | Scaffolding → Stage 4-5 | AGENTS.md + module design files | src/ (code + tests) |

Each role starts a fresh session with a minimal, scoped context. No role confusion, no context pollution.

---

## The 5-Stage Protocol

```
─── Harness Engineering (human-supervised) ───
Stage 1: SPEC.md          → PM Agent writes requirements
Stage 2: ARCHITECTURE.md  → Architect Agent designs system
Stage 3: Module Designs   → Designer Agent per module
         Code Scaffolding → Developer Agent sets up build + test framework
─── AI Autonomous Coding ───
Stage 4: PLAN.md          → Developer Agent breaks down micro-tasks
Stage 5: TDD & Code       → Developer Agent implements, test-first
```

Every Harness stage (plus scaffolding) ends with a **human review gate**. Autonomous stages run without intervention.

---

## Quick Start

### 1. Install the skill

```bash
# Recommended — auto-detects your AI platform
npx skills add https://github.com/zhgstudio/ai-agent-4-n-sdd-skill --skill ai-agent-4-n-sdd

# Or manually
git clone --depth 1 https://github.com/zhgstudio/ai-agent-4-n-sdd-skill.git /tmp/sdd-skill
cp -r /tmp/sdd-skill/ai-agent-4-n-sdd .opencode/skills/
rm -rf /tmp/sdd-skill
```

### 2. Start a new session

```
Read .opencode/skills/ai-agent-4-n-sdd/SKILL.md.
My new project is: [one-line description].
Follow the skill strictly and start Stage 1 — generate docs/SPEC.md.
```

### 3. Iterate through stages

Human reviews → AI implements → Tests pass → Git commit → Next stage.

---

## Tooling: sdd-check

Validate your project's SDD structure compliance with the built-in checker:

```bash
node tools/sdd-check/index.js --path /path/to/project
```

It performs 5 checks:

| Check | What it validates |
|-------|-------------------|
| **FILE_EXISTS** | `SPEC.md`, `ARCHITECTURE.md`, `PLAN.md`, `AGENTS.md` all present |
| **PLAN_FORMAT** | Task lines match `- [ ] T###: description` format |
| **DEP_MATRIX** | Modules in dependency matrix have `docs/modules/{name}/` directories |
| **NO_GARBAGE** | No `_v2.md`, `_final.md`, `.bak.md` versioned garbage files |
| **AGENTS_SECTIONS** | All 5 required sections present in `AGENTS.md` |

Use `--json` for CI integration and `--strict` to treat warnings as errors.

---

## Platform Support

| Platform | Integration |
|----------|-------------|
| OpenCode | `.opencode/skills/` |
| Claude Code | `.claude/skills/` |
| Cursor | `.cursorrules` |
| Any AI CLI | Load SKILL.md as system prompt |

---

## Comparison

| Aspect | Traditional (Vibe Coding) | 4+N SDD |
|--------|---------------------------|---------|
| Context size | Grows unbounded | Physically scoped |
| Task tracking | Self-reported | Test-verified |
| Design docs | One giant file | 4+N isolated files |
| Human review | Once at end | Per-stage gates |
| Role separation | None (one agent does all) | 4 dedicated roles |
| History handling | `_v2.md` garbage | Git-based overwrite |

---

## Contributing

PRs, issues, and ideas welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT © zhgstudio
