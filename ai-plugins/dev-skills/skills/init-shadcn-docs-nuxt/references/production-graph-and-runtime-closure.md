# 生产构建图与运行时闭包

这是生产构建、产物启动与部署验收的现行参考。先定位**第一个失败门**，不要用后续阶段的 workaround 覆盖前一阶段的证据。

## 首个失败门生命周期

| 首个失败门         | 必须取得的证据                        | 不能据此推断                         | 通过条件                             |
| ------------------ | ------------------------------------- | ------------------------------------ | ------------------------------------ |
| fresh install      | 实际解析树与锁文件                    | 源码能运行就代表部署闭包完整         | 解析版本和部署包 manifest 可解释     |
| Vite SSR transform | 首个导入错误与导入方                  | Nitro inline 或 trace 已经修复该错误 | 仅将命中的模块纳入 Vite SSR 处理     |
| Nitro Rollup       | server bundle 的首个缺包或打包错误    | Vite 配置会自动改变 Nitro bundle     | 精准 inline 后 bundle 可生成         |
| final Nitro OOM    | 峰值堆、工作集、阶段产物和退出码      | 版本或 alias 一定是根因              | 在已测预算内完成，或以测量数据缩小图 |
| artifact startup   | `.output` 的 server 入口可启动        | build 退出码为零就代表可服务         | 进程存活并接受本地请求               |
| HTTP smoke         | 关键页面与 Content API 的状态、响应体 | 首页一次 `200` 即代表全部运行时可用  | 关键请求均符合预期                   |
| 部署               | 部署环境的构建、启动与请求证据        | 本地成功可替代部署验收               | 部署产物和请求均通过                 |

## 构建图放大器

source alias 会改变模块从何处解析；宽 externalization 会把原应由当前阶段处理的依赖推给后续阶段。二者叠加时，原本单个包的缺口会沿着 workspace 源码、SSR transform、bundle 与部署产物连续放大。

排查时先记录首个导入方、解析后的目标和首个失败阶段。不要把 alias 当成通用依赖修复，也不要把整棵 UI 依赖树加入 externalization 或 `noExternal` 来掩盖缺口。

## `noExternal`、`inline` 与追踪的独立准入

| 配置                     | 所在阶段              | 准入证据                                                                      | 不可替代的边界                                                      | 删除条件                                                             |
| ------------------------ | --------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `vite.ssr.noExternal`    | Vite SSR transform    | exact error 指向某个被外部化模块，且该模块在 Vite SSR transform 首先失败      | 不能替代 Nitro Rollup 的 inline 或部署追踪                          | 该模块不再由 Vite SSR transform 触发 exact error，或已改为可解析入口 |
| `nitro.externals.inline` | Nitro Rollup 独立阶段 | exact error 在 Nitro Rollup 阶段可复现，且命中的模块需要随 server bundle 打入 | 不能替代已经发生的 Vite SSR transform、trace 或部署包 manifest 错误 | 命中的模块不再触发 Nitro Rollup 的 exact error，或精准 bundle 已闭合 |
| `nitro.externals.trace`  | 运行时依赖追踪        | 产物 manifest 与部署缺包证据说明追踪缺口                                      | 不能替代 alias、Vite transform 或 inline                            | 正常 trace 已收集到必需运行时文件                                    |
| 部署包 manifest          | 依赖声明与安装        | 实际部署包直接消费该依赖                                                      | 不能由根目录、别的 workspace 包或临时 wrapper 代替                  | 声明与实际消费已一致                                                 |

`noExternal` 的删除条件必须与命中的模块绑定：Vite SSR transform 不再出现该模块的 exact error，或该模块已改为可解析入口时，移除该条精准配置。

`nitro.externals.inline` 的删除条件同样与命中的模块绑定：Nitro Rollup 独立阶段不再出现该模块的 exact error，或部署包 manifest 和精准 bundle 已闭合时，移除该条 inline 配置。

## 实际部署包 manifest 优先

先检查真正构建并部署的文档包 `package.json`、锁文件和解析树。运行时直接消费的包应由该部署包显式声明；根目录提升、其他 workspace 包的传递依赖、开发环境碰巧可解析，都不是生产闭包证据。

将观察到的首个错误与三项资料对应：导入方、实际部署包 manifest、最终产物 manifest。三者不能对应时，先修声明或解析图，不要扩大配置白名单。

## Element Plus / Popper 的精确条件

下列四个前提必须同时满足，才可以为部署文档包加入 Popper alias：

1. 由 `element-plus` importer 发起的运行时在该部署文档包实际产物中报告 `ERR_MODULE_NOT_FOUND`；必须启动 `.output` server 后发送 HTTP request（HTTP 请求）重现该错误。
2. 该部署文档包 manifest 直接声明并消费 `element-plus`，不是由其他包偶然提升得到。
3. fresh install 后，解析图仍明确把 `@popperjs/core` 的入口缺口定位为该错误链的一部分。
4. alias 后需同时通过产物入口检查、`.output` 启动与 HTTP smoke；仅让构建结束不算通过。

满足前提时，部署文档包的精确 JSON 为：

```json
{
	"dependencies": {
		"@popperjs/core": "npm:@sxzz/popperjs-es@^2.11.7"
	}
}
```

这是特定部署错误的闭包修正，不是模板依赖、通用 UI 依赖树规则或无条件 alias。任何一个前提不成立，都先继续定位首个失败门。

fresh install 后依次验证：实际解析到的 alias、最终 server bundle 的模块入口、`.output` 启动，以及关键路由的 HTTP smoke。若 alias 只改变本地解析而未进入最终 artifact，应撤回该结论并检查 manifest 与 trace。

## Node heap 是测量预算

`--max-old-space-size` 只是可观测的堆预算，不是版本失配、缺包或错误 externalization 的修复。发生 final Nitro OOM 时，记录命令、堆上限、峰值工作集、CPU、日志更新时间、阶段产物和退出码；在相同输入下比较，而不是无限增加预算。

只有在确认为资源瓶颈后，才提高预算或缩小构建图。提高预算后仍在同一阶段失败，应回到首个失败门重新判断。

## 临时 wrapper 的退出条件

临时 wrapper 只能用于隔离一个可复现的加载或打包假设，不能成为常驻生产链路。它必须有明确入口、精确失败条件和一次性验证命令。

满足任一条件即退出并删除 wrapper：

- 实际部署包 manifest 与解析图已修正；
- Vite SSR transform、Nitro Rollup 或 trace 的首个错误已由所属阶段处理；
- artifact startup 与 HTTP smoke 已能在没有 wrapper 时通过；
- wrapper 只是把错误延后到下一个生命周期门。

## Turbo 的 inputs、outputs、cache 与并发门

为构建任务声明完整的 inputs：源码、配置、部署包 manifest、锁文件和影响产物解析的环境输入。outputs 必须包含可验收的 `.output`，而不是只记录中间目录。cache 命中只说明任务键相同，不说明运行时闭包可信。

缓存可信度门：只有诊断 cache 可信度或 cache/artifact 证据冲突时，才执行 `turbo run <task> --force`；常规生产验证不执行该命令。在该诊断条件下，检查 `.output` 是否新鲜且可启动，再执行 HTTP smoke。随后才可比较非强制运行的 cache 命中；若缺少产物、产物时间不一致、启动失败或 HTTP smoke 失败，cache 结论无效。

并发门：只有各任务的 inputs、outputs 和端口/产物目录互不冲突时才能并行。首个闭包失败、final Nitro OOM 或 cache 不可信时，先单任务串行复现，再恢复并发。

## `.output` 启动、HTTP 与部署验证矩阵

| 验证层     | 操作                                | 必须记录的结果               | 不能替代                   |
| ---------- | ----------------------------------- | ---------------------------- | -------------------------- |
| 安装       | fresh install 并检查解析树          | 直接依赖、alias 和锁定版本   | 开发服务器历史状态         |
| 构建       | 生成 `.output`                      | 退出码、产物入口和首个失败门 | 仅 TypeScript 或 lint 通过 |
| 启动       | 启动 `.output` server               | PID、监听状态与启动日志      | build 成功                 |
| HTTP smoke | 请求关键页面和 Content API          | 状态码、非空响应与控制台错误 | 首页单次 `200`             |
| 部署       | 部署环境重复构建、启动和 HTTP smoke | 部署 artifact 与请求证据     | 本地 artifact 证据         |

通过矩阵后，才可以把 runtime closure 视为已验证；任一门失败都回到该门，而不是跨阶段追加宽配置。
