# 2025-5-23 会议材料

本次会议以培训为主。

以下内容仅为大纲，不会提供过于详细的内容。

## 参考例子

以 `apps\admin\src\pages\property-manage\community-manage\house-decoration\index.vue` 为例子。

## 表格搜索栏

- https://pure-admin.github.io/vue-pure-admin/#/form/index
- https://plus-pro-components.com/components/config.html#valuetype-可选的表单值

## 不推荐使用git graph插件来修改用户名了

git graph插件修改的用户名，是本机的全体用户名，而不是当前仓库的用户名。二者的作用域范围是不一样的。

这导致我另一个项目的提交记录，其用户名都是不对的。受到污染的。

::: details 用户名出现明显的对不上

![2025-05-23-01-49-29](https://s2.loli.net/2025/05/23/aFViHwrt8ZJ2bAu.png)

:::

我们应该使用具体的命令来实现当前git项目改名。

```bash
git config --local user.name f1-阮喵喵
```

- https://notes.ruan-cat.com/git/git-change-username.html
