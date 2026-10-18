// 故意注入的构建失败源：用于触发 skill-router-mcp 的 Workers Builds 构建失败，
// 验证 cf-build-notifier 通知链路。语法合法（可通过 prettier/lint-staged），
// 但 rolldown 解析该不存在的模块时必然失败。验证完成后立即删除，请勿引用。
export * from "./this-module-is-intentionally-missing-for-e2e-notification-testing";
