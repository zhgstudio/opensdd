# 最终定稿（人类）

## 角色

人类

## 输入

全部已定稿文档：`SPEC.md`、`ARCHITECTURE.md`、各 `API.md` / `DESIGN.md`、`PLAN.md`、`AGENTS.md`；如存在 `DECISIONS.md` 也一并纳入

## 输出

锁定 `AGENTS.md`，标记 OpenSDD 阶段完成

## 审查清单

### 人工审查

开始审查前，如存在 `docs/DECISIONS.md`，请先阅读该文件以了解已知遗留决策和已拒绝事项，避免重复提出。

逐项核验以下全部维度：

**SPEC.md**
- [ ] 业务背景与目标清晰、成功标准可衡量
- [ ] 功能需求以用户旅程或用例形式列出，可独立验证
- [ ] 每条需求以 `REQ-{NNN}` 编号，编号连续不重复
- [ ] 非功能性约束已量化（如响应时间、并发数）
- [ ] 边界与排除项明确

**ARCHITECTURE.md**
- [ ] 技术栈标准完整（语言、框架、版本、工具）
- [ ] 模块引用表与模块目录实际存在一致
- [ ] 模块依赖矩阵准确，接口签名写清
- [ ] 全局编码规范（命名、文件结构、错误格式）明确

**模块设计（每个模块）**
- [ ] API.md 包含模块概述、核心数据结构、接口定义
- [ ] DESIGN.md 包含核心逻辑、实现细节、`{NN}-F{NNN}` 特性列表
- [ ] 命名与 ARCHITECTURE.md 规范一致
- [ ] 接口签名与所依赖方声明匹配

**PLAN.md**
- [ ] `T-{NNN}` 任务覆盖所有 `{NN}-F{NNN}` 特性
- [ ] 每条任务引用 `[NN-name/DESIGN.md#{NN}-F{NNN}]`
- [ ] 任务按依赖拓扑排序，不包含方案细节

**AGENTS.md**（面向编码阶段的入口指引）
- [ ] 所有章节有实质内容，无空章节或占位符
- [ ] 引用的模块目录路径与实际一致
- [ ] 覆盖编码阶段所需全部指引
- [ ] 如存在 `DECISIONS.md`，已引用该文件并说明其加载规则

**DECISIONS.md**（如存在）
- [ ] 仅记录被拒绝或遗留暂不处理的事项，不记录已接受并执行的事项
- [ ] 每条记录含清晰理由和（如适用）取消条件

### 自动化验证

运行 `node tools/opensdd-check/index.js --strict` 并确认全部通过：

| 检查项 | 验证内容 |
|--------|----------|
| FILE_EXISTS | SPEC.md / ARCHITECTURE.md / PLAN.md / AGENTS.md 存在（如项目有 DECISIONS.md 也检查） |
| DEP_MATRIX | 模块目录与引用表一致，无孤儿目录 |
| PLAN_FORMAT | 任务格式正确，引用有效 |
| NO_TMP | 无 tmp/ 目录（临时过程文档不留存） |
| AGENTS_SECTIONS | AGENTS.md 含必要章节 |
| MODULE_CONTENT | 各模块文件含必要章节和特征列表 |
| API_CONSISTENCY | 跨模块接口签名匹配 |
| TBD_RESIDUAL | ARCHITECTURE.md 无残留 [TBD] 标记 |
| FRONTMATTER | 技能文件含有效 frontmatter |
| VERSION_CONSISTENCY | SKILL.md 版本号与 package.json 版本号一致 |
| DECISIONS_FORMAT | DECISIONS.md frontmatter 有效、含必需章节（理由、取消条件） |

## 定稿锁定

1. 上述人工审查 + 自动化验证全部通过
2. **锁定 `AGENTS.md`**：确认内容完备后，不再修改，作为编码阶段的入口文件
3. 提交 Git，标记 OpenSDD 阶段完成，准备进入编码阶段

## 锁定后的使用方式

编码阶段启动时，AI 开发者按以下顺序加载上下文：

1. 先读取 `AGENTS.md` 了解项目规则
2. 根据当前要开发的模块，读取 `ARCHITECTURE.md`（公共设计部分）
3. 读取对应模块的 `docs/modules/{NN}-{name}/API.md` 和 `DESIGN.md`
4. 通过 `PLAN.md` 了解任务优先级和完成状态
5. 严格遵循 `API.md` 中的接口定义和 `DESIGN.md` 中的实现规范实现代码
