import { test, expect } from "vitest";

import { pathChange } from "@ruan-cat/utils";

test("pathChange路径转换", () => {
	expect(pathChange("C:\\Users\\ruanc\\Desktop\\test\\test.ts")).toBe("C:/Users/ruanc/Desktop/test/test.ts");
	expect(pathChange("C:\\Users\\ruanc\\Desktop\\test\\test.ts")).toBe("C:/Users/ruanc/Desktop/test/test.ts");
	expect(pathChange("D:\\Projects\\my-project\\src\\index.js")).toBe("D:/Projects/my-project/src/index.js");
	expect(pathChange("E:\\dev-env\\git\\bin\\bash.exe")).toBe("E:/dev-env/git/bin/bash.exe");
	expect(pathChange("F:\\Music\\favorite\\song.mp3")).toBe("F:/Music/favorite/song.mp3");
	expect(pathChange("G:\\Photos\\vacation\\image.jpg")).toBe("G:/Photos/vacation/image.jpg");
});
