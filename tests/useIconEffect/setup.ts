// tests/useIconEffect/setup.ts — vitest jsdom 环境配置
import { vi } from "vitest";

// jsdom 已提供 SVG DOM API (createElementNS, querySelector, getAttribute)
// 以下补充 GSAP 可能用到的 API mock

// Mock matchMedia (GSAP 可能调用)
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});
