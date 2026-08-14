import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.toml" } })],
	test: {
		name: "skill-router-worker",
		include: ["tests/worker-runtime.test.ts"],
	},
});
