> **何时读**：把 npm/yarn/npx 命令替换为 pnpm 写法时查表。注：表内「见上文版本分域规则」指 SKILL.md 的「NVM Desktop + Corepack Rules（版本分域）」章节。

## Command Mapping

常见替换：

| npm/yarn/npx           | pnpm                                   |
| ---------------------- | -------------------------------------- |
| `npm install`          | `pnpm install`                         |
| `npm install <pkg>`    | `pnpm add <pkg>`                       |
| `npm install -D <pkg>` | `pnpm add -D <pkg>`                    |
| `npm uninstall <pkg>`  | `pnpm remove <pkg>`                    |
| `npm update <pkg>`     | `pnpm update <pkg>`                    |
| `npm run <script>`     | `pnpm run <script>` 或 `pnpm <script>` |
| `npx <bin>`            | `pnpm dlx <bin>`                       |
| `yarn add <pkg>`       | `pnpm add <pkg>`                       |
| `yarn remove <pkg>`    | `pnpm remove <pkg>`                    |
| `yarn why <pkg>`       | `pnpm why <pkg>`                       |

全局命令：

```powershell
pnpm add -g <pkg>
pnpm update -g <pkg>
pnpm remove -g <pkg>
pnpm list -g --depth 0
```

注意：`pnpm add -g pnpm` 不是升级 pnpm 本体的默认答案。先确认 pnpm 管理方式与目标大版本（corepack 场景见上文版本分域规则；pnpm 12 场景见 [`references/corepack-eol-and-shim.md`](corepack-eol-and-shim.md)）。
