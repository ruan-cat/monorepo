# v3 验证剧本

## 验证目标

完成条件不是“命令退出 0”，而是三条加载链路对同一 Markdown 探针产生可证明的 lint-md 结果，并且版本三层一致。探针必须位于项目实际配置覆盖范围内，验证后清理。

## 1. 版本三层一致性

1. 读取 `package.json`，确认值精确为 `1.0.1`，没有 `^` 或 `~`。
2. 读取当前 importer 的 lockfile 快照，确认解析为 `1.0.1`。
3. 从真实命令 cwd 解析插件包元数据，确认运行版本为 `1.0.1`。

任一层不同都停止，不进入格式化验收。

## 2. 探针内容和断言

选择能触发配置中 lint-md 选项的中英文、字母和数字混排内容。先保存输入，再分别复制给每条链路。断言格式化后的具体空格变化，不要只断言文件可解析或命令成功。

探针必须覆盖：

- 中文与 ASCII 字母相邻。
- 中文与数字相邻。
- 至少一个不会被普通 Markdown parser 自行改写的对照段。

## 3. 普通 CLI

从目标项目真实执行根运行：

```text
pnpm exec prettier --write <探针文件>
```

检查退出码和完整文件内容。该命令不显式传 `--plugin`，用于直接证明配置中的顶层字符串可以自动加载插件；不能为了普通 CLI 改回对象。

## 4. experimental CLI

运行默认命令：

```text
pnpm exec prettier --experimental-cli --no-parallel --write <探针文件>
```

断言输出与普通 CLI 的 lint-md 规则一致。随后可复制同一输入做诊断 A/B：增加 `--plugin prettier-plugin-lint-md`；两组输出应一致。只有当不传参数失败而显式参数成功时，才进入插件解析根/依赖可见性分流；不能未经 A/B 就把显式参数写进生产命令。

## 5. VSCode

1. 确认扩展选择工作区 Prettier，而不是扩展自带版本。
2. 修改依赖或 hoist 后重启扩展窗口。
3. 对真实探针文件调用配置解析，确认顶层 `plugins` 含字符串。不要把目录传给 `resolveConfig`。
4. 在编辑器执行 Format Document，比较完整输出。格式化动作完成但内容未发生目标变化，判定为失败。

若自动化环境无法启动完整 Extension Host，可用当前安装扩展的等价解析链路做补充验证，但必须明确标注“未执行完整 UI 验收”，不能把模拟链路写成完整 VSCode 证据。

## 6. 安全收口

```text
node --check lint-staged.config.mjs
git diff --check
git status --short
git diff
git diff --cached
```

清理探针文件，确认没有修改或暂存用户原有文件。`lint-staged --debug`、Hook 安装、renormalize 和真实 commit 不属于只读验证，仍需单独授权。
