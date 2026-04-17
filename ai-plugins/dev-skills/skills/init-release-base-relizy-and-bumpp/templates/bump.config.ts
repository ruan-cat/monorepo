import { execSync } from "node:child_process";
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
	// bump.config.ts 可能单独使用，也可能被串行命令复用。
	// 因此 push 策略需要在命令行里通过 --push / --no-push 显式控制，
	// 不能在配置文件里写死。
	// push: false,
	// 在执行完 bumpp 后回写根 CHANGELOG，并显式传入本次新版本号
	execute: (operation) => {
		execSync(`pnpm exec changelogen --output CHANGELOG.md -r ${operation.state.newVersion}`, {
			cwd: operation.options.cwd,
			stdio: "inherit",
		});
	},
	// 将暂存区的全部文件都提交
	all: true,
});
