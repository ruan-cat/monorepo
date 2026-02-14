<!-- 有价值的报告 不予删除 -->

# 2026-02-14 多侧边栏功能实现事故复盘报告

## 事故概述

在实现 `@ruan-cat/vitepress-preset-config` 包的"多侧边栏"功能时，犯了大量低级错误，导致构建失败，路径拼接出现严重 bug。

## 错误表现

### 核心问题：路径重复拼接

构建时出现如下错误路径：

```plain
'D:\code\...\packages\domains\D:\code\...\packages\domains\docs'
```

路径被拼接了两次，导致不存在的路径。

## 犯下的错误清单

### 0. 不听指令：移动函数变成了重构函数

**错误行为**：

- 用户明确要求：**"你只需要移动函数就行了。移动函数还给你搞重构了，越改越多 bug。认真看看之前的 getProjectRootFromArgs 函数实现吧"**
- 但我完全忽视了用户的明确指示
- 把原本已经写好的、经过 2.7.0 版本验证的 `getProjectRootFromArgs()` 函数进行了"重构"
- 实际上用户要的是：直接把 `vitepress-project.ts` 移动到新位置使用，而不是重新编写

**反思**：
这是最根本的错误。用户已经明确告诉我要"移动函数"，而我却在"重构函数"。这是对用户指令的严重误解和执行偏差。

**正确的做法**：

- 直接把 `utils/vitepress-project.ts` 文件移动到 `utils/vitepress-project.ts`（实际上已经存在）
- 直接导入并使用已有的函数，而不是重新编写一套
- 用户说的是"移动"，不是"重新编写"

---

### 1. 过度复杂化实现方案

**错误行为**：

- 尝试手写复杂的路径枚举和默认值逻辑
- 试图预测所有可能的路径场景并逐一处理
- 在 `config.mts` 和 `multi-sidebar.ts` 中添加了大量不必要的路径转换代码

**反思**：
这是典型的"过度工程"（Over-engineering）问题。我原本有 `vitepress-project.ts` 工具函数可以正确获取项目根目录和源目录，但却选择了自己编写一套复杂的路径处理逻辑。

### 2. 重复拼接路径

**错误行为**：

- 在 `config.mts` 中先使用 `getVitepressSourceDirectory()` 获取源目录
- 然后又在 `multi-sidebar.ts` 中再次拼接路径
- 两次拼接导致路径重复

```typescript
// 错误示例
const sourceDir = getVitepressSourceDirectory(userConfig);
const resolvedPath = path.resolve(sourceDir, "prompts");
// 然后 vitepress-sidebar 内部又使用 path.join(process.cwd(), resolvedPath)
```

**反思**：
没有理解 `vitepress-sidebar` 库内部的工作原理。它会在内部使用 `path.join(process.cwd(), l)` 来处理路径，所以我传入的绝对路径会与 cwd 再次拼接。

### 3. 忽视现有工具函数

**错误行为**：

- 已有 `getProjectRootFromArgs()` 函数用于获取正确的项目根目录
- 已有 `getVitepressSourceDirectory()` 函数用于获取源目录
- 已有 `hasPromptsIndexMd()` 和 `hasChangelogMd()` 函数用于检测文件存在性

**反思**：
这些函数是 2.7.0 版本添加的，专门用于解决路径问题。但我在实现新功能时，完全忽视了这些现有的、经过验证的工具函数，而是选择重新发明轮子。

### 4. 在错误的地方寻找答案

**错误行为**：

- 在网上搜索各种 Windows 路径处理方案
- 尝试使用 `path.normalize()`、`path.resolve()`、正斜杠转换等各种方法
- 试图在"如何正确拼接 Windows 路径"这个错误问题上深挖

**反思**：
方向错了就不可能找到正确答案。正确的方向应该是："如何让 vitepress-sidebar 正确工作"，而不是"如何手动拼接路径"。

### 5. 忽略 Windows 路径特性

**错误行为**：

- 在 Windows 上，路径是 `D:\path\to\dir` 格式
- 当传入绝对路径给 `path.join()` 时，如果路径已经绝对，它会忽略前面的参数
- 但 `vitepress-sidebar` 使用 `path.join(process.cwd(), l)` 的方式，当 `l` 是绝对路径时，结果仍然是绝对路径

**反思**：
对 Node.js 的 `path.join()` 在 Windows 上的行为理解不深。实际上，最简单的解决方案就是使用相对路径 `"."`，让 vitepress-sidebar 自己根据 cwd 处理。

### 6. 枚举猜测路径：isLikelySourceDir 函数

**错误行为**：

- 编写了 `isLikelySourceDir` 函数，通过枚举 `["docs", "doc", "src", "source", "pages"]` 这些常见的源目录名称来猜测路径
- 这是完全错误的设计思路：路径应该由用户决定，而不是由代码猜测

**反思**：

- 正确的做法：让用户传入什么路径，就从那个路径向上查找 .vitepress 目录
- 不应该枚举"可能"的路径，这种设计是脆弱的，如果用户使用其他目录名就会失败
- 实际上删除了这个函数后，构建仍然正常工作，证明这个函数是完全多余的

## 根本原因分析

### 0. 不听用户指令

这是最根本的错误。用户明确说：

- "你只需要移动函数就行了"
- "移动函数还给你搞重构了，越改越多 bug"
- "认真看看之前的 getProjectRootFromArgs 函数实现吧"

但我把"移动函数"理解成了"重构函数"，完全违背了用户的指令。

---

### 1. 没有遵循 KISS 原则

Keep It Simple, Stupid（保持简单愚蠢）。我在实现时：

- 增加了不必要的复杂性
- 引入了不必要的依赖
- 没有复用现有代码

### 2. 没有理解底层依赖的工作原理

使用 `vitepress-sidebar` 库时，没有仔细阅读它的文档和源码，不理解它如何处理路径。

### 3. 急于求成，没有先理解问题

在动手修改代码前，没有：

- 仔细分析错误信息
- 查看 vitepress-sidebar 的实现
- 回顾已有的工具函数

## 正确的解决方案

最终解决方案非常简单：

```typescript
function generateBusinessSidebar(userConfig: UserConfig<DefaultTheme.Config>) {
	return generateSidebar(
		getMergeSidebarOptions({
			documentRootPath: ".",
			excludeByGlobPattern: ["**/prompts/**", "**/CHANGELOG.md"],
		}),
	);
}
```

**关键点**：使用相对路径 `"."`，让 `vitepress-sidebar` 自己处理路径拼接，而不是传入绝对路径。

## 经验教训

0. **严格遵循用户指令**：用户说"移动函数"就绝对不要"重构函数"，不要自行发挥
1. **优先复用现有代码**：项目中已有解决类似问题的工具函数，应该优先使用
2. **理解底层依赖**：在使用一个库之前，先理解它的工作原理
3. **保持简单**：能用简单方案解决时，不要引入复杂性
4. **仔细阅读错误信息**：错误信息已经提示了问题所在（路径重复拼接），但我没有重视
5. **避免过度工程**：不要为"可能出现的未来需求"预先设计
6. **不要猜测路径**：不要枚举可能的路径，应该让用户传入的路径直接向上查找 .vitepress 目录

## 后续改进

1. 在修改代码前，先完整阅读相关模块的代码
2. 使用简单的方案解决问题，除非简单方案确实不可行
3. 每次修改后及时测试，不要累积大量改动
4. 遇到问题先分析根因，而不是尝试各种"可能有效"的方案

---

## 多侧边栏路径拼接问题补充报告（第二轮）

### 问题背景

在初步解决路径拼接问题后，遇到了新的问题：

- `vitepress-preset-config` 包可以正常构建
- 但 `domains` 包构建失败，错误信息为 `ENOENT: no such file or directory, scandir 'D:\code\...\packages\domains\prompts'`

### 错误表现

#### 问题 1：路径拼接错误（第一次修复后）

错误路径：

```plain
'D:\code\...\packages\domains\D:\code\...\packages\domains\docs\prompts'
```

路径被拼接了两次。

### 问题 2：scanStartPath 与 documentRootPath 同时设置（第二次修复后）

错误路径：

```plain
'D:\code\...\packages\domains\docs\docs\prompts'
```

当同时设置 `documentRootPath: "docs"` 和 `scanStartPath: "prompts"` 时，vitepress-sidebar 会把它们拼接起来。

### 解决方案

#### 核心发现

1. **vitepress-sidebar 总是基于 `process.cwd()` 处理路径**
2. **不要同时设置 `documentRootPath` 和 `scanStartPath`**，否则会拼接路径导致错误

#### 最终解决方案

```typescript
function getSourceDirRelativePathFromCwd(userConfig: UserConfig<DefaultTheme.Config>): string {
	const projectRoot = getVitepressProjectRoot();
	const sourceDir = getVitepressSourceDirectory(userConfig);

	// 计算源目录相对于 cwd 的路径
	const relativePath = path.relative(process.cwd(), sourceDir);

	// 如果相对路径为空或指向父目录，说明源目录就是 cwd
	if (!relativePath || relativePath.startsWith("..")) {
		return ".";
	}

	// 统一使用正斜杠（Windows 路径转换）
	return relativePath.replace(/\\/g, "/");
}

// 在 generateMultiSidebar 中使用
const sidebarOptions: VitePressSidebarOptions[] = [
	getMergeSidebarOptions({
		documentRootPath: sourceDirRelativePathFromCwd,
		resolvePath: "/",
		excludeByGlobPattern: ["**/prompts/**", "**/CHANGELOG.md"],
	}),
];

if (hasPrompts) {
	// 关键：只用 scanStartPath 来指定扫描路径，不要同时设置 documentRootPath
	const promptsScanPath = sourceDirRelativePathFromCwd === "." ? "prompts" : `${sourceDirRelativePathFromCwd}/prompts`;
	sidebarOptions.push(
		getMergeSidebarOptions({
			documentRootPath: ".",
			scanStartPath: promptsScanPath,
			resolvePath: "/prompts/",
		}),
	);
}
```

#### 关键点

1. **业务侧边栏**：直接使用 `documentRootPath: sourceDirRelativePathFromCwd`
2. **prompts 侧边栏**：使用 `documentRootPath: "."` 配合 `scanStartPath: "docs/prompts"` 或 `"prompts"`
3. **CHANGELOG 侧边栏**：直接使用 `documentRootPath: sourceDirRelativePathFromCwd`

### 新增经验教训

1. **使用动态路径识别**：不要写死路径，使用 `getVitepressProjectRoot()` 和 `getVitepressSourceDirectory()` 动态计算
2. **理解 vitepress-sidebar 的路径处理机制**：
   - 总是基于 `process.cwd()` 处理
   - `documentRootPath` 和 `scanStartPath` 会拼接
3. **分别处理不同场景**：
   - 扫描根目录：只用 `documentRootPath`
   - 扫描子目录：使用 `documentRootPath: "."` + `scanStartPath`
4. **使用相对路径而非绝对路径**：避免路径被重复拼接
5. **验证每种目录结构**：确保同时支持 `src/docs` 和 `docs` 两种常见结构

---

## 第三轮复盘：为什么旧方案无法实现多侧边栏

### 旧方案的致命缺陷：赋值被覆盖

旧方案 `generateMultiSidebar` 的工作流程是：

```typescript
// setUserConfig 内部
resUserConfig.themeConfig.sidebar = generateMultiSidebar(resUserConfig);
return resUserConfig;
```

看起来没问题。但问题在于 **消费者的代码**：

```typescript
// 消费者代码（6 个消费者全部这样写）
const userConfig = setUserConfig({ ... });
userConfig.themeConfig.sidebar = setGenerateSidebar({ documentRootPath: "./docs" });
```

时间线如下：

1. `setUserConfig()` 内部调用 `generateMultiSidebar()`，生成多侧边栏对象 `{ '/': [...], '/prompts/': [...], '/CHANGELOG': [] }`
2. 将多侧边栏赋值给 `themeConfig.sidebar`
3. `setUserConfig()` 返回 `userConfig`
4. **消费者立刻用 `setGenerateSidebar()` 的返回值覆盖了 `themeConfig.sidebar`**
5. 多侧边栏配置被一个普通的数组彻底覆盖，等于白做

这就是旧方案从未真正生效的根本原因：**不管 `generateMultiSidebar` 内部生成了多么正确的多侧边栏配置，消费者的下一行代码就把它覆盖了。**

### 为什么之前没有发现这个问题

1. 旧代码中 `generateMultiSidebar` 是后加的功能，但没有人检查消费者代码是否兼容
2. 仅在 `setUserConfig` 内部做了验证，没有追踪 `sidebar` 在返回后的生命周期
3. 没有对消费者的实际使用模式做全面扫描

### 为什么之前没有考虑消费端的代码实现

这是典型的**"只看自己的函数，不看调用者"**的思维盲区：

1. 编写 `generateMultiSidebar` 时，只关注了"如何正确生成多侧边栏"
2. 完全没有思考"生成之后，这个值会经历什么"
3. 没有追问一个关键问题：**消费者拿到 `setUserConfig()` 的返回值之后，还会对 `sidebar` 做什么操作？**

如果当时扫描了 6 个消费者的 `config.mts`，就会发现它们全部在 `setUserConfig()` 之后重新赋值 `sidebar`。这个发现会直接否定"在 `setUserConfig` 内部赋值"的方案。

### Object.defineProperty 方案为什么能解决

新方案用 `Object.defineProperty` 设置 getter/setter 拦截：

```plain
消费者调用流程:
1. setUserConfig()     → setupMultiSidebar() 设置 defineProperty 拦截
2. setGenerateSidebar()  → 返回数组（业务侧边栏）
3. sidebar = result    → setter 拦截，存储为 businessSidebar（不是直接赋值！）
4. VitePress 读取 sidebar → getter 返回 { '/': businessSidebar, '/prompts/': [...], '/CHANGELOG': [] }
```

关键差异：消费者以为自己在"覆盖" sidebar，实际上 setter 只是把值存起来了。VitePress 读取时，getter 把业务侧边栏和额外侧边栏合并返回。消费者的代码**一个字都不用改**。

### 经验教训

1. **编写函数时，必须追踪返回值的完整生命周期**：不能只关心"我生成了什么"，还要关心"调用者拿到之后会做什么"
2. **先扫描所有消费者再做方案设计**：在设计新功能时，先全面了解现有消费者的使用模式，而不是假设消费者会配合你的新设计
3. **"赋值即覆盖"是 JavaScript 的基本规则**：如果你的方案依赖于"在 A 点赋值后，B 点不会再赋值"，那这个方案就是脆弱的

---

## 第四轮复盘：为什么忽略了路由前缀

### 问题表现

prompts 目录下的文件 `make-dynamic-routes.md`，期望路由为 `/prompts/make-dynamic-routes`，但生成的侧边栏链接是 `/make-dynamic-routes`，缺少 `/prompts` 前缀，导致点击后 404。

### 根因分析

`generateSidebar` 的 `documentRootPath` 决定了扫描的根目录。当设置为 `prompts` 目录时：

```typescript
generateSidebar({
	documentRootPath: "src/docs/prompts", // 以 prompts 为根
});
```

`vitepress-sidebar` 以 `prompts` 目录为"世界的起点"，生成的 link 自然是相对于这个根的：`/make-dynamic-routes`。它不知道、也不关心这个目录在 VitePress 路由中的实际挂载点是 `/prompts/`。

这是**扫描作用域**和**路由作用域**的不匹配：

| 维度        | 值                             | 说明                              |
| ----------- | ------------------------------ | --------------------------------- |
| 扫描根      | `src/docs/prompts/`            | generateSidebar 以此为根扫描文件  |
| 路由根      | `/prompts/`                    | VitePress 中该目录的实际 URL 前缀 |
| 生成的 link | `/make-dynamic-routes`         | 相对于扫描根，缺少路由前缀        |
| 期望的 link | `/prompts/make-dynamic-routes` | 相对于站点根                      |

### 为什么会犯这个错误

1. **只测试了侧边栏"是否显示"，没有测试"链接是否正确"**：构建成功、侧边栏出现了，就以为功能完成了
2. **混淆了文件系统路径和 URL 路由**：`documentRootPath` 是文件系统概念，`link` 是 URL 路由概念，两者的"根"不一定相同
3. **旧方案中用 `resolvePath: "/prompts/"` 隐式解决了这个问题**：旧代码通过数组配置 + `resolvePath` 让 `vitepress-sidebar` 自动处理前缀，但新方案改用单配置调用后，丢掉了这层隐式保护

### 修复方案

添加 `prefixSidebarLinks` 函数，递归遍历所有侧边栏项，为 `link` 属性补充 `/prompts` 前缀：

```typescript
function prefixSidebarLinks(items: any[], prefix: string): any[] {
	return items.map((item) => {
		const newItem = { ...item };
		if (newItem.link && typeof newItem.link === "string") {
			const link = newItem.link.startsWith("/") ? newItem.link : `/${newItem.link}`;
			newItem.link = `${prefix}${link}`;
		}
		if (Array.isArray(newItem.items)) {
			newItem.items = prefixSidebarLinks(newItem.items, prefix);
		}
		return newItem;
	});
}
```

### 经验教训

1. **文件系统路径 ≠ URL 路由**：扫描目录和 URL 挂载点是两个独立的概念，替换方案时必须检查是否丢失了路径映射
2. **验证功能时要端到端**：不能只验证"侧边栏显示了"，还要验证"点击链接能到达正确页面"
3. **替换隐式行为时要识别其副作用**：旧方案的 `resolvePath` 同时解决了"多侧边栏路由分发"和"链接前缀补全"两个问题，拆开后每个问题都需要显式处理
