# useAxios 的包装函数

useAxiosWrapper，该函数旨在于实现 useAxios 的封装。使用方式如下：

## 准备接口返回数据的类型

接口请求返回类型，通常是一个泛型，请根据你的业务场景准备好类似于下面的类型：

::: details

@[code](./tests/types/ApifoxModel.ts)

:::

## 准备简单的 axios 请求实例

createAxiosInstance
