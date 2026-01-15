// 警告 设计失误 将 `文档配置` 和 `主题配置` 共同导出时 会出现css无法识别的错误。

export * from "./config/index.ts";
export * from "./theme.ts";
export * from "./config.mts";
export * from "./types.ts";

// 主题切换器模块导出
export * from "./theme-switcher/index.ts";
