# 阶段三：模块详细设计（Designer Agent）

## 角色

模块设计师（Designer Agent）

## 上下文

`ARCHITECTURE.md` + 被依赖模块的 `INTERFACE.md`（只读）

## 输入

定稿的 `ARCHITECTURE.md`、`SPEC.md`

## 输出

`docs/modules/{NN}-{name}/INTERFACE.md` + `docs/modules/{NN}-{name}/INTERNALS.md`

## 前置条件

人类明确指定当前要设计的模块名

## 行为

1. **串行设计约束**：
   - 所有模块严格按依赖顺序串行推进——被依赖模块设计定稿后，才能开始依赖它的模块
   - 无依赖关系的模块也按模块引用表顺序依次设计
   - 一次调用只设计一个模块
2. **创建模块目录**：`docs/modules/{NN}-{name}/`，在该目录下生成 `INTERFACE.md`（对外接口）和 `INTERNALS.md`（内部实现），其中 `NN` 和 `name` 必须与 `ARCHITECTURE.md` 模块引用表严格一致
3. **在模块目录下生成 `INTERFACE.md` 和 `INTERNALS.md`**，使用人类指定语言，分别按以下要求填充：

   `INTERFACE.md` 须包含：
   - 模块概述与职责边界
   - 核心数据结构（概念模型、实体字段、关系，不含具体 DDL）
   - 接口定义（入参、出参、错误码）

   `INTERNALS.md` 须包含：
   - 核心逻辑流程 / 状态机
   - 内部实现细节
   - 该模块需要实现的功能特性列表（feature list），每条以 `### {NN}-F{NNN}` 编号

   示例（INTERNALS.md）：
   ```markdown
   ### 01-F001: 用户注册接口
   实现 `POST /auth/register` 端点，接收邮箱+密码，返回 token。

    ### 01-F002: 用户登录接口
    实现 `POST /auth/login` 端点，验证凭证，返回 token。
    ```

### 接口与实现分离

为支持"只读依赖接口"约束，模块设计文档应拆分为两个文件：
- `docs/modules/{NN}-{name}/INTERFACE.md` — 对外接口定义（数据结构、API 入参/出参、错误码），供被依赖模块的设计师只读
- `docs/modules/{NN}-{name}/INTERNALS.md` — 内部实现细节（核心逻辑流程、状态机、内部数据结构），仅本模块设计师可读写

注意：两个文件中的命名和异常处理必须 100% 继承 ARCHITECTURE.md 的规范；`INTERFACE.md` 中的接口定义是跨模块契约，变更须升级至人类仲裁。

4. **标准继承**：所有字段命名和异常处理必须 100% 继承 `ARCHITECTURE.md` 的规范
5. **只读约束**：只允许读取被依赖模块的 `INTERFACE.md`，不允许读取被依赖模块的 `INTERNALS.md`
6. **不允许设计师写入 `AGENTS.md`**——设计师发现的模块专属约束写在 `INTERNALS.md` 中即可，只有全局性约束才进入 `AGENTS.md`，而这种约束在架构阶段已被定义

## 晋级条件

人类对该模块的 `INTERFACE.md` 和 `INTERNALS.md` 评审通过，明确回复"{模块名}设计定稿"，并提交 Git。然后才能进入下一个模块的设计。
