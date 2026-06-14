# Changelog

All notable changes to the 4+N SDD Skill will be documented here.

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
