# Changelog

All notable changes to the OpenSDD Skill will be documented here.

## [3.1.0] - 2026-06-19

### Changed
- **SKILL.md restructuring**: Split phase execution contracts into 5 independent files (phase-1.md ~ phase-4.md + finalization.md). SKILL.md now only contains overview, topology, role model, constraints, and references to phase files — eliminating significant redundancy
- **Phase 3 serial constraint relaxed**: Non-dependent modules can now be designed in parallel (previously all modules were strictly serial)
- **Document language made configurable**: Language is now specified by the human at project start, applied to all phases (previously hardcoded to Chinese)
- **Module numbering clarified**: Numbers are append-only identifiers (like serial numbers), no insertion allowed — explicitly documented
- **Git push allowed**: AI is now permitted `git push` (current branch only) in addition to `git add` and `git commit`

### Added
- **Phase contract files**: `phase-1.md`, `phase-2.md`, `phase-3.md`, `phase-4.md`, `finalization.md` — each contains the full execution contract for its respective stage

## [3.0.0] - 2026-06-19

### Changed
- **Renamed**: `ai-agent-4-n-sdd` → `opensdd` (Open Spec-Driven Documentation)
- **Repositioned**: Skill scope narrowed to pre-development specification phase only (no coding, no TDD)
- **Four-role model revised**: Last role changed from Developer to Project Manager Agent
- **Document topology restructured**: `docs/modules/{NN}-{name}/DESIGN.md` with two-digit numeric prefix
- **AGENTS.md**: Changed from single-stage architect output to multi-stage incremental accumulation
- **PLAN.md**: Repositioned as pure task tracking with mandatory DESIGN.md section references
- **ARCHITECTURE.md**: Now contains module reference table with `NN-name` format + per-module DESIGN.md references
- **Change propagation**: Formalized cascading update protocol for cross-document traceability

### Added
- **Module reference table** in ARCHITECTURE.md with numbered entries
- **F-{NNN} feature numbering** in DESIGN.md for traceability
- **DESIGN.md section references** in PLAN.md tasks (e.g. `[01-auth/DESIGN.md#F-001]`)
- **AGENTS.md accumulation model**: PM (quality criteria) → Architect (technical rules) → PM (task conventions) → Human (lock)

### Removed
- All coding-related phases (TDD, contract-first, test verification) — now belongs to downstream skills
- `docs/modules/{name}/` flat naming → replaced with `docs/modules/{NN}-{name}/DESIGN.md`
- Designer Agent no longer writes to AGENTS.md

## [2.0.0] - 2026-06-15

### Changed
- **Four-role model**: Split workflow into PM / Architect / Designer / Developer agents with physical context isolation per role
- **Harness Engineering**: Introduced as explicit concept — Stage 1-3 + Scaffolding, before AI autonomous coding
- **Stage 1 → PM Agent**: Corrected role ownership (was incorrectly assigned to architect)
- **ADR simplified**: Architecture decisions briefly noted in ARCHITECTURE.md, no separate directory
- **Git branch policy**: AI works on human-preset branch only, never creates or switches branches
- **Serial execution**: Explicit constraint — one module at a time, no parallelism

### Added
- **Scaffolding step**: Developer Agent builds project skeleton + test framework in Harness phase
- **Role-based access constraints**: Each agent role has explicit read/write scope

### Removed
- Separate ADR directory requirement

## [1.0.0] - 2026-06-14

### Added
- Initial release of the 4+N SDD Skill
- 5-stage execution protocol: SPEC → ARCHITECTURE → modules → PLAN → TDD
- Context isolation topology for AI attention management
- Micro-gatekeeping review workflow
- Support for OpenCode, Claude Code, and Cursor
