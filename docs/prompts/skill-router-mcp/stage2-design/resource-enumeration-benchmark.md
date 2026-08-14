# Stage 2 Skill Resource Enumeration Request Budget

## 1. Purpose

本文记录 Stage 2 在进入 Cloudflare Preview 前可以确定的 **结构性 GitHub API 请求预算**，并把它和部署后的真实网络延迟 benchmark 分开。

不能用 ChatGPT GitHub connector、单元测试或本地 mock 的 wall-clock 时间代替 Worker → GitHub 的生产网络延迟。真实 p50 / p95 latency 必须在 Preview / Staging 环境测量。

## 2. Cold request budget

当前 Skill root 形如：

```text
ai-plugins/common-tools/skills/<skillId>
```

共有 4 个目录段。

`GitHubSkillSource.listTree(skillRoot, exactSha)` 的 cold path：

```text
1 x git commit -> root tree SHA
4 x non-recursive tree lookup for each Skill-root segment
1 x recursive Skill subtree read
--------------------------------
6 x Git object requests
```

如果 recursive tree 返回 `truncated=true`，会进入 non-recursive subtree walk；该情况的请求数取决于 Skill 内目录数量，因此不作为正常 cold-path 固定预算。

### `list_skill_resources`

Pinned：

```text
1 x registry @ SHA
6 x cold Skill tree inventory
-----------------------------
7 x GitHub requests
```

Unpinned：

```text
1 x resolve GITHUB_REF -> SHA
1 x registry @ SHA
6 x cold Skill tree inventory
-----------------------------
8 x GitHub requests
```

### `load_skill_resource`

Pinned cold path：

```text
1 x registry @ SHA
6 x cold Skill tree inventory
1 x selected Git blob
-----------------------------
8 x GitHub requests
```

Unpinned cold path additionally resolves the mutable ref once, for 9 requests.

## 3. Worker-isolate best-effort tree cache

Stage 2 caches exact `(GitHub API endpoint, owner/repository, sourceCommitSha, Skill root)` tree inventory in module scope.

Characteristics:

- transport-scoped, so request-local production `GitHubSkillSource` instances can share the cache inside one Worker isolate;
- exact SHA scoped, so a new Git snapshot never reuses an older inventory;
- promise-valued, so concurrent cold requests for the same immutable inventory are coalesced;
- bounded LRU, maximum 64 inventory entries per transport scope;
- failed fetches are removed from the cache;
- correctness does not depend on cache persistence; isolate eviction only causes another cold traversal.

The Router still reads Registry at the requested SHA on every MCP request. Therefore the tree cache does not become a second Skill source of truth and does not bypass normal upstream auth/error handling for the request.

## 4. Warm request budget

Once the exact Skill inventory is present in the same Worker isolate:

### `list_skill_resources`

Pinned warm path:

```text
1 x registry @ SHA
0 x Git tree requests
-----------------------
1 x GitHub request
```

Unpinned warm path adds one ref-resolution request.

### `load_skill_resource`

Pinned warm path:

```text
1 x registry @ SHA
0 x Git tree requests
1 x selected Git blob
-----------------------
2 x GitHub requests
```

Unpinned warm path adds one ref-resolution request.

For multiple references from the same Skill snapshot, this changes the dominant tree cost from “every resource read” to “at most once per Worker isolate / exact Skill snapshot”.

## 5. Regression evidence

`packages/skill-router-mcp/tests/git-tree-cache.test.ts` freezes these structural properties:

1. a four-segment Skill root needs exactly 6 Git-object requests on the normal cold path;
2. two request-local `GitHubSkillSource` instances sharing the production transport scope coalesce the same cold inventory;
3. a repeated exact `(commit, Skill root)` lookup performs no additional Git-tree requests;
4. a different commit SHA causes a separate inventory traversal.

The normal package CI additionally runs typecheck, all unit/worker/integration tests and production build.

## 6. Registry decision

This request budget does **not** justify changing Registry v1 during Stage 2 implementation.

Reasons:

- cold inventory has a fixed bounded path-resolution cost for the current Skill-root layout;
- repeated resources from one Skill snapshot reuse immutable tree inventory inside the Worker isolate;
- Registry remains low-churn discovery metadata rather than a deep-file manifest;
- a Registry v2 inventory would increase release/index coupling without eliminating the need to fetch actual blobs.

Therefore Stage 2 keeps Registry v1.

A Registry v2 proposal should only be reopened if Preview/Staging measurements show unacceptable latency or GitHub rate consumption after the isolate cache is active.

## 7. Remaining external latency gate

After deploying the Stage 2 Worker preview, record at minimum:

```text
cold list_skill_resources latency
warm list_skill_resources latency
cold load_skill_resource latency
warm repeated load_skill_resource latency
GitHub rate-limit remaining before/after the scenario
```

Run both `git-commit` and `pr-ruancat-repo` scenarios. Record p50 / p95 over repeated runs where practical, while distinguishing cold-isolate and warm-isolate samples.
