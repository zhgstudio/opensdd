# ⚡ ai-agent-4-n-sdd-skill

> **拒绝盲目盲写 (Vibe Coding)！** 专为 OpenCode、Claude Code、Cursor 设计的“4+N 总分拓扑”轻量级规范驱动开发 (SDD) 智能体技能。

[![GitHub license](https://shields.io)](https://github.com)
[![GitHub stars](https://shields.io)](https://github.com)

## 🎯 核心痛点
大模型在自主编码时，经常遇到三大死穴：
1. **长文本注意力稀释**：把所有设计塞进一个文件，AI 越读越糊涂。
2. **自嗨式打勾**：代码还没跑通，任务计划里已经提前全部假装完成。
3. **历史污染**：多次评审产生的旧文档导致 AI 新旧逻辑严重缝合。

本 Skill 通过**全局标准单文件**与**局部模块设计分目录**的物理隔离，实现上下文绝对降噪！

---

## 📂 4+N 总分拓扑结构 (Context Topology)

```text
├── docs/
│   ├── SPEC.md             # 👑 1. 总体需求规格 (WHAT)：人类最终评审
│   ├── ARCHITECTURE.md     # 🏛️ 2. 总体架构设计 (HOW)：AI 全自动衍生
│   ├── PLAN.md             # 🏃‍♂️ 3. 总体执行计划：AI 纯自动化划勾消费
│   │
│   └── modules/            # 📦 N. 模块详细设计目录（按特性物理隔离）
│       ├── {module_a}/     # 数据库/API型模块 -> 存放 schema.sql, api.md
│       └── {module_b}/     # 通信/网关型模块 -> 存放 protocol.md, state.md
└── AGENTS.md               # 👑 4. 全局行为契约（流量交警）
```

---

## 🚀 快速开始 (Quick Start)

### 1. 下载并安装技能
在你的项目根目录下执行以下命令，将 Skill 固化到你的智能体环境中：
```bash
mkdir -p .opencode/skills/
curl -o .opencode/skills/sdd-workflow.md https://githubusercontent.com
```

### 2. 唤醒你的 AI 研发总监
开启一个全新的 OpenCode 会话，敲入第一道指令：
> “请读取 `.opencode/skills/sdd-workflow.md`。我的新项目原始想法是：`[写你的一句话大白话]`。请严格按照 Skill 规范，为我启动**阶段一**，在 `docs/SPEC.md` 中生成需求初稿。”

---

## 🚨 智能体硬性禁令
- **零过渡垃圾**：一律使用 Git 物理覆盖，严禁生成 `SPEC_v2.md` 等垃圾文件。
- **降噪路由**：开发特定模块时，智能体只能读取对应子目录，严禁跨模块扫描。
- **测试先行**：未通过 Playwright 或单测自动化校验的代码，绝不允许在 `PLAN.md` 中划勾！

## 📄 开源协议
本项目采用 [MIT](LICENSE) 协议开源。
