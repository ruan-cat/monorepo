# 全局协调器模式（breath-coordinator）

`useIconEffect` 默认模式是**按组件实例独立管理动画**——每个调用创建独立的 GSAP timeline、gradient defs、retry chain。这种设计保证了组件自治和隔离性，但也带来了需要正视的代价。

## 按实例独立使用的代价

| 代价                      | 影响                                                                                 | 严重度 |
| ------------------------- | ------------------------------------------------------------------------------------ | ------ |
| **全局暂停/恢复能力丧失** | 无法一行代码暂停所有呼吸动画——需遍历所有实例逐一调用 `stopBreath()`                  | 高     |
| **动画相位漂移**          | 16 个独立 timeline 各自启动时间不同，呼吸节奏错乱，无跨卡片 stagger 效果             | 中     |
| **路由切换重建开销**      | 每个实例 4.5ms DOM 操作（gradient defs 创建） + GSAP timeline 初始化，16 实例约 72ms | 中     |
| **调试可观测性下降**      | 16 条分散 timeline vs 1 条全局 timeline，GSAP DevTools 无法统一观察                  | 低     |
| **CSS 变量作用域**        | 需确保 `cssVarNames` 在每个实例的容器作用域内生效，避免交叉污染                      | 低     |

## 全局协调器模式（推荐）

当项目存在 **4 个以上**卡片实例 / **跨页面**共享动画 / 需要**统一暂停恢复**时，必须引入全局协调器。

参考实现见 `templates/breathCoordinator.pinia.ts`（Pinia Store 版本）和 `templates/breathCoordinator.composable.ts`（纯 Composable 版本）。核心接口：

```typescript
// 协调器 API
interface BreathCoordinator {
	register(api: UseIconEffectReturn): string; // 注册实例，返回 ID
	unregister(id: string): void; // 注销实例（onUnmounted 调用）
	pauseAll(): void; // 全局暂停
	resumeAll(): void; // 全局恢复
	destroyAll(): void; // 销毁所有实例
	instanceCount: ComputedRef<number>; // 当前活跃实例数
}
```

### 使用方式

```typescript
// 组件内
import { useBreathCoordinatorStore } from "@/stores/breathCoordinator";

const coordinator = useBreathCoordinatorStore();
let id: string;

const { applyGradient, startBreath, stopBreath, destroy } = useIconEffect({...});

onMounted(() => {
  id = coordinator.register({ applyGradient, startBreath, stopBreath, destroy });
});

onUnmounted(() => {
  coordinator.unregister(id);  // destroy 已在 unregister 内部调用
});
```

```typescript
// 路由守卫中
import { useBreathCoordinatorStore } from "@/stores/breathCoordinator";

const coordinator = useBreathCoordinatorStore();
onBeforeRouteLeave(() => coordinator.pauseAll());
onActivated(() => coordinator.resumeAll());
```

## 决策树

```plain
项目中有几个 KPI 图标需要动画？
  ├─ ≤3 个 → 直接使用 useIconEffect，无需协调器
  └─ ≥4 个 → 继续判断
       ├─ 是否同页面？ → 继续判断
       │   ├─ 是，且需要 stagger 错峰效果 → useIconEffect + CSS 选择器批量目标（见 useIconEffect.md 使用示例）
       │   └─ 否，各自独立 → useIconEffect × N + 全局协调器
       └─ 是否跨页面（路由切换）？
            ├─ 是 → useIconEffect × N + 全局协调器 + KeepAlive（见下方）
            └─ 否 → useIconEffect × N + 全局协调器
```

## 与 KeepAlive 的配合

如果页面使用 `<KeepAlive>` 缓存路由，务必在以下生命周期中接入协调器：

```typescript
onDeactivated(() => coordinator.pauseAll()); // 离开时暂停
onActivated(() => coordinator.resumeAll()); // 回到页面时恢复
```

否则缓存的页面中的 GSAP timeline 会在后台持续消耗 CPU。

> **建议**：如果项目使用 `<KeepAlive>` 缓存路由页面，建议在项目层面建立 KeepAlive 生命周期治理规范，确保所有重量级组件（ECharts、GSAP、WebGL、RAF 等）在 `onDeactivated` 中 dispose、在 `onActivated` 中重建。可参考此模式在项目的 skills/AGENTS.md 中制定类似规范。
