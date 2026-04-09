// bump.config.ts
import { defineConfig } from "bumpp";

/**
 * @see https://github.com/antfu-collective/bumpp
 */
export default defineConfig({
	// 不生成提交信息
	// commit: false,
	commit: "📢 publish(root): release v%s",
	tag: "v%s",
	// 尝试不生成 tag
	// tag: false,
	// 不推送到远程仓库，由 release 流程最后统一 git push --follow-tags
	push: false,
	// 在执行完 bumpp 后执行本地的更新日志生成命令
	execute: "pnpm run changelog:conventional-changelog",
	// 将暂存区的全部文件都提交
	all: true,
});
