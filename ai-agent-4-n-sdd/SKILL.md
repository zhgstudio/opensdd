---
name: ai-agent-4-n-sdd
description: "4+N Topology SDD Workflow: A lightweight spec-driven development workflow for AI coding agents. Prevents attention dilution, fake progress checkmarks, and historical context pollution through physical context isolation between global specs and module-level designs."
metadata:
  author: zhgstudio
  version: 1.1.0
---

# 4+N Topology SDD Workflow (Modular Spec-Driven Development)

## 👤 技能概述
本技能用于指导和约束 AI 智能体严格遵循人类与 AI 协同的"4+N 总分拓扑"轻量级规范驱动开发流程。其核心逻辑是通过"全局宏观标准单文件"与"局部模块设计分目录"的物理隔离，实现上下文绝对降噪，支持复杂多模块系统的高质量、自主测试驱动开发（TDD）。

---

## 📂 核心事实来源拓扑 (Context Topology)
全生命周期严格保持以下目录组织结构，新版直接物理覆盖旧版，依赖 Git 进行原子化版本控制：

```text
├── docs/
│   ├── SPEC.md             # 👑 1. 总体需求规格 (WHAT)：全局业务边界、用户核心旅程。
│   ├── ARCHITECTURE.md     # 🏛️ 2. 总体架构设计 (HOW)：全局技术栈、命名风格、模块依赖矩阵。
│   ├── PLAN.md             # 🏃‍♂️ 3. 总体执行计划：大里程碑进度跟踪，高层级划勾。
│   │
│   └── modules/            # 📦 N. 模块详细设计目录（按领域限界进行物理隔离）
│       ├── {module_a}/     # 示例：数据库/API型模块
│       │   ├── data-model.md # 💾 概念模型（实体、字段、关系、索引说明，不含 DDL）
│       │   └── api.md      # 🔌 HTTP/gRPC 接口与输入输出 Struct 契约
│       │
│       └── {module_b}/     # 示例：通信/网关型模块
│           ├── protocol.md # 📡 报文结构、自定义通信协议、心跳机制
│           └── state.md    # 🔄 生命周期状态机图解
├── src/
│   └── db/migrations/      # 🗄️ 实际 DDL/DML（由 AI 在阶段五生成）
└── AGENTS.md               # 👑 4. 全局行为智能体契约（在阶段二自动生成）
```

### AGENTS.md 定义
AGENTS.md 是智能体的行为契约，在阶段二与 ARCHITECTURE.md 同步生成。必须包含：
- **文件操作范围**：AI 可读/可写的目录白名单
- **提交规范**：Commit 消息格式（如 `feat(module): T001 description`）
- **测试要求**：最小测试覆盖率、必须通过的测试范围
- **升级条件**：什么情况下必须暂停并请求人类介入
- **跨模块规则**：允许读取的模块接口文件列表（见模块依赖解析）

---

## 🏃‍♂️ 阶段化执行契约 (Execution Protocol)

智能体必须根据用户当前所处的阶段，严格执行以下指令。**在进入下一阶段前，必须明确提醒人类进行人工评审。**

### 阶段一：全局需求定稿 (Global Requirement)
- **输入**：人类口述的原始大白话想法。
- **智能体行为**：
  1. 在 `docs/SPEC.md` 中生成全局需求初稿。
  2. **当用户重开新会话评审时**：站在评委角度审视 `SPEC.md` 的业务漏洞，提出完善建议。
  3. 每次修改物理覆盖原文件。
- **晋级条件**：人类人工评审，明确回复"SPEC.md 定稿"，并提交 Git。

### 阶段二：总体架构锁定 (Global Architecture)
- **输入**：定稿的 `docs/SPEC.md`。
- **智能体行为**：
  1. 以 SPEC.md 为唯一上下文，生成 `docs/ARCHITECTURE.md`。
  2. 明确定义：全系统的技术栈标准、模块切分大盘、全局命名风格（如 camelCase）、统一错误返回格式（Error Envelope）。
  3. **生成模块依赖矩阵**：在 ARCHITECTURE.md 中以表格形式描述模块间依赖关系：

     ```markdown
     ## 模块依赖矩阵
     | 模块 | 依赖 | 所需接口 |
     |------|------|---------|
     | api-gateway | auth-core | POST /auth/verify |
     | task-core | data-store | tasks 表 CRUD |
     ```

  4. **同步生成 AGENTS.md**：包含智能体的文件操作范围、提交规范、测试要求、升级条件。
  5. 严禁在此文件中包含任何具体模块的 API 细节或表结构。
- **晋级条件**：人类快速扫视通过，明确回复"ARCHITECTURE.md 定稿"，并提交 Git。

### 阶段三：模块级详细设计演进 (Modular Deep-Dive)
- **输入**：定稿的 `SPEC.md` 和 `ARCHITECTURE.md`。
- **智能体行为**：
  1. **按需分治**：严禁创建巨型统一接口文件。必须在 `docs/modules/` 下为当前要开发的业务域创建独立的子目录。
  2. **特质匹配**：根据该模块的实际技术特性，全自动生成高密度设计文件：
     - 若属于数据存储模块，生成 `data-model.md`（概念模型，含实体、字段、关系、索引说明，不含 DDL）；
     - 若属于通信/网关模块，生成 `protocol.md` 或状态机文件；
     - 若属于纯算法/批处理模块，生成 `pipeline.md` 逻辑流程。
     - 实际 DDL 由 AI 在阶段五生成到 `src/db/migrations/`。
  3. **标准继承**：所有模块内的字段命名和异常处理必须 100% 继承 `docs/ARCHITECTURE.md` 的规范。
- **晋级条件**：人类对该独立模块的设计文件进行微型卡点评审（Micro-gatekeeping），明确回复"{模块名}设计定稿"，并提交 Git。

### 阶段三补充：跨模块依赖解析

当模块 A 依赖 ARCHITECTURE.md 中声明的模块 B 时：

1. AI 在开发模块 A 之前，**只允许读取** ARCHITECTURE.md 中的依赖矩阵 + 模块 B 的接口文件（`api.md`/`protocol.md`）
2. **严禁读取**模块 B 的以下文件：内部设计文件（`data-model.md`、`state.md`）、源码、测试
3. 若模块 B 尚未开始开发，AI 应推迟开发模块 A，或基于模块 B 的接口契约先行编写桩代码
4. 依赖关系必须在阶段二锁定，不允许在编码过程中"顺便看看"其他模块

### 阶段四：微型任务分解 (Micro-Planning)
- **输入**：上述所有已定稿的宏观与局部文档。
- **智能体行为**：
  1. 将模块设计分解为原子任务，粒度标准：**单个任务应可在 2-5 分钟内由 AI 完成**
  2. 在 `docs/PLAN.md` 中生成该模块的微型执行计划。每个任务包含：
     - `[ ]` 未完成 / `[x]` 已完成 / `[~]` 因变更需重做
     - 任务 ID（如 `[T001]`）
     - 依赖前置任务 ID（如 `depends: T001`）
     - 涉及文件路径
  3. 任务排序：按依赖关系拓扑排序，无依赖的先做
  4. 按模块分组，不同模块的任务不混排
- **晋级条件**：无需人类过度评审，直接进入自主编码。

### 阶段五：测试驱动与自主开发 (TDD & Autonomous Coding)
- **输入**：上述 4+N 文档体系，以及根目录 `AGENTS.md`。
- **智能体行为**：
  1. **测试先行**：调用测试工具（Vitest、pytest、Playwright 等），首先根据该模块的 `api.md`/`protocol.md` 把自动化测试用例和断言写出来。
  2. **上下文隔离**：在此阶段编码时，智能体的上下文**只能加载** 4 个全局文件和**当前正在开发的局部模块子目录**，严禁扫描其他模块目录。如需了解被依赖模块的接口，只能读取其 `api.md`/`protocol.md`。
  3. **严格禁止自嗨打勾**：只有当自动化测试命令**实际运行全部绿灯通过**后，智能体才允许将 `PLAN.md` 中对应任务的 `[ ]` 改为 `[x]`。
  4. **测试失败恢复协议**：当测试失败时，按以下循环执行：
     - **诊断**：AI 分析失败原因（实现错误 / 测试错误 / 设计歧义）
     - **修复**：根据诊断结果修复代码或测试
     - **重测**：重新运行全部测试
     - **升级**：如果连续 3 次修复后仍未通过，**暂停并升级给人类**，AI 附上诊断报告
     - 修复过程中不允许将 `[ ]` 改为 `[x]`
  5. **原子提交**：在 Git Commit 消息中必须注明完成的任务 ID（例如：`feat(auth): implement T001 and pass verification`）。

### 阶段五补充：集成验证 (Integration)
- **触发条件**：所有模块的阶段五全部完成。
- **智能体行为**：
  1. 构建完整系统并运行跨模块测试。
  2. 集成依据仅来源于各模块的 `api.md`/`protocol.md`。
  3. 测试失败时，定位到具体模块并打回阶段五重新修复。
- **晋级条件**：跨模块测试全部通过。

---

## 🔄 需求变更处理协议 (Change Propagation)

当需求或设计需要修改时，遵循以下协议：

### 步骤
1. **标记影响范围**：AI 评估哪些模块受 SPEC 变更影响
2. **保存旧状态**：`git branch snapshot/{module}-v{n}`（或 `git tag`）保存当前状态快照
3. **在 main 上直接修改**：更新 SPEC.md → 更新 ARCHITECTURE.md（依赖矩阵如有变动同步更新）
4. **重新走阶段三~五**：仅重新设计、实现受影响的模块（不受影响的模块维持不动）
5. **标记任务状态**：受影响的 PLAN.md 任务标记为 `[~]`，已有测试需重新运行确认

### 原则
- main 分支始终是唯一活跃主线，不建新分支开发新功能
- 旧状态仅通过 snapshot 分支/标签保留，永不合并回 main
- 不变的部分不动——只重新验证受影响模块，避免全量回归

---

## 🚨 智能体核心禁令 (Strict Constraints)
- **禁止创建过渡垃圾文件**：严禁自行创建带有版本号的临时文件（如 `SPEC_v2.md`），一律使用物理覆盖。
- **禁止跨模块注意力污染**：在开发特定模块代码时，禁止读取其他无关模块的子目录或源码。仅允许读取 ARCHITECTURE.md 依赖矩阵中声明的被依赖模块的接口文件。
- **禁止无测试划勾**：未能在控制台实际运行并成功通过断言的代码，绝对不允许在 `PLAN.md` 中标记为完成。
- **禁止私定依赖**：模块间依赖关系必须在阶段二的依赖矩阵中声明，不允许在编码过程中临时引入未声明的跨模块调用。
