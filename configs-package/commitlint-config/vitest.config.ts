import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "commitlint-config",
		include: ["src/tests/**/*.test.ts"],
		environment: "node",
	},
});
