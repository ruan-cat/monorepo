import { defineConfig } from "vitest/config";
export default defineConfig({
	test: {
		name: "skill-router-unit",
		environment: "node",
		include: ["tests/**/*.test.ts"],
		exclude: ["tests/worker-runtime.test.ts", "tests/production-harness.test.ts"],
	},
});
