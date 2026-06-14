# 4+N SDD — AI 智能体的模块化规范驱动开发工作流

> **拒绝盲目盲写 (Vibe Coding)！** 专为 OpenCode、Claude Code、Cursor 设计的"4+N 总分拓扑"轻量级规范驱动开发 (SDD) 智能体技能。通过**四角色隔离**（PM / 架构师 / 模块设计师 / 开发者）确保每个阶段 AI 只加载职责范围内的上下文。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/zhgstudio/ai-agent-4-n-sdd-skill/actions/workflows/ci.yml/badge.svg)](https://github.com/zhgstudio/ai-agent-4-n-sdd-skill/actions/workflows/ci.yml)
[![skills.sh](https://skills.sh/b/zhgstudio/ai-agent-4-n-sdd-skill)](https://skills.sh/zhgstudio/ai-agent-4-n-sdd-skill/ai-agent-4-n-sdd)

---

## 三大痛点

AI 自主编码时，经常遇到三个死穴：

| # | 问题 | 表现 |
|---|------|------|
| 1 | **注意力稀释** | 所有设计塞进一个文件，AI 越读越糊涂 |
| 2 | **自嗨式打勾** | 代码还没跑通，任务计划里已经提前全部打勾 |
| 3 | **历史污染** | 多次评审的旧文档导致 AI 新旧逻辑严重缝合 |

**4+N SDD 通过"全局标准单文件"与"局部模块设计分目录"的物理隔离，配合四角色上下文权限分离，实现绝对降噪！**

---

## 4+N 总分拓扑

> *这是你在项目中使用 Skill 后生成的目录结构。本仓库仅包含 `SKILL.md`。*

```
├── docs/
│   ├── SPEC.md             # 👑 1. 总体需求规格 (WHAT)
│   ├── ARCHITECTURE.md     # 🏛️ 2. 总体架构设计 (HOW)
│   ├── PLAN.md             # 🏃 3. 总体执行计划
│   │
│   └── modules/            # 📦 N. 模块详细设计目录
│       ├── {module_a}/     # data-model.md, api.md
│       └── {module_b}/     # protocol.md, state.md
└── AGENTS.md               # 👑 4. 全局行为契约
```

<details>
<summary><b>本仓库实际结构</b>（点击展开）</summary>

```
├── ai-agent-4-n-sdd/
│   └── SKILL.md              # 核心工作流 Skill
├── tools/
│   └── sdd-check/            # SDD 项目结构校验工具
│       ├── index.js
│       ├── lib/
│       └── checks/
├── README.md
├── README.zh.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── LICENSE
└── .github/
    └── workflows/ci.yml
```

</details>

---

## 四角色模型

| 角色 | 阶段 | 读取 | 写入 |
|------|------|------|------|
| **PM Agent**（产品经理） | 阶段一 | 无（新会话） | SPEC.md |
| **Architect Agent**（架构师） | 阶段二 | SPEC.md（只读） | ARCHITECTURE.md, AGENTS.md |
| **Designer Agent**（模块设计师） | 阶段三 | ARCHITECTURE.md（依赖矩阵） | docs/modules/{模块}/ |
| **Developer Agent**（开发者） | Scaffolding → 阶段四~五 | AGENTS.md + 模块设计文件 | src/（代码 + 测试） |

每个角色启动新会话时只加载职责范围内的文件，从根本上杜绝角色混淆和上下文污染。

---

## 五阶段执行协议

```
─── Harness 工程阶段（人类主导 + AI 辅助，每阶段有人工评审）───
阶段一：需求定稿    → PM Agent 写 SPEC.md
阶段二：架构锁定    → Architect Agent 生成 ARCHITECTURE.md + AGENTS.md
阶段三：模块设计    → Designer Agent 逐模块深挖
       代码框架     → Developer Agent 搭建构建 + 测试框架
─── AI 自主编码阶段（AI 自主推进，无需人工干预）───
阶段四：任务分解    → Developer Agent 分解微型任务 PLAN.md
阶段五：TDD 编码    → 测试先行，绝不自嗨打勾
```

---

## 快速开始

### 1. 安装技能

```bash
# 推荐 — 自动识别兼容的 AI 平台
npx skills add https://github.com/zhgstudio/ai-agent-4-n-sdd-skill --skill ai-agent-4-n-sdd

# 或手动克隆
git clone --depth 1 https://github.com/zhgstudio/ai-agent-4-n-sdd-skill.git /tmp/sdd-skill
cp -r /tmp/sdd-skill/ai-agent-4-n-sdd .opencode/skills/
rm -rf /tmp/sdd-skill
```

### 2. 唤醒你的 AI

```
请读取 .opencode/skills/ai-agent-4-n-sdd/SKILL.md。
我的新项目是：[一句话描述]。
请严格按照 Skill 规范启动阶段一，在 docs/SPEC.md 中生成需求初稿。
```

### 3. 迭代开发

人工评审 → AI 实现 → 测试通过 → Git 提交 → 下一阶段。

---

## 工具：sdd-check

校验项目是否严格遵循 4+N SDD 目录和格式规范：

```bash
node tools/sdd-check/index.js --path /path/to/project
```

5 项自动检查：

| 检查项 | 校验内容 |
|--------|---------|
| **FILE_EXISTS** | `SPEC.md`、`ARCHITECTURE.md`、`PLAN.md`、`AGENTS.md` 是否存在 |
| **PLAN_FORMAT** | 任务行格式是否符合 `- [ ] T###: description` 规范 |
| **DEP_MATRIX** | 依赖矩阵中声明的模块是否有对应的 `docs/modules/{name}/` 目录 |
| **NO_GARBAGE** | 是否混入了 `_v2.md`、`_final.md` 等版本残留垃圾文件 |
| **AGENTS_SECTIONS** | `AGENTS.md` 中是否包含全部 5 个必要章节 |

`--json` 可输出 JSON 供 CI 集成，`--strict` 将 Warning 视为 Error。

---

## 对比：SDD vs 传统 AI 编码

| 维度 | 传统方式 (Vibe Coding) | 4+N SDD |
|------|------------------------|---------|
| 上下文大小 | 无限膨胀 | 物理隔离控制 |
| 任务进度 | 自说自话 | 测试验证 |
| 设计文档 | 一个巨型文件 | 4+N 隔离文件 |
| 人工评审 | 最后一次性评审 | 每阶段关卡 |
| 角色分离 | 无（一个 Agent 干所有事） | 4 个独立角色 |
| 历史管理 | `_v2.md` 垃圾文件 | Git 物理覆盖 |

---

## 支持平台

| 平台 | 集成方式 |
|------|---------|
| OpenCode | `.opencode/skills/` |
| Claude Code | `.claude/skills/` |
| Cursor | `.cursorrules` |
| 任何 AI CLI | 直接加载 SKILL.md |

---

## 贡献

提交 Issue、PR 或建议！详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 开源协议

MIT © zhgstudio
