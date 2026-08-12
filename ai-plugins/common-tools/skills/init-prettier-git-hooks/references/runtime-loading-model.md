# Prettier 三条运行时加载链路

## 现行配置

三条链路共享同一个顶层字符串契约：

```js
plugins: ["prettier-plugin-lint-md"],
```

字符串必须位于顶层。顶层对象和仅存在于 override 的插件声明均为已废弃方案。

## 普通 CLI

普通 CLI 读取配置并可加载字符串或对象插件。正因为它对两种形式都较宽容，只验证普通 CLI 无法证明配置可以跨入口工作。

普通 CLI 用于确认配置发现和顶层字符串自动加载；验收时不显式传入 `--plugin`，并断言 Markdown 输出发生目标变化。

## experimental CLI

experimental CLI 的插件 specifier 边界是字符串。顶层对象会产生插件加载错误，因此 v2 的对象 import 方案已废弃。

配置中的顶层字符串也是 experimental CLI 的自动加载契约。根 cwd 执行时，experimental CLI 会发现向上的 `prettier.config.mjs`；A/B 实验中显式参数与不传参数输出一致：

```text
prettier --experimental-cli --write --no-parallel
```

`--no-parallel` 用于规避已知 worker 崩溃。显式 `--plugin prettier-plugin-lint-md` 仅用于解析故障的诊断/隔离 A/B，不是默认生产命令，也没有证据表明它比根配置自动发现更健壮。experimental CLI 使用自己的配置参数和发现逻辑，不要把普通 CLI 的 `--config`、`--find-config-path` 机械复制过去。

## VSCode esbenp.prettier-vscode

VSCode 扩展应使用项目工作区中的 Prettier。它从 `resolveConfig(真实 Markdown 文件路径).plugins` 读取顶层插件列表，再从扩展进程的解析环境加载字符串插件。

仅把对象放在 Markdown override 中曾被当作 experimental CLI 的规避方案，但顶层插件列表因此为空，VSCode 无法提前发现插件。这一方案已废弃。调用 `resolveConfig` 时传目录也会得到误导性结果，必须传真实文件路径。

## 不能再采用的单条链路判断

- “普通 CLI 能格式化，所以对象形式是安全的”：错误，遗漏 experimental CLI。
- “experimental CLI 不报错，所以 override 对象是安全的”：错误，遗漏 VSCode 顶层发现。
- “VSCode 发出了格式化动作，所以插件已加载”：错误，插件静默失效时格式化仍可结束。
- “配置文件中出现插件名，所以依赖一定可加载”：错误，pnpm 解析根和包入口仍可能不同。
