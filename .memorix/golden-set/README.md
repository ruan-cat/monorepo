# 项目黄金集

本目录是当前项目的检索质量事实源。复制到产品项目的 `.memorix/golden-set/` 后使用。

## 文件边界

| 路径                             | 跟踪状态 | 作用                             |
| :------------------------------- | :------- | :------------------------------- |
| `.memorix/golden-set/README.md`  | tracked  | 本项目黄金集约定                 |
| `.memorix/golden-set/cases.json` | tracked  | accepted case，项目 canonical    |
| `.memorix/golden-set/.local/`    | ignored  | 候选、审核中间态、日志           |
| `.memorix/hooks.json`            | tracked  | Memorix 既有软保留文件，必须保留 |

`.gitignore` 只增量加入一行：

```gitignore
.memorix/golden-set/.local/
```

不要忽略 `README.md` 或 `cases.json`，不要忽略或删除 `.memorix/hooks.json`。

## case 规则

- `schemaVersion` 固定为 `memorix-golden-set-case/v1`。
- `project.repository` 写 GitHub `owner/repository`，不写 URL，不写本机路径。
- `query` 必须是脱敏后的原文；绝对主目录、Bearer、密钥、邮箱都要先经脱敏器。
- `expected.mustMatch` 至少一项，优先使用 topicKey / entity / type / 标题关键词 / concept 关键词。
- `localHints.observationIds` 只作本机提示，不进入联邦 bundle，不作为跨项目稳定期望。
- 不保存结果正文、完整 observation、token、header 或数据库路径。

## 审核流程

1. 候选先落在 `.local/inbox/<candidateId>.json`，不是事实源。
2. 用 one-shot CLI 复跑同一脱敏 query，拿到当前真实结构化结果。
3. 基于真实结果补 `expected`，人工确认后写入 `cases.json`。
4. `promoted/` 只是审核中间态；只有 `cases.json` 是 canonical。
5. reject 的候选移入 `rejected/` 并保留理由。

## 硬性禁止

- 禁止产品项目 CI 读取、生成或修改本目录；黄金集只在本地与人工审核流程中使用。
- 禁止把 `MEMORIX_DATA_DIR` 指向项目 `.memorix/`。
- 禁止把本地 observationId、候选日志或结果正文导出到 common 仓库。
- 禁止为尚未出现真实检索失效的项目预创建黄金集。
