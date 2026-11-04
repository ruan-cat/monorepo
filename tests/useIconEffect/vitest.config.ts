import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "useIconEffect",
		environment: "jsdom",
		setupFiles: ["./setup.ts"],
		include: ["**/*.test.ts"],
	},
});
