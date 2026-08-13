import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
	preset: "cloudflare_module",
	compatibilityDate: "2024-09-19",
	serverDir: "./server",
	apiBaseURL: "/",
});
