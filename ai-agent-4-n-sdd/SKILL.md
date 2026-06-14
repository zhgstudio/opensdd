---
name: ai-agent-4-n-sdd
description: "4+N Topology SDD Workflow: A lightweight spec-driven development workflow for AI coding agents. Prevents attention dilution, fake progress checkmarks, and historical context pollution through physical context isolation between global specs and module-level designs."
metadata:
  author: zhgstudio
  version: 1.0.0
---

# 4+N Topology SDD Workflow (Modular Spec-Driven Development)

## 👤 技能概述
本技能用于指导和约束 AI 智能体严格遵循人类与 AI 协同的“4+N 总分拓扑”轻量级规范驱动开发流程。其核心逻辑是通过“全局宏观标准单文件”与“局部模块设计分目录”的物理隔离，实现上下文绝对降噪，支持复杂多模块系统的高质量、自主测试驱动开发（TDD）。

---

## 📂 核心事实来源拓扑 (Context Topology)
全生命周期严格保持以下目录组织结构，新版直接物理覆盖旧版，依赖 Git 进行原子化版本控制：

```text
├── docs/
│   ├── SPEC.md             # 👑 1. 总体需求规格 (WHAT)：全局业务边界、用户核心旅程。
│   ├── ARCHITECTURE.md     # 🏛️ 2. 总体架构设计 (HOW)：全局技术栈、命名风格、公共错误码。
│   ├── PLAN.md             # 🏃‍♂️ 3. 总体执行计划：大里程碑进度跟踪，高层级划勾。
│   │
│   └── modules/            # 📦 N. 模块详细设计目录（按领域限界进行物理隔离）
│       ├── {module_a}/     # 示例：数据库/API型模块
│       │   ├── schema.sql  # 💾 纯粹的数据库表定义 DDL
│       │   └── api.md      # 🔌 HTTP/gRPC 接口与输入输出 Struct 契约
│       │
│       └── {module_b}/     # 示例：通信/网关型模块
│           ├── protocol.md # 📡 报文结构、自定义通信协议、心跳机制
│           └── state.md    # 🔄 生命周期状态机图解
├── src/                    # 业务源码
└── AGENTS.md               # 👑 4. 全局行为智能体契约（通过 /init 生成）
```

---

## 🏃‍♂️ 阶段化执行契约 (Execution Protocol)

智能体必须根据用户当前所处的阶段，严格执行以下指令。**在进入下一阶段前，必须明确提醒人类进行人工评审。**

### 阶段一：全局需求定稿 (Global Requirement)
- **输入**：人类口述的原始大白话想法。
- **智能体行为**：
  1. 在 `docs/SPEC.md` 中生成全局需求初稿。
  2. **当用户重开新会话评审时**：站在评委角度审视 `SPEC.md` 的业务漏洞，提出完善建议。
  3. 每次修改物理覆盖原文件。
- **晋级条件**：人类人工评审，明确回复“SPEC.md 定稿”，并提交 Git。

### 阶段二：总体架构锁定 (Global Architecture)
- **输入**：定稿的 `docs/SPEC.md`。
- **智能体行为**：
  1. 开启全新干净会话。根据需求全自动衍生出 `docs/ARCHITECTURE.md`。
  2. 明确定义：全系统的技术栈标准、模块切分大盘、全局命名风格（如 camelCase）、统一错误返回格式（Error Envelope）。
  3. 严禁在此文件中包含任何具体模块的 API 细节或表结构。
- **晋级条件**：人类快速扫视通过，明确回复“ARCHITECTURE.md 定稿”，并提交 Git。

### 阶段三：模块级详细设计演进 (Modular Deep-Dive)
- **输入**：定稿的 `SPEC.md` 和 `ARCHITECTURE.md`。
- **智能体行为**：
  1. **按需分治**：严禁创建巨型统一接口文件。必须在 `docs/modules/` 下为当前要开发的业务域创建独立的子目录。
  2. **特质匹配**：根据该模块的实际技术特性，全自动生成高密度设计文件：
     - 若属于数据存储模块，生成 `schema.sql`；
     - 若属于通信/网关模块，生成 `protocol.md` 或状态机文件；
     - 若属于纯算法/批处理模块，生成 `pipeline.md` 逻辑流程。
  3. **标准继承**：所有模块内的字段命名和异常处理必须 100% 继承 `docs/ARCHITECTURE.md` 的规范。
- **晋级条件**：人类对该独立模块的设计文件进行微型卡点评审（Micro-gatekeeping），明确回复“{模块名}设计定稿”，并提交 Git。

### 阶段四：微型任务分解 (Micro-Planning)
- **输入**：上述所有已定稿的宏观与局部文档。
- **智能体行为**：
  1. 结合 AI 平台的任务编排能力，在 `docs/PLAN.md` 中更新或生成该模块的微型执行计划。
  2. 每个任务必须包含 `[ ]` 标记、原子任务 ID（如 `[T001]`）以及核心功能星号（如 `*`）。
- **晋级条件**：无需人类过度评审，直接进入自主编码。

### 阶段五：测试驱动与自主开发 (TDD & Autonomous Coding)
- **输入**：上述 4+N 文档体系，以及根目录 `AGENTS.md`。
- **智能体行为**：
  1. **测试先行**：调用测试工具（Playwright、Vitest、pytest 等），首先根据该模块的 `api.md`/`protocol.md` 把自动化测试用例和断言写出来。
  2. **上下文隔离**：在此阶段编码时，智能体的上下文**只能加载** 4 个全局文件和**当前正在开发的局部模块子目录**，严禁扫描其他模块目录，实现 100% 降噪。
  3. **严格禁止自嗨打勾**：只有当自动化测试命令**实际运行全部绿灯通过**后，智能体才允许将 `PLAN.md` 中对应任务的 `[ ]` 改为 `[x]`。
  4. **原子提交**：在 Git Commit 消息中必须注明完成的任务 ID（例如：`feat(auth): implement T001 and pass verification`）。

---

## 🚨 智能体核心禁令 (Strict Constraints)
- **禁止创建过渡垃圾文件**：严禁自行创建带有版本号的临时文件（如 `SPEC_v2.md`），一律使用物理覆盖。
- **禁止跨模块注意力污染**：在开发特定模块代码时，禁止读取其他无关模块的子目录，防止大模型产生跨业务缝合的幻觉。
- **禁止无测试划勾**：未能在控制台实际运行并成功通过断言的代码，绝对不允许在 `PLAN.md` 中标记为完成。
