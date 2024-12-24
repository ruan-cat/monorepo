// vitest.config.ts
import { defineConfig } from "file:///E:/code/rzn/github-desktop-store/vercel-monorepo-test/node_modules/.pnpm/vitest@2.1.8_@edge-runtime+vm@3.2.0_@types+node@20.17.10_@vitest+ui@2.1.8_sass-embedded@1.83.0_sass@1.83.0_terser@5.37.0/node_modules/vitest/dist/config.js";
var vitest_config_default = defineConfig({
  plugins: [
    // 放弃在vitest内使用路径别名 跳过
    /**
     * 用于解决 vitest 测试用例的路径别名问题
     * @see https://cn.vitest.dev/guide/common-errors.html#cannot-find-module-relative-path
     */
    // tsconfigPaths({
    // 	projects: ["./tsconfig.test.json"],
    // }),
    // tsconfigPaths(),
    // tsAlias({
    // 	tsConfigName: "./tsconfig.test.json",
    // }),
  ],
  test: {
    reporters: ["html"],
    outputFile: "./.vitest-reporter-html/index.html"
    // 放弃在测试用例中使用别名 这些配置都无效
    // alias: {
    // 	"@utils": resolve(__dirname, "packages/utils/src/index.ts"),
    // 	"@utils-tests": resolve(__dirname, "./packages/utils/tests"),
    // },
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXGNvZGVcXFxccnpuXFxcXGdpdGh1Yi1kZXNrdG9wLXN0b3JlXFxcXHZlcmNlbC1tb25vcmVwby10ZXN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxjb2RlXFxcXHJ6blxcXFxnaXRodWItZGVza3RvcC1zdG9yZVxcXFx2ZXJjZWwtbW9ub3JlcG8tdGVzdFxcXFx2aXRlc3QuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9jb2RlL3J6bi9naXRodWItZGVza3RvcC1zdG9yZS92ZXJjZWwtbW9ub3JlcG8tdGVzdC92aXRlc3QuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVzdC9jb25maWdcIjtcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuXHRwbHVnaW5zOiBbXG5cdFx0Ly8gXHU2NTNFXHU1RjAzXHU1NzI4dml0ZXN0XHU1MTg1XHU0RjdGXHU3NTI4XHU4REVGXHU1Rjg0XHU1MjJCXHU1NDBEIFx1OERGM1x1OEZDN1xuXHRcdC8qKlxuXHRcdCAqIFx1NzUyOFx1NEU4RVx1ODlFM1x1NTFCMyB2aXRlc3QgXHU2RDRCXHU4QkQ1XHU3NTI4XHU0RjhCXHU3Njg0XHU4REVGXHU1Rjg0XHU1MjJCXHU1NDBEXHU5NUVFXHU5ODk4XG5cdFx0ICogQHNlZSBodHRwczovL2NuLnZpdGVzdC5kZXYvZ3VpZGUvY29tbW9uLWVycm9ycy5odG1sI2Nhbm5vdC1maW5kLW1vZHVsZS1yZWxhdGl2ZS1wYXRoXG5cdFx0ICovXG5cdFx0Ly8gdHNjb25maWdQYXRocyh7XG5cdFx0Ly8gXHRwcm9qZWN0czogW1wiLi90c2NvbmZpZy50ZXN0Lmpzb25cIl0sXG5cdFx0Ly8gfSksXG5cdFx0Ly8gdHNjb25maWdQYXRocygpLFxuXHRcdC8vIHRzQWxpYXMoe1xuXHRcdC8vIFx0dHNDb25maWdOYW1lOiBcIi4vdHNjb25maWcudGVzdC5qc29uXCIsXG5cdFx0Ly8gfSksXG5cdF0sXG5cblx0dGVzdDoge1xuXHRcdHJlcG9ydGVyczogW1wiaHRtbFwiXSxcblx0XHRvdXRwdXRGaWxlOiBcIi4vLnZpdGVzdC1yZXBvcnRlci1odG1sL2luZGV4Lmh0bWxcIixcblx0XHQvLyBcdTY1M0VcdTVGMDNcdTU3MjhcdTZENEJcdThCRDVcdTc1MjhcdTRGOEJcdTRFMkRcdTRGN0ZcdTc1MjhcdTUyMkJcdTU0MEQgXHU4RkQ5XHU0RTlCXHU5MTREXHU3RjZFXHU5MEZEXHU2NUUwXHU2NTQ4XG5cdFx0Ly8gYWxpYXM6IHtcblx0XHQvLyBcdFwiQHV0aWxzXCI6IHJlc29sdmUoX19kaXJuYW1lLCBcInBhY2thZ2VzL3V0aWxzL3NyYy9pbmRleC50c1wiKSxcblx0XHQvLyBcdFwiQHV0aWxzLXRlc3RzXCI6IHJlc29sdmUoX19kaXJuYW1lLCBcIi4vcGFja2FnZXMvdXRpbHMvdGVzdHNcIiksXG5cdFx0Ly8gfSxcblx0fSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUErVixTQUFTLG9CQUFvQjtBQUU1WCxJQUFPLHdCQUFRLGFBQWE7QUFBQSxFQUMzQixTQUFTO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFhVDtBQUFBLEVBRUEsTUFBTTtBQUFBLElBQ0wsV0FBVyxDQUFDLE1BQU07QUFBQSxJQUNsQixZQUFZO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTWI7QUFDRCxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
