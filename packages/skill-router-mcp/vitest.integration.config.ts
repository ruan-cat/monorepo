import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "skill-router-integration",
		environment: "node",
		include: ["tests/production-harness.test.ts"],
	},
});
