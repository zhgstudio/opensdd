# 4+N SDD — AI 智能体的模块化规范驱动开发工作流

> **拒绝盲目盲写 (Vibe Coding)！** 专为 OpenCode、Claude Code、Cursor 设计的"4+N 总分拓扑"轻量级规范驱动开发 (SDD) 智能体技能。

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

**4+N SDD 通过"全局标准单文件"与"局部模块设计分目录"的物理隔离，实现上下文绝对降噪！**

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
│       ├── {module_a}/     # schema.sql, api.md
│       └── {module_b}/     # protocol.md, state.md
└── AGENTS.md               # 👑 4. 全局行为契约
```

<details>
<summary><b>本仓库实际结构</b>（点击展开）</summary>

```
├── ai-agent-4-n-sdd/
│   └── SKILL.md              # 核心工作流 Skill
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

## 五阶段执行协议

```
阶段一：需求定稿    → 人类写 SPEC.md
阶段二：架构锁定    → AI 自动衍生 ARCHITECTURE.md
阶段三：模块设计    → 按领域隔离，逐模块深挖
阶段四：任务分解    → 微型任务列表 PLAN.md
阶段五：TDD 编码    → 测试先行，绝不自嗨打勾
```

每阶段结束都有 **人工评审关卡**，通过后才能进入下一阶段。

---

## 快速开始

### 1. 安装技能

```bash
# 推荐：通过 skills CLI 安装（自动识别兼容的 AI 平台）
npx skills add https://github.com/zhgstudio/ai-agent-4-n-sdd-skill --skill ai-agent-4-n-sdd

# 或手动克隆
git clone --depth 1 https://github.com/zhgstudio/ai-agent-4-n-sdd-skill.git /tmp/sdd-skill
cp -r /tmp/sdd-skill/ai-agent-4-n-sdd .opencode/skills/
rm -rf /tmp/sdd-skill
```

或直接下载解压（无需 git）：

```bash
# Linux / macOS
mkdir -p .opencode/skills/
curl -sL https://github.com/zhgstudio/ai-agent-4-n-sdd-skill/archive/main.tar.gz | tar -xz --strip=2 -C .opencode/skills/ ai-agent-4-n-sdd-skill-main/ai-agent-4-n-sdd

# Windows PowerShell
mkdir .opencode\skills\ -Force
curl -L https://github.com/zhgstudio/ai-agent-4-n-sdd-skill/archive/main.tar.gz -o $env:TEMP\sdd.tar.gz
tar -xzf $env:TEMP\sdd.tar.gz -C .opencode\skills\ --strip-components 2 ai-agent-4-n-sdd-skill-main/ai-agent-4-n-sdd
Remove-Item $env:TEMP\sdd.tar.gz
```

### 2. 唤醒你的 AI

```
"请读取 .opencode/skills/ai-agent-4-n-sdd/SKILL.md。我的新项目是：[一句话描述]。
请严格按照 Skill 规范启动阶段一，在 docs/SPEC.md 中生成需求初稿。"
```

### 3. 迭代开发

人工评审 → AI 实现 → 测试通过 → Git 提交 → 下一阶段。

---

## 对比：SDD vs 传统 AI 编码

| 维度 | 传统方式 (Vibe Coding) | 4+N SDD |
|------|------------------------|---------|
| 上下文大小 | 无限膨胀 | 物理隔离控制 |
| 任务进度 | 自说自话 | 测试验证 |
| 设计文档 | 一个巨型文件 | 4+N 隔离文件 |
| 人工评审 | 最后一次性评审 | 每阶段关卡 |
| 历史管理 | `_v2.md` 垃圾文件 | Git 物理覆盖 |
| 模块隔离 | 无 | 目录级别 |

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

---

## 开源协议

MIT © zhgstudio
