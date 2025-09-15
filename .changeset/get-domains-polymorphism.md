---
"@ruan-cat/domains": minor
---

实现 `getDomains` 函数多态，支持通过项目别名查询域名

## 主要变更

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

## 使用示例

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
