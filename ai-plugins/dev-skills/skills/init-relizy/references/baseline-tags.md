# Baseline Package Tags 与 Runner Precheck

## 为什么 baseline tags 是通用问题

在 `independent` 模式下，relizy 依赖每个子包已有至少一条 `@scope/pkg@x.y.z` 形式的 git tag，才能判断本次的 bump 范围。任何首次接入或新增子包的 monorepo 都可能缺少这些 tag，**与操作系统无关**。

这意味着：哪怕目标仓库是纯 Linux CI、没有任何 Windows 问题，baseline tag 缺失仍然会让 relizy 静默跳过应被 bump 的包，或直接失败——而这种失败往往没有清晰的错误提示。

## Runner 是推荐的预检机制

`templates/relizy-runner.ts` 中实现了两个关键函数：

- `shouldCheckIndependentBootstrap(relizyArgs)` — 判断当前命令是 `release` 或 `bump`（即可能触发实际版本计算的子命令），只有这时才执行预检。
- `getPackagesMissingBootstrapTags(env)` — 扫描 `getWorkspacePackages()` 返回的所有包，对每个包执行 `git tag --list "@pkgname@*"`，收集返回为空的包。

若 `missingPackages.length > 0`：runner 打印可直接执行的 `git tag` 与 `git push` 指令，然后以非零状态退出，**不执行 relizy**。

## 定制化：`getWorkspacePackages()` 的扫描范围

这是 runner 中**唯一需要按仓库调整的函数**。默认实现只扫描 `apps/*`，需要与实际 workspace 对齐：

```ts
// 单目录场景（默认）
const targetDir = resolve(process.cwd(), "apps");

// 多 glob 场景：合并扫描
const dirs = ["apps", "packages", "configs"];
return dirs.flatMap((dir) => scanDir(resolve(process.cwd(), dir)));
```

扫描范围必须覆盖 `relizy.config.ts` 中 `monorepo.packages` 所指向的所有子包，否则预检会漏掉部分包。

## 非 runner 场景的处理方式

若因特殊原因确认不使用 runner，则必须在接入前手工完成以下检查：

```bash
# 查询每个目标包是否已有 tag
git tag --list "@scope/pkg@*"
```

所有目标包都有至少一条匹配 tag 后，才能执行 `relizy release`。这个流程无法自动化，依赖人工记忆，出错概率更高。
