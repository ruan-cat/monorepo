import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "vercel-deploy-tool",
		include: ["tests/**/*.test.ts"],
		environment: "node",
	},
});
