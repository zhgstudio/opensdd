# 阶段二：总体架构设计（Architect Agent）

## 角色

架构师（Architect Agent）

## 上下文

仅加载 `docs/SPEC.md`（只读）+ `AGENTS.md`（只读，了解质量验收标准）

## 输入

定稿的 `docs/SPEC.md`、已有的 `AGENTS.md`

## 输出

- `docs/ARCHITECTURE.md`
- 写入 `AGENTS.md` 主体

## 行为

1. 以 `SPEC.md` 为唯一上下文，使用人类指定语言生成 `docs/ARCHITECTURE.md`
2. `ARCHITECTURE.md` 必须包含以下章节：

   ### 技术栈标准
   明确全系统技术栈、框架版本、构建工具、包管理方式。

   ### 全局编码规范
   命名风格（如 camelCase）、文件组织结构、错误返回格式（Error Envelope）、日志规范。

   ### 模块引用表
   以表格列出所有模块及其两位数字编号，格式：
   ```markdown
   ## 模块引用表
   | 编号 | 模块名 | 功能简述 | 详细设计 |
   |------|--------|----------|----------|
   | 01 | auth | 用户认证 | docs/modules/01-auth/DESIGN.md |
   | 02 | task-core | 任务核心 | docs/modules/02-task-core/DESIGN.md |
   ```
   - **编号** = 两位数字，与模块目录名一致
   - **模块名** = 英文短名，与目录名一致
   - **详细设计** = 指向该模块 DESIGN.md 的引用路径

   ### 模块依赖矩阵
   ```markdown
   ## 模块依赖矩阵
   | 模块 | 依赖 | 所需接口 |
   |------|------|----------|
   | 02-task-core | 01-auth | POST /auth/verify |
   | 03-api-gateway | 01-auth, 02-task-core | … |
   ```

   ### 公共设计
   跨模块共用的设计决策：认证方案、数据流拓扑、部署架构概览（如适用）。

3. **重要职责边界**：`ARCHITECTURE.md` 只写整体架构和公共设计，具体的模块内部设计放在对应模块的 `DESIGN.md` 中。`ARCHITECTURE.md` 中通过模块引用表引用到各 `DESIGN.md`，这样编码阶段的开发者只需要阅读 `AGENTS.md` + `ARCHITECTURE.md`（公共部分）+ 当前模块的 `DESIGN.md`

4. **写入 `AGENTS.md` 主体**，以 `## ` 为章节标题追加以下章节：
   - 文件操作范围（AI 可读/可写的目录白名单）
   - 提交规范（Commit 消息格式）
   - 测试要求（最小覆盖率、必须通过的测试范围）
   - 升级条件（什么情况下暂停并请求人类介入）
   - 跨模块规则（允许读取的模块接口文件列表等）

## 晋级条件

人类明确回复"ARCHITECTURE.md 定稿"，并提交 Git
