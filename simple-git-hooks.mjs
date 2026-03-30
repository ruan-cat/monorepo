/**
 * 每次修改该文件后 务必执行一次 `npx simple-git-hooks` 命令
 * 否则这些钩子不会生效
 */
export default {
	/**
	 * @see https://juejin.cn/post/7381372081915166739#heading-8
	 * @see https://fabric.modyqyw.top/zh-Hans/guide/git/commitlint.html#%E6%95%B4%E5%90%88-simple-git-hooks
	 */
	"commit-msg": "npx --no-install commitlint --edit ${1}",
	"pre-commit": "npx lint-staged",
	// "pre-push": "pnpm run format",
	/**
	 * post-commit: 每次提交后，将本次提交涉及的文件从 index（LF）恢复到工作区。
	 * 解决 Windows 上 AI Agent（Cursor/Claude）写入文件时使用 CRLF，
	 * 导致 pre-commit/lint-staged 将 index 规范化为 LF 后，工作区仍残留 CRLF，
	 * 从而出现「幽灵 git modified」的问题。
	 * 仅恢复本次提交修改的文件，不影响其他未暂存的工作区变更。
	 */
	"post-commit":
		'COMMITTED=$(git diff HEAD~1..HEAD --diff-filter=ACMR --name-only 2>/dev/null); [ -n "$COMMITTED" ] && echo "$COMMITTED" | xargs git restore --worktree -- 2>/dev/null || true',
};
