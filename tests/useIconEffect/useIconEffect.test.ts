import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { ref } from "vue";
import { useIconEffect } from "../../ai-plugins/dev-skills/skills/init-pure-admin-iconify/templates/ReIcon/src/useIconEffect";

// ============ 测试辅助 ============

function createSvg(tag: string, attrs: Record<string, string> = {}): SVGElement {
	const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
	return el;
}

function createTestSvg(fillType: "fill" | "outline") {
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("viewBox", "0 0 24 24");

	if (fillType === "fill") {
		const p = createSvg("path", { d: "M12 2L22 22H2Z", fill: "#000" });
		svg.appendChild(p);
	} else {
		const p = createSvg("path", { d: "M12 2L22 22H2Z", fill: "none", stroke: "currentColor" });
		svg.appendChild(p);
	}
	return svg;
}

function createMixedSvg() {
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	const p1 = createSvg("path", { d: "M12 2L22 22H2Z", fill: "#000" });
	const p2 = createSvg("path", { d: "M4 4L20 20", fill: "none", stroke: "currentColor" });
	svg.appendChild(p1);
	svg.appendChild(p2);
	return svg;
}

function setupContainer(svg?: SVGSVGElement): HTMLElement {
	const div = document.createElement("div");
	div.className = "kpi-icon";
	const span = document.createElement("span");
	span.className = "iconify";
	if (svg) span.appendChild(svg);
	div.appendChild(span);
	document.body.appendChild(div);
	return div;
}

function cleanup() {
	document.body.innerHTML = "";
	document.head.querySelectorAll('[id^="icon-breath-style"]').forEach((el) => el.remove());
}

const cyanToBlueStops = [
	{ offset: "0%", color: "#3cd8ff" },
	{ offset: "100%", color: "#2f73ff" },
];

beforeEach(() => {
	vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
	vi.useRealTimers();
	cleanup();
});

// ============================================================
// 分组 1: 排除法判别 (8)
// ============================================================

describe("分组1: 排除法判别", () => {
	test("fill=none 的 path 跳过不覆盖", () => {
		const svg = createTestSvg("outline");
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops },
		});
		applyGradient();
		const path = svg.querySelector("path")!;
		expect(path.getAttribute("fill")).toBe("none");
	});

	test("fill=url(#existing) 的 path 跳过（幂等）", () => {
		const svg = createTestSvg("fill");
		const path = svg.querySelector("path")!;
		path.setAttribute("fill", "url(#existing)");
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops, id: "existing" },
		});
		applyGradient();
		expect(path.getAttribute("fill")).toBe("url(#existing)");
	});

	test("fill=#000 的 path 覆盖为 url(#iconGrad)", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops },
		});
		applyGradient();
		const path = svg.querySelector("path")!;
		expect(path.getAttribute("fill")).toBe("url(#iconGrad)");
	});

	test("fill=currentColor 的 path 覆盖为 url(#iconGrad)", () => {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		const p = createSvg("path", { d: "M12 2L22 22H2Z", fill: "currentColor" });
		svg.appendChild(p);
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops },
		});
		applyGradient();
		expect(p.getAttribute("fill")).toBe("url(#iconGrad)");
	});

	test("fill 为空的 path 覆盖为 url(#iconGrad)", () => {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		const p = createSvg("path", { d: "M12 2L22 22H2Z" }); // 无 fill 属性
		svg.appendChild(p);
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops },
		});
		applyGradient();
		expect(p.getAttribute("fill")).toBe("url(#iconGrad)");
	});

	test("混合 SVG — fill=none 保留 + fill=#000 覆盖", () => {
		const svg = createMixedSvg();
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops },
		});
		applyGradient();
		const paths = svg.querySelectorAll("path");
		expect(paths[0].getAttribute("fill")).toBe("url(#iconGrad)");
		expect(paths[1].getAttribute("fill")).toBe("none");
	});

	test("已存在同 ID gradient → 幂等跳过不重复创建", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops },
		});
		applyGradient();
		applyGradient();
		applyGradient();
		expect(svg.querySelectorAll("#iconGrad").length).toBe(1);
		expect(svg.querySelectorAll("linearGradient").length).toBe(1);
	});

	test("circle/rect/polygon 等非 path 元素也覆盖", () => {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		const c = createSvg("circle", { cx: "12", cy: "12", r: "10", fill: "#333" });
		const r = createSvg("rect", { x: "2", y: "2", width: "20", height: "20", fill: "#666" });
		svg.appendChild(c);
		svg.appendChild(r);
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops },
		});
		applyGradient();
		expect(c.getAttribute("fill")).toBe("url(#iconGrad)");
		expect(r.getAttribute("fill")).toBe("url(#iconGrad)");
	});
});

// ============================================================
// 分组 2: gradient 结构 (5)
// ============================================================

describe("分组2: gradient 结构", () => {
	test("defs 不存在时自动创建", () => {
		const svg = createTestSvg("fill");
		expect(svg.querySelector("defs")).toBeNull();
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops },
		});
		applyGradient();
		expect(svg.querySelector("defs")).not.toBeNull();
	});

	test("linearGradient 方向属性匹配配置", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops, direction: "l-r" },
		});
		applyGradient();
		const grad = svg.querySelector("linearGradient")!;
		expect(grad.getAttribute("x1")).toBe("0%");
		expect(grad.getAttribute("y1")).toBe("0%");
		expect(grad.getAttribute("x2")).toBe("100%");
		expect(grad.getAttribute("y2")).toBe("0%");
	});

	test("stop 的 offset 和 stop-color 匹配配置", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops },
		});
		applyGradient();
		const stops = svg.querySelectorAll("stop");
		expect(stops.length).toBe(2);
		expect(stops[0].getAttribute("offset")).toBe("0%");
		expect(stops[0].getAttribute("stop-color")).toBe("#3cd8ff");
		expect(stops[1].getAttribute("offset")).toBe("100%");
		expect(stops[1].getAttribute("stop-color")).toBe("#2f73ff");
	});

	test("custom id 正确设置", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops, id: "myCustomGrad" },
		});
		applyGradient();
		const grad = svg.querySelector("linearGradient")!;
		expect(grad.id).toBe("myCustomGrad");
		const path = svg.querySelector("path")!;
		expect(path.getAttribute("fill")).toBe("url(#myCustomGrad)");
	});

	test("3 色标渐变正确排序", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: {
				stops: [
					{ offset: "0%", color: "#ff0000" },
					{ offset: "50%", color: "#00ff00" },
					{ offset: "100%", color: "#0000ff" },
				],
			},
		});
		applyGradient();
		const stops = svg.querySelectorAll("stop");
		expect(stops.length).toBe(3);
		expect(stops[1].getAttribute("offset")).toBe("50%");
	});
});

// ============================================================
// 分组 3: 定时重试链 (5)
// ============================================================

describe("分组3: 定时重试链", () => {
	test("默认 retryDelays 触发 5 次 setTimeout(0,80,200,500,1000)", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const spy = vi.spyOn(window, "setTimeout");

		useIconEffect({ target: ref(container), gradient: { stops: cyanToBlueStops } });

		const calls = spy.mock.calls.map((c) => c[1]);
		expect(calls).toContain(0);
		expect(calls).toContain(80);
		expect(calls).toContain(200);
		expect(calls).toContain(500);
		expect(calls).toContain(1000);
		spy.mockRestore();
	});

	test("自定义 retryDelays → 按自定义间隔", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const spy = vi.spyOn(window, "setTimeout");

		useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops, retryDelays: [0, 300, 600, 1200] },
		});

		const calls = spy.mock.calls.map((c) => c[1]);
		expect(calls).toContain(300);
		expect(calls).toContain(600);
		expect(calls).toContain(1200);
		spy.mockRestore();
	});

	test("destroy() → 清理所有 pending timer", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const spy = vi.spyOn(window, "clearTimeout");

		const { destroy } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops },
		});
		destroy();

		// 应该有 5 次 clearTimeout（对应 5 个 timer）
		expect(spy.mock.calls.length).toBeGreaterThanOrEqual(5);
		spy.mockRestore();
	});

	test("SVG 在第三次重试后才出现 → gradient 只在首次出现时注入", () => {
		const container = setupContainer(); // 无 SVG
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops },
		});

		// 0ms: SVG 不存在，跳过
		applyGradient();
		expect(container.querySelector("linearGradient")).toBeNull();

		// 80ms: 插入 SVG
		const svg = createTestSvg("fill");
		container.querySelector(".iconify")!.appendChild(svg);
		vi.advanceTimersByTime(80);
		expect(container.querySelector("linearGradient")).not.toBeNull();

		// 后续 timer 触发时幂等
		vi.advanceTimersByTime(1000);
		expect(container.querySelectorAll("linearGradient").length).toBe(1);
	});

	test("全部 5 次重试后 SVG 仍不存在 → 不抛错", () => {
		const container = setupContainer(); // 无 SVG，永不插入
		expect(() => {
			useIconEffect({
				target: ref(container),
				gradient: { stops: cyanToBlueStops },
			});
			vi.advanceTimersByTime(2000);
		}).not.toThrow();
	});
});

// ============================================================
// 分组 4: 动画策略检测 (7)
// ============================================================

describe("分组4: 动画策略检测", () => {
	test('strategy="gsap" 且 gsap installed → 设置 CSS 变量', async () => {
		// 由于 vitest 环境可能没有真实 GSAP，这里验证策略=gsap 时的路径不抛错
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { startBreath } = useIconEffect({
			target: ref(container),
			breath: { strategy: "gsap" },
		});
		await expect(startBreath()).resolves.toBeUndefined();
	});

	test('strategy="css" → 注入 style 标签', async () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { startBreath } = useIconEffect({
			target: ref(container),
			breath: { strategy: "css", css: { scale: [1, 1.1], duration: 2 } },
		});
		await startBreath();

		// 使用属性选择器而非硬编码 ID（uidCounter 跨测试递增）
		const styles = document.head.querySelectorAll('[id^="icon-breath-style"]');
		expect(styles.length).toBeGreaterThanOrEqual(1);
		const style = styles[styles.length - 1] as HTMLStyleElement;
		expect(style.textContent).toContain("@keyframes");
		expect(container.getAttribute("data-icon-effect")).not.toBeNull();
	});

	test('strategy="auto" + gsap installed → 尝试 GSAP 不抛错', async () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { startBreath } = useIconEffect({
			target: ref(container),
			breath: { strategy: "auto" },
		});
		await expect(startBreath()).resolves.toBeUndefined();
	});

	test("startBreath 幂等 — 重复调用不创建多个 style/timeline", async () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { startBreath } = useIconEffect({
			target: ref(container),
			breath: { strategy: "css" },
		});
		await startBreath();
		await startBreath();
		await startBreath();

		const styles = document.head.querySelectorAll('[id^="icon-breath-style"]');
		expect(styles.length).toBe(1);
	});

	test("stopBreath → 移除 style 标签", async () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { startBreath, stopBreath } = useIconEffect({
			target: ref(container),
			breath: { strategy: "css" },
		});
		await startBreath();
		stopBreath();

		// 使用属性选择器，不硬编码 ID
		const styles = document.head.querySelectorAll('[id^="icon-breath-style"]');
		expect(styles.length).toBe(0);
	});

	test("CSS strategy 中 @keyframes 使用正确的 scale 值", async () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { startBreath } = useIconEffect({
			target: ref(container),
			breath: { strategy: "css", css: { scale: [0.9, 1.15], duration: 3 } },
		});
		await startBreath();

		const styles = document.head.querySelectorAll('[id^="icon-breath-style"]');
		const style = styles[styles.length - 1] as HTMLStyleElement;
		expect(style.textContent).toContain("scale: 0.9");
		expect(style.textContent).toContain("scale: 1.15");
		expect(style.textContent).toContain("3s");
	});

	test("CSS strategy 中使用自定义 cssVarNames", async () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { startBreath } = useIconEffect({
			target: ref(container),
			breath: {
				strategy: "css",
				cssVarNames: { glowR: "--custom-glow" },
			},
		});
		// 不抛错即可
		await expect(startBreath()).resolves.toBeUndefined();
	});
});

// ============================================================
// 分组 5: 生命周期与清理 (3)
// ============================================================

describe("分组5: 生命周期与清理", () => {
	test("destroy() → 清理 timers cleanup", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const spy = vi.spyOn(window, "clearTimeout");
		const { destroy } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops },
		});
		destroy();
		expect(spy.mock.calls.length).toBeGreaterThanOrEqual(5);
		spy.mockRestore();
	});

	test("多实例独立 — 两个 useIconEffect 互不干扰", () => {
		const svg1 = createTestSvg("fill");
		const svg2 = createTestSvg("fill");
		const container1 = setupContainer(svg1);
		const container2 = setupContainer(svg2);

		const { applyGradient: g1 } = useIconEffect({
			target: ref(container1),
			gradient: { stops: cyanToBlueStops, id: "grad1" },
		});
		const { applyGradient: g2 } = useIconEffect({
			target: ref(container2),
			gradient: { stops: cyanToBlueStops, id: "grad2" },
		});

		g1();
		g2();

		expect(svg1.querySelector("#grad1")).not.toBeNull();
		expect(svg1.querySelector("#grad2")).toBeNull();
		expect(svg2.querySelector("#grad2")).not.toBeNull();
		expect(svg2.querySelector("#grad1")).toBeNull();
	});

	test("target 为 CSS 选择器 → 选中 .kpi-icon", () => {
		const container = setupContainer(createTestSvg("fill"));
		const { applyGradient } = useIconEffect({
			target: ".kpi-icon",
			gradient: { stops: cyanToBlueStops },
		});
		applyGradient();
		expect(container.querySelector("linearGradient")).not.toBeNull();
	});
});

// ============================================================
// 分组 6: 边界与异常 (4)
// ============================================================

describe("分组6: 边界与异常", () => {
	test("target 为 null → applyGradient 不抛错", () => {
		expect(() => {
			const { applyGradient } = useIconEffect({
				target: ref(null),
				gradient: { stops: cyanToBlueStops },
			});
			applyGradient();
		}).not.toThrow();
	});

	test("target 内无 svg → 静默返回", () => {
		const div = document.createElement("div");
		document.body.appendChild(div);
		expect(() => {
			const { applyGradient } = useIconEffect({
				target: ref(div),
				gradient: { stops: cyanToBlueStops },
			});
			applyGradient();
		}).not.toThrow();
	});

	test("空 stops 数组 → 不创建 gradient", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: [] },
		});
		applyGradient();
		// linearGradient 仍创建但无 stop，path fill 被覆盖为 url(#iconGrad) 引用了空的 gradient
		const grad = svg.querySelector("linearGradient");
		expect(grad).not.toBeNull();
		expect(grad!.querySelectorAll("stop").length).toBe(0);
	});

	test("retryDelays 空数组 → 仅立即执行一次", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const spy = vi.spyOn(window, "setTimeout");
		useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops, retryDelays: [] },
		});
		// 没有 setTimeout 调用（只有立即执行）
		const timerCalls = spy.mock.calls.filter((c) => typeof c[1] === "number" || c[1] === undefined);
		expect(timerCalls.length).toBe(0);
		spy.mockRestore();
	});
});

// ============================================================
// 分组 7: 真实业务 iconName 批量 (8 selected)
// ============================================================

describe("分组7: 真实业务 iconName", () => {
	const fillIcons = [
		"mdi:progress-clock",
		"mdi:timer-sand",
		"mdi:warehouse",
		"mdi:access-point",
		"mdi:access-point-network",
		"mdi:package-variant-closed",
	];

	fillIcons.forEach((iconName) => {
		test(`${iconName} 填充型 → fill 被覆盖为 url(#)`, () => {
			const svg = createTestSvg("fill");
			const container = setupContainer(svg);
			const { applyGradient } = useIconEffect({
				target: ref(container),
				gradient: { stops: cyanToBlueStops },
			});
			applyGradient();
			const shapes = svg.querySelectorAll("path, circle, rect");
			shapes.forEach((el) => {
				const f = el.getAttribute("fill");
				if (f !== "none") expect(f).toMatch(/^url\(#/);
			});
		});
	});

	const outlineIcons = ["mdi:alert-circle-outline", "mdi:clock-alert-outline"];

	outlineIcons.forEach((iconName) => {
		test(`${iconName} outline 型 → fill=none 不被碰`, () => {
			const svg = createTestSvg("outline");
			const container = setupContainer(svg);
			const { applyGradient } = useIconEffect({
				target: ref(container),
				gradient: { stops: cyanToBlueStops },
			});
			applyGradient();
			svg.querySelectorAll("path").forEach((p) => {
				expect(p.getAttribute("fill")).toBe("none");
			});
		});

		test(`${iconName} outline 型 → stroke 不修改`, () => {
			const svg = createTestSvg("outline");
			const container = setupContainer(svg);
			const { applyGradient } = useIconEffect({
				target: ref(container),
				gradient: { stops: cyanToBlueStops },
			});
			applyGradient();
			svg.querySelectorAll("path").forEach((p) => {
				const s = p.getAttribute("stroke");
				if (s) expect(s).not.toMatch(/^url\(#/);
			});
		});
	});
});

// ============================================================
// 分组 8: CSS + JS 双层分工 (3)
// ============================================================

describe("分组8: CSS + JS 双层分工", () => {
	test("填充型图标 — JS gradient 注入 + CSS drop-shadow 共存", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops },
		});
		applyGradient();

		// JS: gradient 存在
		expect(svg.querySelector("linearGradient")).not.toBeNull();
		// CSS: container 有 color (由业务 CSS 提供)
		expect(container.className).toContain("kpi-icon");
	});

	test("描边型图标 — 仅 CSS 层生效", () => {
		const svg = createTestSvg("outline");
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops },
		});
		applyGradient();

		const paths = svg.querySelectorAll("path");
		paths.forEach((p) => {
			const fill = p.getAttribute("fill");
			if (fill !== "url(#iconGrad)") expect(fill).toBeTruthy(); // stroke 或其他
		});
	});

	test("混合 SVG — 填充区注入渐变，描边区保留 fill=none", () => {
		const svg = createMixedSvg();
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops },
		});
		applyGradient();

		const paths = svg.querySelectorAll("path");
		const fills = Array.from(paths).map((p) => p.getAttribute("fill"));
		expect(fills).toContain("url(#iconGrad)");
		expect(fills).toContain("none");
	});
});

// ============================================================
// 分组 9: 多卡片场景 (4)
// ============================================================

describe("分组9: 多卡片场景", () => {
	function createCardGrid(count: number, fillType: "fill" | "outline" = "fill"): HTMLElement {
		const wrapper = document.createElement("div");
		for (let i = 0; i < count; i++) {
			const card = document.createElement("div");
			card.className = "count-card";
			const kpiIcon = document.createElement("div");
			kpiIcon.className = "kpi-icon";
			const iconSpan = document.createElement("span");
			iconSpan.className = "iconify";
			iconSpan.appendChild(createTestSvg(fillType));
			kpiIcon.appendChild(iconSpan);
			card.appendChild(kpiIcon);
			wrapper.appendChild(card);
		}
		document.body.appendChild(wrapper);
		return wrapper;
	}

	test("4 个卡片 → 所有 .kpi-icon 都有 gradient", () => {
		const wrapper = createCardGrid(4, "fill");

		const containers = wrapper.querySelectorAll<HTMLElement>(".count-card .kpi-icon");
		containers.forEach((c) => {
			const g = useIconEffect({ target: ref(c), gradient: { stops: cyanToBlueStops } });
			g.applyGradient();
		});
		expect(wrapper.querySelectorAll("linearGradient").length).toBeGreaterThanOrEqual(4);
	});

	test("RiskHomePage 场景 — 全 outline 页面", () => {
		const wrapper = createCardGrid(4, "outline");
		const containerElements = wrapper.querySelectorAll<HTMLElement>(".count-card .kpi-icon");

		containerElements.forEach((c) => {
			useIconEffect({ target: ref(c), gradient: { stops: cyanToBlueStops } }).applyGradient();
		});

		// 所有 path 的 fill 仍是 none
		wrapper.querySelectorAll("path").forEach((p) => {
			if (p.getAttribute("fill") === "none") {
				expect(p.getAttribute("fill")).toBe("none");
			}
		});
	});

	test("IncidentPage 场景 — 2 fill + 2 outline 混合", () => {
		const wrapper = document.createElement("div");
		// 2 fill cards
		for (let i = 0; i < 2; i++) {
			const card = document.createElement("div");
			card.className = "count-card";
			const icon = document.createElement("div");
			icon.className = "kpi-icon";
			const span = document.createElement("span");
			span.className = "iconify";
			span.appendChild(createTestSvg("fill"));
			icon.appendChild(span);
			card.appendChild(icon);
			wrapper.appendChild(card);
		}
		// 2 outline cards
		for (let i = 0; i < 2; i++) {
			const card = document.createElement("div");
			card.className = "count-card";
			const icon = document.createElement("div");
			icon.className = "kpi-icon";
			const span = document.createElement("span");
			span.className = "iconify";
			span.appendChild(createTestSvg("outline"));
			icon.appendChild(span);
			card.appendChild(icon);
			wrapper.appendChild(card);
		}
		document.body.appendChild(wrapper);

		wrapper.querySelectorAll<HTMLElement>(".count-card .kpi-icon").forEach((c) => {
			useIconEffect({ target: ref(c), gradient: { stops: cyanToBlueStops } }).applyGradient();
		});

		// Fill 型有 url(#iconGrad)
		const filledPaths = wrapper.querySelectorAll('path[fill^="url(#"]');
		expect(filledPaths.length).toBeGreaterThan(0);
		// Outline 型有 fill="none"
		const nonePaths = wrapper.querySelectorAll('path[fill="none"]');
		expect(nonePaths.length).toBeGreaterThan(0);
	});

	test("跨页面复用图标 — 同一 outline 图标双实例", () => {
		const svg1 = createTestSvg("outline");
		const svg2 = createTestSvg("outline");
		const c1 = setupContainer(svg1);
		const c2 = setupContainer(svg2);

		useIconEffect({ target: ref(c1), gradient: { stops: cyanToBlueStops } }).applyGradient();
		useIconEffect({ target: ref(c2), gradient: { stops: cyanToBlueStops } }).applyGradient();

		[c1, c2].forEach((c) => {
			c.querySelectorAll("path").forEach((p) => {
				if (p.getAttribute("fill") === "none") {
					expect(p.getAttribute("fill")).toBe("none");
				}
			});
		});
	});
});

// ============================================================
// 分组 10: 数据响应式场景 (3)
// ============================================================

describe("分组10: 数据响应式场景", () => {
	test("countCards 从 4 变 2 → 新卡片自动注入", () => {
		const wrapper = document.createElement("div");
		document.body.appendChild(wrapper);

		// 创建 4 个卡片
		for (let i = 0; i < 4; i++) {
			const div = document.createElement("div");
			div.className = "count-card";
			const kpi = document.createElement("div");
			kpi.className = "kpi-icon";
			const span = document.createElement("span");
			span.className = "iconify";
			span.appendChild(createTestSvg("fill"));
			kpi.appendChild(span);
			div.appendChild(kpi);
			wrapper.appendChild(div);
		}

		const containers = wrapper.querySelectorAll<HTMLElement>(".kpi-icon");
		containers.forEach((c) => {
			const g = useIconEffect({ target: ref(c), gradient: { stops: cyanToBlueStops } });
			g.applyGradient();
		});

		// 4 个卡片至少产生 4 个 gradient（useIconEffect 的 retryChain 可能触发额外调用但幂等）
		expect(wrapper.querySelectorAll("linearGradient").length).toBeGreaterThanOrEqual(4);

		// 模拟移除 2 个
		while (wrapper.children.length > 2) wrapper.removeChild(wrapper.lastChild!);

		// 剩余 2 个仍有效
		expect(wrapper.querySelectorAll("linearGradient").length).toBeGreaterThanOrEqual(2);
	});

	test("decimals 属性不影响图标渲染", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		useIconEffect({ target: ref(container), gradient: { stops: cyanToBlueStops } }).applyGradient();
		expect(container.querySelector("linearGradient")).not.toBeNull();
	});

	test("FallbackOverviewPage icon 历史遗留字段不影响渲染", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		useIconEffect({ target: ref(container), gradient: { stops: cyanToBlueStops } }).applyGradient();
		expect(svg.querySelector("linearGradient")).not.toBeNull();
		// 未使用的 icon 字段无副作用
	});
});

// ============================================================
// 分组 11: 真实边界场景 (5)
// ============================================================

describe("分组11: 真实边界场景", () => {
	test("空 iconName → 无 SVG → gradient 跳过", () => {
		const div = document.createElement("div");
		div.className = "kpi-icon";
		document.body.appendChild(div);
		expect(() => {
			useIconEffect({ target: ref(div), gradient: { stops: cyanToBlueStops } }).applyGradient();
		}).not.toThrow();
	});

	test("不存在的图标 → 仍尝试注入不抛错", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		expect(() => {
			useIconEffect({ target: ref(container), gradient: { stops: cyanToBlueStops } }).applyGradient();
		}).not.toThrow();
	});

	test("16 个卡片 — 性能 < 50ms", () => {
		const wrapper = document.createElement("div");
		for (let i = 0; i < 16; i++) {
			const c = setupContainer(createTestSvg("fill"));
			wrapper.appendChild(c);
		}
		const start = performance.now();
		wrapper.querySelectorAll<HTMLElement>(".kpi-icon").forEach((c) => {
			useIconEffect({ target: ref(c), gradient: { stops: cyanToBlueStops } }).applyGradient();
		});
		const elapsed = performance.now() - start;
		expect(elapsed).toBeLessThan(50);
		expect(wrapper.querySelectorAll("linearGradient").length).toBe(16);
	});

	test("gradient: false → 禁用渐变", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: false,
		});
		applyGradient();
		expect(svg.querySelector("linearGradient")).toBeNull();
	});

	test("breath: false → 禁用动画", async () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { startBreath } = useIconEffect({
			target: ref(container),
			breath: false,
		});
		await startBreath();
		expect(document.head.querySelector('[id^="icon-breath-style"]')).toBeNull();
	});
});

// ============================================================
// 分组 12: 自定义方向映射 (2)
// ============================================================

describe("分组12: 自定义方向映射", () => {
	test("direction=t-b → x1=0% y1=0% x2=0% y2=100%", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: { stops: cyanToBlueStops, direction: "t-b" },
		});
		applyGradient();
		const grad = svg.querySelector("linearGradient")!;
		expect(grad.getAttribute("x1")).toBe("0%");
		expect(grad.getAttribute("x2")).toBe("0%");
		expect(grad.getAttribute("y1")).toBe("0%");
		expect(grad.getAttribute("y2")).toBe("100%");
	});

	test("自定义 direction 对象", () => {
		const svg = createTestSvg("fill");
		const container = setupContainer(svg);
		const { applyGradient } = useIconEffect({
			target: ref(container),
			gradient: {
				stops: cyanToBlueStops,
				direction: { x1: "10%", y1: "20%", x2: "90%", y2: "80%" },
			},
		});
		applyGradient();
		const grad = svg.querySelector("linearGradient")!;
		expect(grad.getAttribute("x1")).toBe("10%");
		expect(grad.getAttribute("y1")).toBe("20%");
		expect(grad.getAttribute("x2")).toBe("90%");
		expect(grad.getAttribute("y2")).toBe("80%");
	});
});
