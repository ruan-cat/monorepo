export default {
	/** @see https://juejin.cn/post/7381372081915166739#heading-8 */
	"commit-msg": "pnpm commitlint",
	"pre-commit": "npx lint-staged",
	"pre-push": "pnpm run format",
};
