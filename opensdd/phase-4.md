# 阶段四：任务计划（Project Manager Agent）

## 角色

项目经理（Project Manager Agent）

## 上下文

全部已定稿文档（`SPEC.md`、`ARCHITECTURE.md`、各模块 `API.md` / `DESIGN.md`、`AGENTS.md`）

## 输入

所有已定稿的设计文档

## 输出

- `docs/PLAN.md`
- 追加 `AGENTS.md`

## 行为

1. 阅读所有已定稿的 `API.md` 和 `DESIGN.md`，提取每个模块中的 {NN}-F{NNN} 特性列表
2. 在 `docs/PLAN.md` 中生成**任务跟踪表**。每个任务须包含：
   - `[ ]` 未完成 / `[x]` 已完成
    - 任务 ID（`T-{NNN}`）
    - 任务描述（简述，**不涉及方案细节**——方案细节在 DESIGN.md 中）
    - **引用到 DESIGN.md 的具体章节**（格式：`[01-auth/DESIGN.md#01-F001]`）
    - 依赖关系（如有），使用 `depends: T-{NNN}` 语法，多依赖以逗号分隔：`depends: T-001, T-002`

    格式示例：
    ```markdown
    ## 模块：01-auth
- [ ] T-001: 实现用户注册接口 [01-auth/DESIGN.md#01-F001]
- [ ] T-002: 实现用户登录接口 [01-auth/DESIGN.md#01-F002] depends: T-001
- [ ] T-003: 实现用户注销接口 [01-auth/DESIGN.md#01-F003] depends: T-001, T-002
    ```

3. **不涉及方案细节**——`PLAN.md` 是纯粹的任务跟踪，不写如何实现、不写技术细节
4. 按模块分组，同一个模块的任务连续排列
5. **一致性检查**：在生成 `PLAN.md` 之前，执行以下完整性验证：
   - 跨模块接口匹配：检查所有模块的 `API.md` 中，所依赖方提供的接口与依赖方调用的接口是否签名一致
   - 功能覆盖检查：确认每个模块的接口定义与 `ARCHITECTURE.md` 模块引用表中的描述无矛盾
   - 公共设计合规：检查各模块的命名风格和设计规范是否遵循 `ARCHITECTURE.md` 中定义的全局编码规范和公共设计（可使用 `node tools/opensdd-check/index.js` 中的 `PUBLIC_DESIGN_COMPLIANCE` 检查自动验证）
   - 如果发现不一致，**暂停并升级给人类**，说明矛盾的具体位置和内容，等待人类决策后再继续
6. 任务按依赖关系拓扑排序
7. **追加 `AGENTS.md`**：在 `AGENTS.md` 末尾追加"PLAN.md 任务规范"章节，说明 `PLAN.md` 的格式、任务标记规则、引用约定。注意：`AGENTS.md` 的内容面向编码阶段的开发者，`AGENTS.md` 中追加的所有规范都服务于编码阶段，不用于 OpenSDD 阶段自身。

## 审查清单

人类评审 PLAN.md 时建议逐项核对以下清单：

- [ ] **任务全量覆盖**：所有模块 DESIGN.md 中的 `{NN}-F{NNN}` 特性是否都有对应 `T-{NNN}` 任务
- [ ] **任务引用**：每条任务是否都引用了对应的 `[NN-name/DESIGN.md#{NN}-F{NNN}]`
- [ ] **任务不包含方案**：任务描述是否只说明做什么，不涉及怎么做
- [ ] **依赖拓扑**：任务是否按依赖关系排序，所依赖任务在前
- [ ] **模块分组**：同一模块的任务是否连续排列
- [ ] **AGENTS.md 追加**：是否已追加"PLAN.md 任务规范"章节
- [ ] **格式正确**：所有任务行符合 `- [ ] T-{NNN}: 描述 [ref]` 格式

## 晋级条件

人类明确回复"PLAN.md 定稿"，并提交 Git
