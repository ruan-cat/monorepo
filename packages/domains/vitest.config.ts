import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "domains",
		include: ["src/tests/**/*.test.ts"],
		environment: "node",
	},
});
