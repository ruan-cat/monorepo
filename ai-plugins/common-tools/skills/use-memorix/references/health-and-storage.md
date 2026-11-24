# Health、存储与运行时

本文件负责诊断与存储维护。health 类读取（status / doctor / audit）可以自动执行；任何修复、重写、重建都要确认。命令形态以当前 `memorix <command> --help` 为准。

## 自动只读诊断

| 检查项         | 命令                                                 | 关注点                                          |
| :------------- | :--------------------------------------------------- | :---------------------------------------------- |
| 版本与命令面   | `memorix --version`、`memorix <cmd> --help`          | 当前能力边界，不照抄旧文档                      |
| 项目身份与绑定 | `memorix status --cwd <当前工作区绝对路径>`          | 是否绑定到预期仓库；不带 `--cwd` 的项目 id 无效 |
| 健康总览       | `memorix doctor --cwd <当前工作区绝对路径>`          | project identity、embedding、data、冲突         |
| 数据文件       | 看 `~/.memorix/` 主库、`-wal`、`-shm` 的大小与 mtime | 是否存在异常增长或长期未落盘                    |
| CodeGraph      | `memorix codegraph --cwd <当前工作区绝对路径>`       | 索引是否存在、是否 stale                        |
| Retention 现状 | `memorix retention --cwd <当前工作区绝对路径>`       | 是否存在官方候选，不在此执行归档                |
| 存储与冲突     | `memorix audit --cwd <当前工作区绝对路径>`           | 归属健康、冲突记录                              |

只读诊断可以直接跑，但不要在报告里把历史版本号、检查项数量当成当前健康结论。

## WAL 与存储

- `-wal` 文件大不等于故障：WAL 会在 checkpoint 后回落。
- 只读检查存在性、大小、最近修改时间；不要因为「看起来很大」就自动 checkpoint、VACUUM 或删除。
- checkpoint / VACUUM 前必须确认：目标数据库绝对路径、可恢复点、预计锁行为、停止条件。
- 执行期间避免并发写入；结束后回读 `status` 与 `doctor`，确认数据可访问。
- 不把 `MEMORIX_DATA_DIR` 指向项目 `.memorix/`；项目内只保留 `.memorix/hooks.json` 与 `.memorix/golden-set/`。
- 不手工编辑 SQLite 文件，不用 `rm` 处理 `-wal` / `-shm`。

`memorix checkpoint` 与 `memorix repair` 属于修复面：默认不执行，先读 `--help`，展示动作与影响，再取授权。

## CodeGraph

- 代码结构问题先用项目 CodeGraph 索引回答；Memory Autopilot 只提供历史与 freshness 提示。
- CodeGraph 缺失或 stale 时可以只读报告，不自动 refresh。
- 刷新、重建或修索引前确认：目标项目、索引位置、预计耗时、是否影响并发查询。
- 不把 CodeGraph 事实与普通 observation 混为同一来源；引用时标注来源类型。

## Dashboard

- 按需启动，不做常驻自动启动。
- 启动前读 `memorix dashboard --help`，展示选定端口、监听范围与停止方式，取得授权。
- 启动后验证可访问性，并记录端口与进程标识。
- 结束任务时按用户要求关闭；不遗留未说明的后台进程。
- 需要长期后台服务时，改用官方 `background` 命令族并说明其生命周期，不把 dashboard 当服务用。

## 修复边界

| 动作                         | 默认 | 授权要求                           |
| :--------------------------- | :--- | :--------------------------------- |
| 读取 status / doctor / audit | 自动 | 无                                 |
| CodeGraph 查询               | 自动 | 无                                 |
| CodeGraph refresh / 重建     | 禁止 | 展示目标与耗时后确认               |
| WAL checkpoint               | 禁止 | 展示库文件、锁行为、停止条件后确认 |
| VACUUM                       | 禁止 | 展示可恢复点与影响后确认           |
| `memorix repair`             | 禁止 | 精确动作级确认                     |
| dashboard 启动               | 禁止 | 每次启动确认，并记录停止方式       |
| 删除 `-wal` / `-shm` 或主库  | 禁止 | 视为数据丢失风险，原则上不执行     |

## 失败分支

| 现象                    | 先查                                          |
| :---------------------- | :-------------------------------------------- |
| `doctor` 报项目身份异常 | 当前目录是否在预期 git 仓库内、绑定是否被覆盖 |
| 数据库不可访问          | 权限、路径、是否被其他进程占用                |
| CodeGraph 查询为空      | 索引是否存在、是否 stale、项目根是否正确      |
| dashboard 端口被占用    | 先停旧进程或换端口，不静默起第二个            |
| WAL 持续增长            | 检查长事务与并发写入，不要直接删 WAL 文件     |

任何修复动作完成后都要回读验证；无法验证就标为未完成，不写「应该已修复」。
