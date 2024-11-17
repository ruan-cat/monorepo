<script setup lang="ts">

// import ComponentHelloWorld from "@/components/HelloWorld.vue";
import ShowData from "@/components/show-data.vue";

</script>

# 文档

我希望在 md 文档内，使用 vue 组件。且实现语法高亮，自动提示，类型补全。

## 目前的做法

目前来说，还是比较有效的，勉强地实现组件导入。

### tsconfig.json

```json
{
	// https://vitepress.dev/guide/using-vue#vs-code-intellisense-support
	"vueCompilerOptions": {
		"vitePressExtensions": [".md"]
	}
}
```

### .vscode\settings.json

```json
{
	/**
		尝试让volar对md也提供基础的类型支持
		https://github.com/vuejs/language-tools/tree/master/extensions/vscode#configs
		https://vitepress.dev/guide/using-vue#vs-code-intellisense-support
	*/
	"vue.server.includeLanguages": ["vue", "markdown"]
}
```

<!-- 这里勉强实现了组件导入并识别 -->

<ShowData></ShowData>

<!-- 这里的 template 无法实现识别 -->
<!-- <template>
	<ShowData></ShowData>
</template> -->
