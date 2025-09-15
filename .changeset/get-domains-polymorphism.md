---
"@ruan-cat/domains": minor
---

- `getDomains` 获取域名函数，实现多态，支持通过项目别名查询域名。
- 项目 `ruan-cat-notes` 的域名调换，子域名 `notes` 现在换回 `vercel` 平台，而不是 `cloudflare worker` 平台实现部署。预期将恢复全套的 git 修改日志。

## getDomains 函数支持通过项目别名查询域名

### 新增功能

- 为 `getDomains` 函数新增了函数重载支持，现在可以传入对象参数
- 新增 `GetDomainsParamsWithAlias` 接口，支持通过 `projectName` 和 `projectAlias` 查询域名
- 当指定 `projectAlias` 时，函数会精确返回对应别名的域名配置
- 当找不到指定的 `projectAlias` 时，会通过 consola 输出警告并返回项目的所有域名

### 原有功能保留

- 完全保留了原有的 `getDomains(projectName: string)` 用法，确保向后兼容

### 新增测试

- 使用 vitest 编写了完整的单元测试，覆盖所有使用场景
- 测试包括：字符串参数、对象参数、有效别名、无效别名、边界情况等

### 依赖变更

- 新增 `vitest` 作为开发依赖
- 将 `consola` 从开发依赖移至生产依赖

### 使用示例

```ts
// 原有用法（保持不变）
const domains1 = getDomains("ruan-cat-notes");
// 返回: ["notes.ruan-cat.com", "ruan-cat-notes.ruan-cat.com", "ruan-cat-notes.ruancat6312.top"]

// 新用法：不带别名
const domains2 = getDomains({ projectName: "ruan-cat-notes" });
// 返回: ["notes.ruan-cat.com", "ruan-cat-notes.ruan-cat.com", "ruan-cat-notes.ruancat6312.top"]

// 新用法：带别名
const domains3 = getDomains({
	projectName: "ruan-cat-notes",
	projectAlias: "notesCloudflare",
});
// 返回: ["notes.ruan-cat.com"]
```

## 域名 `notes.ruan-cat.com` 重返 vercel 平台

得益于在 vercel 平台内关闭 preview 预览分支的监听部署设置，现在大多数项目都不会占用，滥用，浪费掉宝贵的免费用户每日 100 次构建次数额度。

这使得我可以把全部的额度都用于文档项目的 dev 分支，实现高频高速的部署，且保证工作流环境提供 git 信息，使得每一个文章都能获取到历史修改记录。
