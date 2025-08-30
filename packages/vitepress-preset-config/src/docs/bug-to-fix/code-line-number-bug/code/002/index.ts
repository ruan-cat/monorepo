import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config

import { transformerTwoslash } from "@shikijs/vitepress-twoslash";

// @ts-ignore
import { lineNumberPlugin } from "./temp-plugins/temp-lineNumberPlugin";

export default defineConfig({
	title: "My Awesome Project",
	description: "A VitePress Site",
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "Home", link: "/" },
			{ text: "Examples", link: "/markdown-examples" },
		],

		sidebar: [
			{
				text: "Examples",
				items: [
					{ text: "Markdown Examples", link: "/markdown-examples" },
					{ text: "Runtime API Examples", link: "/api-examples" },
				],
			},
		],

		socialLinks: [{ icon: "github", link: "https://github.com/vuejs/vitepress" }],
	},

	vite: {
		server: {
			open: true,
			port: 8080,
		},
	},

	markdown: {
		codeTransformers: [
			// @ts-ignore
			transformerTwoslash(),
		],

		config(md) {
			// @ts-ignore
			md.use(lineNumberPlugin, true);
		},

		// Explicitly load these languages for types hightlighting
		// languages: ["js", "jsx", "ts", "tsx"] as LanguageInput[],
	},
});
