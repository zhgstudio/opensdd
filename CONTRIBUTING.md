# Contributing to OpenSDD

Thanks for your interest! Here's how to contribute.

## Code of Conduct

This project follows [GitHub Community Guidelines](https://docs.github.com/en/site-policy/github-terms/github-community-guidelines).
Be respectful — we're all here to make AI-assisted development better.

## How to Contribute

1. **Browse existing issues** — check [open issues](https://github.com/zhgstudio/opensdd/issues) before creating new ones
2. **Fork** the repo and create a branch from `main`
3. **Make changes** — improve docs, fix issues, enhance the skill or tooling
4. **Test your changes**:
   - `npm test` — run the full test suite
   - `npm run lint` — ESLint enforcement
   - `npm run format-check` — Prettier formatting check
5. **Commit** with clear messages following [Conventional Commits](https://www.conventionalcommits.org/)
6. **Open a PR** using the [pull request template](.github/PULL_REQUEST_TEMPLATE.md)

## Development Setup

```bash
git clone https://github.com/zhgstudio/opensdd.git
cd opensdd
npm install
npm --prefix opensdd/opensdd-check install
```

The project has two `package.json` files:
- Root (`./package.json`) — project-level scripts that delegate to `opensdd-check`
- `opensdd/opensdd-check/package.json` — the checker tool itself. Zero runtime dependencies; devDependencies (ESLint, Prettier) are needed for lint/format checks only

Run tests from root: `npm test`

## What Needs Help

- **Documentation** — examples, translations, clearer explanations
- **Bug fixes** — broken links, typos, edge cases in the workflow
- **Methodology** — new module types, better patterns
- **Tooling** — opensdd-check improvements, new checks
- **Community** — helping others in issues and discussions

## Review Process

Maintainers will review PRs within a few days. Feedback is constructive.
