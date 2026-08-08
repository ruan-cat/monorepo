# 插件市场变更加固

当经验涉及 AI 插件市场时，先建立“客户端 → marketplace → plugin manifest → 已发布组件 → 安装文档 → 验证命令”的映射。共享 skills 可以复用，但必须按目标客户端 schema 声明；禁止把一个客户端专属的 hooks、commands、agents 或相对路径假设复制到另一个客户端。

## 同步范围

规则写入时必须同时覆盖维护入口和用户入口：市场与 manifest、各平台 README、总览文档、CHANGELOG，以及后续发版 skill 的同步清单。

## 验证边界

- 区分静态 JSON/schema 校验与真实 CLI 安装；前者通过不代表后者可用。
- 若为测试临时安装 marketplace 或插件，完成条件必须包含对应的 remove 命令和无残留检查。
- 安装路径、命令和示例以目标客户端的用户可见目录为准，不引用 monorepo 内部开发路径。
