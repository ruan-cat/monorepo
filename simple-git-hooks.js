export default {
	"pre-commit": "npx lint-staged",
	"pre-push": "pnpm run format",
};
