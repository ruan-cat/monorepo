# README 与 CHANGELOG 边界

## `rootChangelog: true`

- 表示根目录 `CHANGELOG.md` 的生成/参与方式，**不**等价于「修改 README」。

## `formatCmd`

- 应仅指向格式化 changelog 的安全命令（如 `pnpm run format:changelog`）。
- **禁止**过宽到顺手改写 `README.md` 或无关文件。

## 文档职责

- **README**：发版入口、命令、首次接入、兼容说明、安全标志。
- **CHANGELOG**：版本历史内容；与 README 分工明确。
