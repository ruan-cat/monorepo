# Skill Router MCP：Vitest 开发期测试策略

## 1. 文档目的

本文定义 `Skill-Router-MCP` 在开发阶段的 Vitest 测试架构。

目标不是把所有测试塞进一个 Vitest 配置，而是根据运行环境拆成三类：

```text
Pure Node Unit Tests
        |
        v
Cloudflare workerd Runtime Tests
        |
        v
Production-build Integration Tests
```

这样既保留快速反馈，也真实覆盖 Cloudflare Worker runtime 和最终构建产物。

---

# 2. 仓库当前 Vitest 版本约束

当前 monorepo 根 `package.json` 使用：

```text
vitest ^3.2.4
@vitest/ui ^3.2.4
```

同时根目录仍存在：

```text
vitest.workspace.ts
```

这属于仓库现有测试基础设施，不应为了本 MCP 项目被强制整体升级。

而 Cloudflare 当前 Workers Vitest integration 使用：

```text
@cloudflare/vitest-pool-workers
```

并要求：

```text
Vitest >= 4.1
```

因此本项目必须采用 **package-local Vitest 4.x**，不要直接复用根 Vitest 3.x runtime。

---

# 3. 版本隔离决策

Cloud MCP 子项目自己的 `package.json` 应直接声明测试依赖：

```text
vitest ^4.1.0 或实施时经官方文档验证兼容的更新版本
@cloudflare/vitest-pool-workers
wrangler
```

版本策略：

1. 以实施时 Cloudflare 官方兼容矩阵为准。
2. 不猜测 `@cloudflare/vitest-pool-workers` 的兼容版本。
3. 最终通过 `pnpm-lock.yaml` 固化实际解析版本。
4. 不因为 MCP 测试要求而升级 monorepo 根 Vitest 3.x。
5. MCP 测试通过 package-local scripts 执行，不依赖根 `vitest.workspace.ts` 收集。

推荐调用方式：

```text
pnpm --filter <skill-router-mcp-package> test:unit
pnpm --filter <skill-router-mcp-package> test:worker
pnpm --filter <skill-router-mcp-package> test:integration
```

不要要求从仓库根直接运行一个全局 `vitest` 命令来同时驱动 Vitest 3 和 Vitest 4。

---

# 4. 为什么不复用旧 Nitro Vitest 模板作为唯一方案

仓库现有 `nitro-api-development/references/vitest-testing.md` 主要描述：

```text
Node Vitest
+
手工启动 pnpm dev
+
HTTP 请求 localhost Nitro server
```

这个模式适合普通 Nitro API 集成测试，但对本项目不足以覆盖：

- Cloudflare Worker globals/runtime 行为。
- Wrangler vars / secrets / compatibility 配置。
- Worker production build。
- Streamable HTTP MCP transport 在 workerd 中的行为。
- Cloudflare runtime 与 Node runtime 的差异。

因此它可以作为普通 HTTP 测试参考，但不能成为本 Cloud MCP 的最终测试架构。

---

# 5. 测试项目 A：Pure Node Unit Tests

目标：最快速度验证纯业务逻辑。

推荐配置：

```text
vitest.unit.config.ts
```

运行环境：

```text
Node
```

这些模块必须尽量设计为与 Cloudflare runtime 解耦：

```text
services/
registry validator/parser
search/ranking
SourceSnapshot domain logic
tool input validation
error mapping
GitHub response normalization
```

## 5.1 Registry Validator

测试：

- `schemaVersion=1`。
- `skills[]` 字段完整。
- duplicate id 拒绝。
- entry path 非法拒绝。
- unknown schema 拒绝。
- 不要求 registry 存 references/templates/examples。

## 5.2 Search

fixture 应覆盖：

- exact id match。
- name match。
- description token match。
- plugin filtering（如果 tool 支持）。
- 大小写/空白归一化。
- 无匹配。
- 多候选稳定排序。

必须断言 search 只使用 registry 数据，不触发正文 loader。

## 5.3 SourceSnapshot

测试：

```text
GITHUB_REF -> A
```

得到 immutable snapshot 后，下游只能接收 A。

测试 optional pin：

```text
sourceCommitSha=A
```

直接建立 pinned snapshot，而不是重新解析 mutable branch。

## 5.4 Tool Input Contract

测试：

- `search_skills.query` 空字符串/超长输入。
- `load_skill.skillId` 非法值。
- `sourceCommitSha` 未提供。
- `sourceCommitSha` 提供。
- 调用方不能指定任意 owner/repo。

## 5.5 Domain Error Mapping

至少覆盖：

```text
REGISTRY_NOT_FOUND
REGISTRY_SCHEMA_UNSUPPORTED
SKILL_NOT_FOUND
REGISTRY_ENTRY_INVALID
GITHUB_AUTH_FAILED
GITHUB_RATE_LIMITED
GITHUB_UPSTREAM_FAILED
```

错误中不得包含 GitHub Token 或 Authorization header。

---

# 6. 测试项目 B：GitHub Repository Adapter Unit Tests

仍可在 Node Vitest 中运行，但必须完全 mock outbound GitHub transport。

推荐把 HTTP/fetch 进一步抽象成可注入 transport，使测试不需要真实网络。

测试：

```text
resolveRef(dev) -> A
readRegistry(A)
readSkill(A, path)
readRelatedFile(A, path)
```

断言：

- 一旦 resolve 得到 A，后续 URL/ref 参数全部是 A。
- pinned A 不调用 `resolveRef(dev)`。
- 404 转换正确。
- 401/403 转换正确。
- rate limit 转换正确。
- malformed GitHub response 被拒绝。
- Token 只进入 transport header，不进入领域对象。

不要在普通 PR 单元测试中使用真实 GitHub API。

---

# 7. 测试项目 C：Cloudflare Workers Vitest Runtime Tests

推荐配置：

```text
vitest.worker.config.ts
```

使用：

```text
@cloudflare/vitest-pool-workers
cloudflareTest()
```

测试代码运行在 `workerd`，不是 Node 测试环境。

Cloudflare 官方集成可以直接暴露 Workers runtime APIs 和 bindings，并在本地使用 Miniflare/workerd 运行。

## 7.1 不能混用自定义 environment

Workers Vitest integration 不支持再指定自定义 Vitest `environment` / runner。

因此：

- Node unit tests 使用单独 config。
- Worker runtime tests 使用 `cloudflareTest()` config。
- 不要试图在一个 config 内用 `environment: node` 条件分支模拟两套 runtime。

## 7.2 Wrangler 配置复用

Worker runtime test 应从测试/开发 Wrangler 配置读取：

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
```

测试 Secret 使用假值，例如：

```text
GITHUB_TOKEN=test-token-do-not-use
```

不得把真实生产 Token 放进本地测试。

## 7.3 Runtime Binding Test

验证：

- Nitro/Worker runtime 能得到配置好的 vars。
- repository adapter 能接收 request-scoped bindings。
- 业务 Service 不直接访问 Worker env。
- 没有 `process.env` 依赖作为 Worker binding 方案。

## 7.4 Web API Compatibility

验证实际 runtime 中可使用：

```text
Request
Response
Headers
URL
fetch
crypto.subtle
```

同时确保核心调用链没有依赖：

```text
node:http
fs
child_process
listen()
filesystem persistence
```

## 7.5 MCP Runtime Smoke

在 workerd 环境内至少验证：

- MCP endpoint 可接收请求。
- initialize 成功。
- tools/list 暴露三个核心 tools。
- tools annotation 是只读/非破坏性。
- malformed HTTP/MCP 输入不会使 Worker 崩溃。

---

# 8. MCP SDK Contract Tests

不要只测试我们自己的函数返回对象。

至少有一组测试通过 MCP SDK 的客户端能力访问测试 endpoint，覆盖：

```text
Client
  -> Streamable HTTP
  -> Worker endpoint
  -> MCP SDK server
```

实际 SDK import/API 名称在实施时根据当前 SDK 官方类型确认，不要在规格中冻结可能变化的具体构造器签名。

必须覆盖：

```text
initialize
list tools
search_skills
load_skill latest
load_skill pinned
```

---

# 9. 高频更新测试 Fixtures

不要依赖真实 branch 在测试过程中被人 push。

用 fake GitHub transport 构造：

```text
resolve #1 -> A
resolve #2 -> B
```

fixture A/B 内分别提供不同 registry/Skill 内容。

场景：

```text
search_skills -> A
branch model moves -> B
load_skill(pin=A) -> A
load_skill(no pin) -> B
```

这样测试 deterministic，不受真实仓库并发修改干扰。

---

# 10. 测试文件建议结构

概念结构：

```text
tests/
├── unit/
│   ├── registry/
│   ├── search/
│   ├── source-snapshot/
│   ├── tools/
│   └── repositories/
├── worker/
│   ├── runtime-bindings.test.ts
│   ├── mcp-endpoint.test.ts
│   └── worker-errors.test.ts
└── integration/
    └── production-build.test.ts
```

不要强制一接口一文件机械复制；优先按领域行为组织测试。

---

# 11. 推荐 package scripts

概念上：

```json
{
  "scripts": {
    "test:unit": "vitest run -c vitest.unit.config.ts",
    "test:unit:watch": "vitest -c vitest.unit.config.ts",
    "test:worker": "vitest run -c vitest.worker.config.ts",
    "test:worker:watch": "vitest -c vitest.worker.config.ts",
    "test:integration": "vitest run -c vitest.integration.config.ts",
    "test:all": "pnpm test:unit && pnpm test:worker && pnpm test:integration"
  }
}
```

具体脚本名称可按最终 package 约定调整，但三类测试不得混成一个不透明命令。

---

# 12. Coverage 策略

第一版不要制定随意的“90% 全局覆盖率”作为质量替代品。

优先要求关键行为全部有分支用例：

- snapshot consistency。
- latest/pinned semantics。
- registry validation。
- GitHub error/security paths。
- MCP protocol lifecycle。

Cloudflare Workers Vitest integration 当前对 native V8 coverage 有限制；如果对 workerd tests 启用 coverage，应使用官方支持的 instrumented/Istanbul 方式。

Node unit tests 可独立生成普通 Vitest coverage。

---

# 13. 开发期快速反馈顺序

开发者修改纯搜索/领域代码：

```text
test:unit
```

修改 Worker binding/endpoint/MCP adapter：

```text
test:unit
+
test:worker
```

准备提交：

```text
test:all
+
typecheck
+
build
```

不要每保存一次纯函数就强制跑完整生产部署测试。

---

# 14. Definition of Done

- [ ] MCP package 独立使用 Vitest 4.1+ 兼容工具链。
- [ ] 不强制升级根 Vitest 3.x。
- [ ] Node unit 与 workerd runtime test 分离。
- [ ] Worker tests 使用 Cloudflare 官方 Vitest integration。
- [ ] MCP SDK client/server contract 有真实测试。
- [ ] GitHub 网络在单元测试中完全可控/mock。
- [ ] latest/pinned snapshot 有 deterministic fixtures。
- [ ] tests 不需要真实 Cloudflare/GitHub Secret。
- [ ] package scripts 区分 unit/worker/integration。
- [ ] coverage 不替代关键行为验收。
