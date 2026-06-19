# OpenSDD — Open Spec-Driven Documentation（编码前规范阶段工作流）

> **拒绝盲目盲写 (Vibe Coding)！** 在 AI 自主编码之前，先系统化地完成需求规格、架构设计、模块详细设计、任务计划的规范化产出。通过**四角色隔离**（PM / 架构师 / 模块设计师 / 项目经理）确保每个阶段 AI 只加载职责范围内的上下文，最终锁定 `AGENTS.md` 作为编码阶段的入口指引。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/zhgstudio/opensdd/actions/workflows/ci.yml/badge.svg)](https://github.com/zhgstudio/opensdd/actions/workflows/ci.yml)
[![skills.sh](https://skills.sh/b/zhgstudio/opensdd)](https://skills.sh/zhgstudio/ai-agent-4-n-sdd-skill/opensdd)

---

## 三大痛点

AI 自主编码时，最常见的三个问题：

| # | 问题 | 表现 |
|---|------|------|
| 1 | **注意力稀释** | 所有设计塞进一个文件，AI 越读越糊涂 |
| 2 | **自嗨式打勾** | 代码还没跑通，计划里已全部打勾 |
| 3 | **历史污染** | 旧文档残留导致 AI 新旧逻辑缝合 |

**OpenSDD 通过在编码前严格完成规范化文档生成，配合四角色上下文隔离，从根本上解决这些问题。**

---

## 核心目录拓扑

```text
docs/
├── SPEC.md                 # 👑 1. 需求规格（PM Agent）
├── ARCHITECTURE.md         # 🏛️ 2. 总体架构设计（Architect Agent）
├── PLAN.md                 # 📋 3. 任务计划（Project Manager Agent）
├── AGENTS.md               # 📖 4. 编码阶段入口指引（多阶段积累，人类锁定）
│
└── modules/                # 📦 N. 模块详细设计
    ├── 01-auth/
    │   └── DESIGN.md
    ├── 02-task-core/
    │   └── DESIGN.md
    └── ...
```

<details>
<summary><b>本仓库实际结构</b>（点击展开）</summary>

```
├── opensdd/
│   ├── SKILL.md              # 核心工作流 Skill（概览）
│   ├── phase-1.md            # 阶段一：需求规格（PM Agent）
│   ├── phase-2.md            # 阶段二：总体架构设计（Architect Agent）
│   ├── phase-3.md            # 阶段三：模块详细设计（Designer Agent）
│   ├── phase-4.md            # 阶段四：任务计划（Project Manager Agent）
│   └── finalization.md       # 最终定稿（人类）
├── tools/
│   └── sdd-check/            # OpenSDD 项目结构校验工具
│       ├── index.js
│       ├── lib/
│       └── checks/
├── README.md
├── README.zh.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── LICENSE
├── skills-lock.json
└── .github/
    └── workflows/ci.yml
```

</details>

---

## 四角色模型

| 角色 | 阶段 | 读取 | 写入 |
|------|------|------|------|
| **PM Agent**（产品经理） | 阶段一 | 无（新会话） | `SPEC.md`、追加 `AGENTS.md` 质量验收标准 |
| **Architect Agent**（架构师） | 阶段二 | `SPEC.md`（只读） | `ARCHITECTURE.md`、写入 `AGENTS.md` 主体 |
| **Designer Agent**（模块设计师）× N | 阶段三 | `ARCHITECTURE.md` + 被依赖模块的接口部分 | `docs/modules/{NN}-{name}/DESIGN.md` |
| **Project Manager Agent**（项目经理） | 阶段四 | 全部已定稿文档 | `PLAN.md`、追加 `AGENTS.md` 任务规范 |

每个角色启动新会话时只加载职责范围内的文件，每阶段末尾有人工评审门禁。

---

## 四阶段执行协议

```
阶段一 ───→ 阶段二 ───→ 阶段三 ───→ 阶段四 ───→ 人类最终审查
PM Agent    Architect   Designer     PM Agent     锁定全部文档
SPEC.md     ARCHITECTURE.md  模块 DESIGN   PLAN.md      AGENTS.md 就绪
             AGENTS.md   (逐个串行)   追加 AGENTS   进入编码阶段
```

### 阶段一：需求规格（PM Agent）

产出 `docs/SPEC.md`，覆盖业务背景、功能需求、数据需求、非功能性约束。同时在 `AGENTS.md` 中追加质量验收标准章节。

### 阶段二：总体架构设计（Architect Agent）

产出 `docs/ARCHITECTURE.md`，包含技术栈标准、全局编码规范、**模块引用表**（`NN-name` 编号格式）、模块依赖矩阵、公共设计。同时写入 `AGENTS.md` 主体（文件操作范围、提交规范、测试要求、升级条件、跨模块规则）。

**职责边界**：ARCHITECTURE.md 只写整体架构和公共设计，模块内部设计放在对应的 DESIGN.md 中。

### 阶段三：模块详细设计（Designer Agent）

产出 `docs/modules/{NN}-{name}/DESIGN.md`，包含模块边界、数据结构、接口定义、**F-{NNN} 功能特性列表**。按依赖顺序串行推进，一次只做一个模块。

### 阶段四：任务计划（Project Manager Agent）

产出 `docs/PLAN.md`，每个任务引用对应 DESIGN.md 的 F-{NNN} 章节（如 `[01-auth/DESIGN.md#F-001]`）。严格不涉及方案细节，只做任务跟踪。同时追加 `AGENTS.md` 的 PLAN.md 任务规范章节。

### 最终定稿（人类）

人类审查全部文档的一致性和完整性，锁定 `AGENTS.md` 作为编码阶段的入口文件。

---

## 变更传播

1. 修改源头文档（SPEC → ARCH → DESIGN → PLAN）
2. 级联更新引用关系，确保 `PLAN.md` 中的 `[NN-name/DESIGN.md#F-NNN]` 可追溯链完整
3. 跨模块接口变更须升级给人类仲裁

---

## 快速开始

### 1. 安装技能

```bash
# 推荐 — 自动识别兼容的 AI 平台
npx skills add https://github.com/zhgstudio/opensdd --skill opensdd

# 或手动克隆
git clone --depth 1 https://github.com/zhgstudio/opensdd.git /tmp/opensdd-skill
cp -r /tmp/opensdd-skill/opensdd .opencode/skills/
rm -rf /tmp/opensdd-skill
```

> **语言说明**：所有生成的文档（SPEC.md、ARCHITECTURE.md、AGENTS.md、PLAN.md 以及模块 DESIGN.md）均使用**中文**编写。

### 2. 唤醒你的 AI

```
请读取 .opencode/skills/opensdd/SKILL.md 和 .opencode/skills/opensdd/phase-1.md。
我的新项目是：[一句话描述]。
文档语言：[中文/English/...]。
请严格按照 Skill 规范启动阶段一，在 docs/SPEC.md 中生成需求规格初稿。
```

> **语言说明：** 在启动阶段一时指定文档语言，所有阶段将统一使用该语言生成文档。

### 3. 迭代推进

人工评审 → AI 完善 → 阶段定稿 → 下一阶段。

---

## 工具：sdd-check

校验项目是否严格遵循 OpenSDD 目录和格式规范：

```bash
node tools/sdd-check/index.js --path /path/to/project
```

5 项检查：

| 检查项 | 校验内容 |
|--------|----------|
| **FILE_EXISTS** | `SPEC.md`、`ARCHITECTURE.md`、`PLAN.md`、`AGENTS.md` 是否存在 |
| **PLAN_FORMAT** | 任务行格式是否符合规范并引用正确的 DESIGN.md 章节 |
| **DEP_MATRIX** | 依赖矩阵中声明的模块是否有对应的 `docs/modules/{NN}-{name}/DESIGN.md` |
| **NO_GARBAGE** | 是否混入 `_v2.md`、`_final.md` 等版本残留垃圾文件 |
| **AGENTS_SECTIONS** | AGENTS.md 中是否包含全部必要章节 |

`--json` 输出 JSON 供 CI 集成，`--strict` 将 Warning 视为 Error。

---

## 支持平台

| 平台 | 集成方式 |
|------|----------|
| OpenCode | `.opencode/skills/` |
| Claude Code | `.claude/skills/` |
| Cursor | `.cursorrules` |
| 任何 AI CLI | 直接加载 SKILL.md |

---

## 对比

| 维度 | 传统方式（Vibe Coding） | OpenSDD |
|------|------------------------|---------|
| 编码前阶段 | 无 | 4 阶段 4 角色 |
| 需求文档 | 模糊口述 | 完整的 SPEC.md |
| 设计文档 | 一个巨型文件 | 4+N 隔离文件 |
| 任务跟踪 | 无 / 自说自话 | 引用设计的可追溯任务 |
| 人工评审 | 最后一次性 | 每阶段关卡 |
| 上下文范围 | 一次性加载所有内容 | 按角色物理隔离 |

---

## 贡献

提交 Issue、PR 或建议！详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 开源协议

MIT © zhgstudio
