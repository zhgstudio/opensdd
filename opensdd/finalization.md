# 最终定稿（人类）

## 角色

人类

## 输入

全部 5 类已定稿文档：`SPEC.md`、`ARCHITECTURE.md`、各 `INTERFACE.md` / `INTERNALS.md`、`PLAN.md`、`AGENTS.md`

## 输出

锁定 `AGENTS.md`，标记 OpenSDD 阶段完成

## 行为

1. **审查全部文档的完整性和一致性**
2. **运行全量自动化验证**，执行以下检查（可用 `node tools/opensdd-check/index.js --strict` 一键执行全部）：
   - **结构合规**：`FILE_EXISTS`、`DEP_MATRIX`、`PLAN_FORMAT`、`NO_GARBAGE` — 确保目录拓扑和命名规范
   - **模块内容**：`MODULE_CONTENT` — 每个 INTERFACE.md 和 INTERNALS.md 包含所有必要章节
   - **接口一致性**：`INTERFACE_CONSISTENCY` — 跨模块接口签名匹配，被依赖方提供的接口与依赖方调用的接口一致
   - **语言一致性**：`LANGUAGE_CONSISTENCY` — 所有文档使用统一的语言
   - **公共设计合规**：`PUBLIC_DESIGN_COMPLIANCE` — 各模块的命名风格等遵循 ARCHITECTURE.md 公共设计规范
   - **技能元数据**：`FRONTMATTER` — 技能文件含有效的 YAML frontmatter
3. **完整性交叉验证**（人类或 AI 辅助）：
   - 确认 `PLAN.md` 中的 `T-{NNN}` 任务已完整覆盖所有模块 `INTERNALS.md` 中的 `{NN}-F{NNN}` 特性，无遗漏
   - 确认 `AGENTS.md` 中的所有章节有实质内容（非空或仅占位符）
   - 确认 `AGENTS.md` 中引用的模块目录路径 `docs/modules/{NN}-{name}/` 与实际目录一致
4. 确认 `AGENTS.md` 已覆盖编码阶段所需的所有指引
5. **锁定 `AGENTS.md`**：确认 `AGENTS.md` 内容完备后，不再修改。将其作为编码阶段的入口文件
6. 提交 Git，标记 OpenSDD 阶段完成，准备进入编码阶段

## 锁定后的使用方式

编码阶段启动时，AI 开发者按以下顺序加载上下文：

1. 先读取 `AGENTS.md` 了解项目规则
2. 根据当前要开发的模块，读取 `ARCHITECTURE.md`（公共设计部分）
3. 读取对应模块的 `docs/modules/{NN}-{name}/INTERFACE.md` 和 `INTERNALS.md`
4. 通过 `PLAN.md` 了解任务优先级和完成状态
5. 严格遵循 `INTERFACE.md` 中的接口定义和 `INTERNALS.md` 中的实现规范实现代码
