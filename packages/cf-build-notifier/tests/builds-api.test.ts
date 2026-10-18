import { describe, expect, test } from "vitest";
import { extractLogTail, LOG_TAIL_LINES } from "../server/notifier/builds-api";

describe("extractLogTail", () => {
	test("空日志返回空串", () => {
		expect(extractLogTail([])).toBe("");
	});

	test("行数少于上限时全部保留", () => {
		const lines = ["a", "b", "c"];
		expect(extractLogTail(lines, 10)).toBe("a\nb\nc");
	});

	test("行数超出上限时只保留尾部并标注省略数", () => {
		const lines = Array.from({ length: 60 }, (_, i) => `line-${i + 1}`);
		const result = extractLogTail(lines, 10);
		expect(result).toContain(`（前 ${60 - 10} 行已省略）`);
		expect(result).toContain("line-60");
		expect(result).toContain("line-51");
		expect(result).not.toContain("line-50\n");
	});

	test("默认上限为 LOG_TAIL_LINES 常量", () => {
		const lines = Array.from({ length: LOG_TAIL_LINES + 5 }, (_, i) => `l${i}`);
		const result = extractLogTail(lines);
		expect(result).toContain(`（前 5 行已省略）`);
		expect(result).toContain(`l${LOG_TAIL_LINES + 4}`);
	});
});
