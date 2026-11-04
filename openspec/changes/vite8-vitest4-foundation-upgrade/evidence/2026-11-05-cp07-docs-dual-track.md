# CP-07 文档框架兼容性决策证据（2026-11-05）

## 1. 上游版本调查（npm registry 实查）

| 框架                   | 当前锁定         | 上游 latest                 | 上游预发布              | 预发布版 vite 依赖 |
| ---------------------- | ---------------- | --------------------------- | ----------------------- | ------------------ |
| VitePress              | 1.6.4（=latest） | 1.6.4                       | 2.0.0-alpha.21（alpha） | ^8.3.4             |
| @vuepress/bundler-vite | 2.0.0-rc.20      | 2.0.0-rc.7（dist-tag 混乱） | next: rc.31             | ^8.1.5             |

- 结论：两个文档框架的 Vite 8 适配仅存在于**预发布**（alpha/rc）版本；稳定版均不支持 Vite 8。

## 2. 真实文档构建验证（当前双轨栈）

```log
$ pnpm turbo build:docs
Tasks:    11 successful, 11 total
Cached:   0 cached, 11 total
Time:     1m11.397s
WARNING   no output files found for task @test/monorepo-1#build:docs（turbo outputs glob 未覆盖其产物，非构建失败，与本升级无关）
```

- 核心轨升级 vite 8 后，文档轨（vitepress 1.6.4 + vite 5.4.21、vuepress rc.20 + vite 6.1.6）构建完全正常——双轨隔离有效。

## 3. 决策：保留双轨（tasks.md 停止条件命中）

- 停止条件原文："预发布框架引入不可接受风险时，保留双轨并结束本阶段。"
- 判定：VitePress 2 = alpha、VuePress = rc，均未稳定；10+ 主题/插件生态组合稳定性未验证 → 不可接受。
- 锁定原因、维护边界、后续收敛条件已按任务第三项补充至 `design.md`「文档栈双轨 → CP-07 决策记录」。
- 版本树可审计信号：收敛完成时 `pnpm why vite` 中 5.x/6.x 实例应消失；当前三者并存（8.3.5 / 5.4.21 / 6.1.6）为**设计内状态**，不是升级遗漏。
