---
order: 10
dir:
  collapsible: false
  link: true
  order: 10
---

# useAxios 的包装函数

useAxiosWrapper，该函数旨在于实现 useAxios 的封装。

## 安装依赖

```bash
pnpm i -P @vueuse/integrations axios
```

## 准备接口返回数据的类型

接口请求返回类型，通常是一个泛型，请根据你的业务场景准备好类似于下面的类型：

::: details

<<< ./tests/types/ApifoxModel.ts

:::

## 准备简单的 axios 请求实例

这里的本质是为了准备一个拦截器内没有解包 data 的 axios 实例，因为 useAxios 默认帮我们完成 axios 的 data 解包了。

比如以下的简单实例：

::: details

<<< ./tests/createAxiosInstance.ts

:::

## 基于项目二次封装 useAxiosWrapper 函数

::: details

<<< ./tests/projectRequest.ts

:::

## 定义接口

如下：

::: details

<<< ./tests/homeCategoryHead.ts

:::

## 使用接口

如下：

::: details

<<< ./tests/homeCategoryHead.test.ts

:::
