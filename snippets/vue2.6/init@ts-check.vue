<script>
// @ts-check
// 默认启用vscode提供的ts强类型检查

// 默认导入来自lodash-es提供的常用工具。 prettier忽略本行。
// prettier-ignore
import { isArray, isUndefined, isString, isNumber, isNil, isEqual, toString, merge, cloneDeep } from "lodash-es";

/**
 * $TM_FILENAME_BASE
 * @author $1
 * @description
 */
export default {
	name: "$TM_FILENAME_BASE",

	props: {},

	emits: [],

	components: {},

	/** 针对`vue2.7` `组合式api`的使用入口 仅在使用`组合式api`时才使用 */
	setup(props, { attrs, slots, emit, expose }) {
		return {};
	},

	data() {
		return {};
	},

	computed: {},

	methods: {},

	watch: {},

	/** 默认设置成异步函数 允许使用 `async/await` 的语法请求异步接口 */
	async created() {},

	async mounted() {},
};
</script>

<template>
	<section class="$TM_FILENAME_BASE-root"></section>
</template>

<!-- 组件样式一律默认使用 `scoped` 约束作用域 -->
<style lang="scss" scoped>
.$TM_FILENAME_BASE-root {
}
</style>
