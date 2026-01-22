# 插件市场

本仓库还作为一个 claude code 插件市场。

## 添加插件市场

运行 claude code 命令：

```bash
/plugin marketplace add ruan-cat/monorepo
```

## 安装插件

```bash
/plugin install common-tools@ruan-cat-tools
```

## 风险项

claude code 安装插件市场时，会对本仓库做一个全量的浅克隆。具体存储该插件市场的目录，会出现很多无关的文件。
