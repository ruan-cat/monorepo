// vitest.config.ts
import { defineConfig } from "file:///E:/code/rzn/github-desktop-store/vercel-monorepo-test/node_modules/.pnpm/vitest@2.1.8_@edge-runtime+vm@3.2.0_@types+node@20.17.10_@vitest+ui@2.1.8_sass-embedded@1.83.0_sass@1.83.0_terser@5.37.0/node_modules/vitest/dist/config.js";
var vitest_config_default = defineConfig({
  plugins: [
    // 放弃在vitest内使用路径别名
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
    // 放弃在测试用例中使用别名 这些配资都无效
    // alias: {
    // 	"@utils": resolve(__dirname, "packages/utils/src/index.ts"),
    // 	"@utils-tests": resolve(__dirname, "./packages/utils/tests"),
    // },
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXGNvZGVcXFxccnpuXFxcXGdpdGh1Yi1kZXNrdG9wLXN0b3JlXFxcXHZlcmNlbC1tb25vcmVwby10ZXN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxjb2RlXFxcXHJ6blxcXFxnaXRodWItZGVza3RvcC1zdG9yZVxcXFx2ZXJjZWwtbW9ub3JlcG8tdGVzdFxcXFx2aXRlc3QuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9jb2RlL3J6bi9naXRodWItZGVza3RvcC1zdG9yZS92ZXJjZWwtbW9ub3JlcG8tdGVzdC92aXRlc3QuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVzdC9jb25maWdcIjtcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tIFwidml0ZS10c2NvbmZpZy1wYXRoc1wiO1xuaW1wb3J0IHRzQWxpYXMgZnJvbSBcInZpdGUtcGx1Z2luLXRzLWFsaWFzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG5cdHBsdWdpbnM6IFtcblx0XHQvLyBcdTY1M0VcdTVGMDNcdTU3Mjh2aXRlc3RcdTUxODVcdTRGN0ZcdTc1MjhcdThERUZcdTVGODRcdTUyMkJcdTU0MERcblx0XHQvKipcblx0XHQgKiBcdTc1MjhcdTRFOEVcdTg5RTNcdTUxQjMgdml0ZXN0IFx1NkQ0Qlx1OEJENVx1NzUyOFx1NEY4Qlx1NzY4NFx1OERFRlx1NUY4NFx1NTIyQlx1NTQwRFx1OTVFRVx1OTg5OFxuXHRcdCAqIEBzZWUgaHR0cHM6Ly9jbi52aXRlc3QuZGV2L2d1aWRlL2NvbW1vbi1lcnJvcnMuaHRtbCNjYW5ub3QtZmluZC1tb2R1bGUtcmVsYXRpdmUtcGF0aFxuXHRcdCAqL1xuXHRcdC8vIHRzY29uZmlnUGF0aHMoe1xuXHRcdC8vIFx0cHJvamVjdHM6IFtcIi4vdHNjb25maWcudGVzdC5qc29uXCJdLFxuXHRcdC8vIH0pLFxuXHRcdC8vIHRzY29uZmlnUGF0aHMoKSxcblx0XHQvLyB0c0FsaWFzKHtcblx0XHQvLyBcdHRzQ29uZmlnTmFtZTogXCIuL3RzY29uZmlnLnRlc3QuanNvblwiLFxuXHRcdC8vIH0pLFxuXHRdLFxuXG5cdHRlc3Q6IHtcblx0XHRyZXBvcnRlcnM6IFtcImh0bWxcIl0sXG5cdFx0b3V0cHV0RmlsZTogXCIuLy52aXRlc3QtcmVwb3J0ZXItaHRtbC9pbmRleC5odG1sXCIsXG5cdFx0Ly8gXHU2NTNFXHU1RjAzXHU1NzI4XHU2RDRCXHU4QkQ1XHU3NTI4XHU0RjhCXHU0RTJEXHU0RjdGXHU3NTI4XHU1MjJCXHU1NDBEIFx1OEZEOVx1NEU5Qlx1OTE0RFx1OEQ0NFx1OTBGRFx1NjVFMFx1NjU0OFxuXHRcdC8vIGFsaWFzOiB7XG5cdFx0Ly8gXHRcIkB1dGlsc1wiOiByZXNvbHZlKF9fZGlybmFtZSwgXCJwYWNrYWdlcy91dGlscy9zcmMvaW5kZXgudHNcIiksXG5cdFx0Ly8gXHRcIkB1dGlscy10ZXN0c1wiOiByZXNvbHZlKF9fZGlybmFtZSwgXCIuL3BhY2thZ2VzL3V0aWxzL3Rlc3RzXCIpLFxuXHRcdC8vIH0sXG5cdH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBK1YsU0FBUyxvQkFBb0I7QUFLNVgsSUFBTyx3QkFBUSxhQUFhO0FBQUEsRUFDM0IsU0FBUztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBYVQ7QUFBQSxFQUVBLE1BQU07QUFBQSxJQUNMLFdBQVcsQ0FBQyxNQUFNO0FBQUEsSUFDbEIsWUFBWTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1iO0FBQ0QsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
