# OpenSDD 技能开发 — AI 智能体入口指引

本文档面向**修改 opensdd 技能本身**的 AI 智能体（而非使用该技能的下游项目）。在提出修改或新增功能前，请先阅读以下已决澄清，避免提出已被讨论确认的设计变更。

---

## 决策记录

本项目的全部决策记录（已采纳、已拒绝、遗留暂不处理）统一保存在 `docs/DECISIONS.md`。**该文件仅在审查/审视/评审过程加载**——在开始审查前请先阅读以了解已知决策，避免重复提出已被讨论确认的设计变更。其他阶段（设计、编码等）不需要加载。

---

## 开发约束

### opensdd-check 零依赖约束

`opensdd/opensdd-check/` 是终端用户的随行校验工具，**必须保持零运行时依赖**（`dependencies: {}`，`require` 仅限 Node.js 内置模块）。此约束是为了确保下游用户拷贝 `opensdd/` 目录后即拷即用，无需安装任何包。

**禁止行为**：
- 在 `checks/`、`lib/`、`index.js` 中引入 `require()` 引用非 Node.js 内置模块
- 在 `package.json` 的 `dependencies` 中添加任何条目
- 使用 `npm install --save` 或 `npm install --save-dev` 自动修改 `package.json`

**例外**：
- Node.js 内置模块（`fs`、`path`、`os`、`assert`、`node:test` 等）不受限
- `devDependencies` 中的 ESLint、Prettier 等开发工具不受限（仅开发环境使用，不随工具分发）
- 确需引入外部依赖时，必须升级给人类（在 AGENTS.md 或 issue 中说明理由），由人类决策是否打破零依赖原则
