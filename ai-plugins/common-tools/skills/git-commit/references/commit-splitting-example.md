# 提交拆分详细指南与示例

> 本文件是 `分门别类拆分提交规范` 的详细参考。当拆分逻辑复杂、文件众多、或对拆分维度不确定时，查阅此文件。

## 四个拆分维度详解

### 1. 按文件类型拆分

不同类型的文件通常对应不同关注点：

- 配置文件（`*.json`, `*.yaml`, `*.toml`, `nitro.config.ts` 等）→ `config` 类型
- 文档文件（`*.md`, `CHANGELOG`, `README`）→ `docs` 类型
- 测试文件（`*.test.ts`, `*.spec.ts`）→ `test` 类型
- 依赖文件（`package.json`, `pnpm-lock.yaml`）→ `deps` 类型
- 核心源码文件 → `feat` / `fix` / `refactor` 类型

### 2. 按业务功能模块拆分

不同业务模块的改动应独立提交，即使它们都是同一类型（如 `feat`）：

- `feat(auth): ...` 和 `feat(payment): ...` 应分开
- `fix(users): ...` 和 `fix(orders): ...` 应分开

### 3. 按修改类型拆分

不同 `type` 的变更必须分开提交，不能混在一起：

- 新增功能（`feat`）和修复 Bug（`fix`）→ 分开
- 功能代码（`feat`/`fix`）和格式化（`style`）→ 分开
- 业务逻辑和重构（`refactor`）→ 分开

### 4. 按修改范围拆分

- 前端代码 vs 后端代码
- 生产代码 vs 测试代码
- 应用代码 vs 基础设施/工具链代码

## 完整示例：8 个文件的拆分方案

```plain
变更文件：
  M  src/api/users.ts          # 后端业务逻辑：新增用户查询
  M  src/api/orders.ts         # 后端业务逻辑：修复订单Bug
  M  src/components/UserList.vue # 前端组件
  M  nitro.config.ts            # 配置文件
  M  package.json               # 依赖升级
  M  pnpm-lock.yaml             # 依赖锁定文件
  M  tests/users.test.ts        # 测试文件
  M  CHANGELOG.md               # 文档

推荐拆分为 5 个提交：
  提交1: ✨ feat(users): 新增用户查询接口       ← src/api/users.ts
  提交2: 🐞 fix(orders): 修复订单数量计算错误   ← src/api/orders.ts
  提交3: ✨ feat(ui): 新增用户列表组件          ← src/components/UserList.vue
  提交4: 🧪 test(users): 补充用户查询单测       ← tests/users.test.ts
  提交5: 📦 deps: 升级依赖并更新配置            ← package.json + pnpm-lock.yaml + nitro.config.ts
  (CHANGELOG.md 通常随其他提交一起或单独 docs 提交)
```

## 为什么要拆分

- 每个提交都有清晰的单一职责，方便 code review 和问题追溯
- 出现问题时可以精准 `git revert` 单个提交而不影响其他变更
- 符合 Conventional Commits 语义：一个 `type` 对应一类变更
