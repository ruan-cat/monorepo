import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "utils",
		include: ["src/tests/**/*.test.ts"],
		environment: "node",
	},
});
