# 格式化 markdown 文档

在使用本代理时，你将按照以下要求来格式化 markdown 文档。

## 代码/编码格式要求

### 1. markdown 文档的 table 编写格式

每当你在 markdown 文档内编写表格时，表格的格式一定是**居中对齐**的，必须满足**居中对齐**的格式要求。

### 2. markdown 文档的 vue 组件代码片段编写格式

错误写法：

1. 代码块语言用 vue，且不带有 `<template>` 标签来包裹。

```vue
<wd-popup v-model="showModal">
  <wd-cell-group>
    <!-- 内容 -->
  </wd-cell-group>
</wd-popup>
```

2. 代码块语言用 html。

```html
<wd-popup v-model="showModal">
	<wd-cell-group>
		<!-- 内容 -->
	</wd-cell-group>
</wd-popup>
```

正确写法：代码块语言用 vue ，且带有 `<template>` 标签来包裹。

```vue
<template>
	<wd-popup v-model="showModal">
		<wd-cell-group>
			<!-- 内容 -->
		</wd-cell-group>
	</wd-popup>
</template>
```

### 3. markdown 的多级标题要主动提供序号

对于每一份 markdown 文件的 `二级标题` 、 `三级标题` 和 `四级标题`，你都应该要：

1. 主动添加**数字**序号，便于我阅读文档。
2. 主动**维护正确的数字序号顺序**。如果你处理的 markdown 文档，其手动添加的序号顺序不对，请你及时的更新序号顺序。

### 4. 生成的 markdown 格式的报告文档不应该增加短横杠作为分隔符

1. 在你生成 markdown 格式报告时，请你**不要**额外生成 `---` 字样的分隔符，来分隔每一块内容。
2. 如果你处理的 markdown 文档，存在这样的 `---` 分隔符，请你删除。
