# Changelog

All notable changes to the OpenSDD Skill will be documented here.

## [Unreleased]

### Changed
- **AGENTS.md terminology**: "已决澄清" → "决策记录" aligned with DECISIONS.md
- **SKILL.md MODULE naming clarified**: Hyphens in directory names are preserved in uppercase MODULE prefix
- **plan.js/config.js regex support for multi-word MODULE names**: Updated all task ID, feature reference, and dependency regexes to support hyphens in MODULE names (e.g. `T-TASK-CORE-001`)
- **CI only tests Node 22** (ci.yml): Removed Node 18/20 from test matrix, fixed to Node 22 only (aligned with engines >=22)
- **README.zh.md cleaned**: Removed `.npmrc` configuration reference from getting-started
- **`{NN}-F{NNN}` → `{MODULE}-F{NNN}`**: Corrected 5 occurrences of the old `{NN}-F{NNN}` feature numbering term across README.md, README.zh.md, docs/DECISIONS.md, and opensdd/SKILL.md for consistency with the module prefix naming convention

### Fixed
- **SECURITY.md vulnerability disclosure**: Added private reporting guidance instead of only public issue tracker
- **Frontmatter regex filter**: `.md` files without `---` frontmatter are now correctly skipped instead of parsing `---` from content body
- **`strategies/index.js`**: Removed unreachable `fallback` variable assignment (dead code)
- **`.gitignore`**: Added `tmp/` entries for module temp directories to prevent accidental commits
- **`finalization.md` VERSION_CONSISTENCY description**: Clarified that the check validates version alignment across all three locations (root `package.json`, `opensdd-check/package.json`, and SKILL.md metadata)
- **`README.md`**: Removed extraneous blank line in Stage 1 description
- **`SKILL.md` exception path**: Changed ambiguous `tmp/` reference to explicit `docs/modules/{NN}-{name}/tmp/` to eliminate path ambiguity
- **`CONTRIBUTING.md`**: Replaced hardcoded test count (`171+ tests`) with generic description

### Infrastructure
- **`.editorconfig` added**: Coding style consistency across editors (indent_style, charset, end_of_line)

## [3.3.0] - 2026-06-19

### Changed
- **AGENTS.md heading constraint softened** (phase-2.md): "必须使用 `## `" relaxed to "顶层章节须使用 `## `"，子层级允许 `### `
- **Terminology clarified**: "被依赖模块" → "所依赖模块" across all skill docs, phase files, and README.zh.md to eliminate ambiguity about which module is the dependent vs provider
- **PLAN.md dependency syntax formalized** (phase-4.md): `depends: T-NNN` with comma-separated multi-dependency syntax defined; plan.js now validates dependency references
- **Language detection improved**: `detectLanguage()` now strips code blocks, inline code spans, and URLs before character ratio analysis to reduce false positives from English identifiers in Chinese docs; also fixed regex `g` flag omission that caused `.match()` to return only 1 match per character class
- **Strategy auto-detection improved** (strategies/index.js): Explicit tie-breaking order (grpc > function > http) and zero-match fallback to http
- **Version aligned**: opensdd-check package.json bumped from 3.1.0 to 3.3.0 to match SKILL.md

### Fixed
- **config.js `mergeConfig` shallow copy bug**: Nested objects (e.g. `publicDesignRules`) are now deep-merged instead of replaced, preventing `allowedPatterns` loss when user overrides only `namingConvention`
- **.sddrc.json.example out of sync**: Removed "质量验收" section from `requiredAgentSections` (moved to SPEC.md in v3.2.0)

### Added
- **VERSION_CONSISTENCY check**: New opensdd-check check that validates SKILL.md `metadata.version` matches root `package.json` and `opensdd/opensdd-check/package.json`. Fails on mismatch, warns on missing package.json files. Supports both dot-notation and nested YAML frontmatter formats.
- **phase-1.md quality acceptance checklist item**: Explicit review entry for quantifiable acceptance criteria in SPEC.md
- **phase-1.md output validation step**: AI advised to run `opensdd-check` after generating SPEC.md
- **.lycheeignore**: Replaced blanket `--exclude 'https://github.com'` with targeted exclusion list in CI
- **Unit tests**: Added test-interface-consistency.js (4 tests) and test-language.js (11 tests) for independent coverage
- **config.js test**: Added nested object merge test case

## [3.2.0] - 2026-06-19

### Changed
- **Parallel design removed**: Phase 3 reverted to strictly serial per-module design (no parallel). Parallelism added little value and risked API rate limits
- **Quality acceptance moved to SPEC.md**: `config.js` required-agent-sections no longer expects quality criteria in AGENTS.md — now part of SPEC.md non-functional requirements
- **garbage.js severity**: Stale/backup file detection changed from warn to fail, matching the hard prohibition in SKILL.md
- **module-content.js**: Hardcoded section name arrays moved to `config.js` as `requiredInterfaceSections` and `requiredInternalsSections` for user configurability
- **Unknown config keys**: `loadConfig()` now warns on unknown `.sddrc.json` keys to catch typos

### Fixed
- **matrix.js orphan detection**: Orphan module scan now executes before the early-return-for-pass, ensuring orphan directories are always reported
- **reporter.js JSON _root**: JSON report `projectRoot` now correctly reflects user-specified `--path` instead of always falling back to `cwd`
- **interface-consistency.js endpoint extraction**: Now handles HTTP methods inside markdown table cells (previously only matched line-start)
- **test-matrix.js test data**: Updated stale `DESIGN.md` path references to `INTERFACE.md`
- **test-agents.js / test-smoke.js**: Removed quality acceptance section from test data to match current spec
- **phase-3.md typo**: "不予许" → "不允许"
- **SKILL.md prompt template**: Clarified serial-only constraint for Designer Agent startup prompt
- **SKILL.md change propagation**: Added `SKILL.md` version bump rule to change propagation protocol

### Added
- **CI workflow_dispatch**: Manual CI trigger now supported
- **Coverage script**: `npm run test:coverage` for native Node.js test coverage

### Infrastructure
- **ESLint + Prettier**: Code style enforcement in CI (unchanged from v3.1.0)
- **Test runner**: All tests consistently use `node:test` describe/it pattern

## [3.1.0] - 2026-06-19

### Changed
- **SKILL.md restructuring**: Split phase execution contracts into 5 independent files (phase-1.md ~ phase-4.md + finalization.md). SKILL.md now only contains overview, topology, role model, constraints, and references to phase files — eliminating significant redundancy
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
