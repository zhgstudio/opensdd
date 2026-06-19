# 最终定稿（人类）

## 角色

人类

## 输入

全部 5 类已定稿文档：`SPEC.md`、`ARCHITECTURE.md`、各 `DESIGN.md`、`PLAN.md`、`AGENTS.md`

## 输出

锁定 `AGENTS.md`，标记 OpenSDD 阶段完成

## 行为

1. 审查全部文档的完整性和一致性
2. 运行 `node tools/opensdd-check/index.js` 进行结构合规性检查，确保无报错
3. 确认 `AGENTS.md` 已覆盖编码阶段所需的所有指引
4. **锁定 `AGENTS.md`**：确认 `AGENTS.md` 内容完备后，不再修改。将其作为编码阶段的入口文件
5. 提交 Git，标记 OpenSDD 阶段完成，准备进入编码阶段

## 锁定后的使用方式

编码阶段启动时，AI 开发者按以下顺序加载上下文：

1. 先读取 `AGENTS.md` 了解项目规则
2. 根据当前要开发的模块，读取 `ARCHITECTURE.md`（公共设计部分）
3. 读取对应模块的 `docs/modules/{NN}-{name}/DESIGN.md`
4. 通过 `PLAN.md` 了解任务优先级和完成状态
5. 严格遵循 `DESIGN.md` 中的接口定义和数据结构实现代码
