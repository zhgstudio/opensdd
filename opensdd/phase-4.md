# 阶段四：任务计划（Project Manager Agent）

## 角色

项目经理（Project Manager Agent）

## 上下文

全部已定稿文档（`SPEC.md`、`ARCHITECTURE.md`、各模块 `API.md` / `DESIGN.md`）。`AGENTS.md` 加载规则见 SKILL.md「角色职责边界」章节。

## 输入

所有已定稿的设计文档

## 输出

- `docs/PLAN.md`
- 追加 `AGENTS.md`

## 行为

1. 阅读所有已定稿的 `API.md` 和 `DESIGN.md`，提取每个模块中的 {MODULE}-F{NNN} 特性列表
2. **会话管理**：对于模块数量较多的项目，建议使用 sub-agent 隔离每个模块的任务规划——PM Agent 主会话负责跨模块一致性校验和最终整合，每个模块的任务拆分由独立的 sub-agent 会话完成，避免单会话中加载全部模块设计的认知负载过高
3. 在 `docs/PLAN.md` 中生成**任务跟踪表**。每个任务须包含：
   - `[ ]` 未完成 / `[x]` 已完成
    - 任务 ID（`T-{MODULE}-{NNN}`，MODULE 为模块目录名去除数字前缀后的大写形式）
    - 任务描述（简述，**不涉及方案细节**——方案细节在 DESIGN.md 中）
    - **引用到 DESIGN.md 的具体章节**（格式：`[module-name/DESIGN.md#{MODULE}-F{NNN}]`）
    - 依赖关系（如有），使用 `depends: T-{MODULE}-{NNN}` 语法，多依赖以逗号分隔：`depends: T-AUTH-001, T-AUTH-005`

    格式示例：
    ```markdown
    ## 模块：01-auth
- [ ] T-AUTH-001: 实现用户注册接口 [auth/DESIGN.md#AUTH-F001]
- [ ] T-AUTH-005: 实现用户登录接口 [auth/DESIGN.md#AUTH-F005] depends: T-AUTH-001
- [ ] T-AUTH-010: 实现用户注销接口 [auth/DESIGN.md#AUTH-F010] depends: T-AUTH-001, T-AUTH-005
    ```

4. **不涉及方案细节**——`PLAN.md` 是纯粹的任务跟踪，不写如何实现、不写技术细节
5. 按模块分组，同一个模块的任务连续排列
6. **一致性检查**：在生成 `PLAN.md` 之前，执行以下完整性验证：
   - 跨模块接口匹配：检查所有模块的 `API.md` 中，所依赖方提供的接口与依赖方调用的接口是否签名一致
   - 功能覆盖检查：确认每个模块的接口定义与 `ARCHITECTURE.md` 模块引用表中的描述无矛盾
    - 如果发现不一致，**暂停并升级给人类**，说明矛盾的具体位置和内容，等待人类决策后再继续
7. 任务按依赖关系拓扑排序
8. **追加 `AGENTS.md`**：在 `AGENTS.md` 末尾追加"PLAN.md 任务规范"章节，说明 `PLAN.md` 的格式、任务标记规则、引用约定。

## 审查清单

开始评审前，如存在 `docs/DECISIONS.md` 且与当前阶段相关，请先阅读以了解已知遗留决策和已拒绝事项，避免重复提出。

人类评审 PLAN.md 时建议逐项核对以下清单：

- [ ] **任务全量覆盖**：所有模块 DESIGN.md 中的 `{MODULE}-F{NNN}` 特性是否都有对应 `T-{MODULE}-{NNN}` 任务
- [ ] **任务引用**：每条任务是否都引用了对应的 `[module-name/DESIGN.md#{MODULE}-F{NNN}]`
- [ ] **任务不包含方案**：任务描述是否只说明做什么，不涉及怎么做
- [ ] **依赖拓扑**：任务是否按依赖关系排序，所依赖任务在前
- [ ] **模块分组**：同一模块的任务是否连续排列
- [ ] **AGENTS.md 追加**：是否已追加"PLAN.md 任务规范"章节
- [ ] **格式正确**：所有任务行符合 `- [ ] T-{MODULE}-{NNN}: 描述 [ref]` 格式

## 晋级条件

人类明确回复"PLAN.md 定稿"，并提交 Git
