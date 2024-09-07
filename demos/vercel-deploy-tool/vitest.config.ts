import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		reporters: ["html"],
		outputFile: "./.vitest-reporter-html/index.html",
	},
});
