import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "cf-build-notifier",
		include: ["tests/**/*.test.ts"],
		environment: "node",
	},
});
