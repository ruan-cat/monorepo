# 克隆命令清单（唯一来源）

下列命令必须与仓库维护者约定保持一致；技能正文仅引用本文件，不重复维护副本。

在**目标父目录**下逐条执行（或将本文件内容复制为 shell 脚本批量执行）。  
仓库作者以 `ruan-cat` 为主，另含 `tocque/h5mota-web`。

```bash
git clone https://github.com/ruan-cat/11comm 01s-11comm
git clone https://github.com/ruan-cat/11comm-app 01s-11comm-app
git clone --depth=750 --no-single-branch https://github.com/ruan-cat/12psi.git 01s-12psi
git clone --depth=750 --no-single-branch https://github.com/ruan-cat/09oa 01s-09oa
git clone --depth=750 --no-single-branch https://github.com/ruan-cat/10wms 01s-10wms
git clone --depth=1 --no-single-branch https://github.com/ruan-cat/drill-docx drill-docx
git clone --depth=750 --no-single-branch https://github.com/ruan-cat/notes notes
git clone https://github.com/ruan-cat/monorepo monorepo
git clone --depth=1 --no-single-branch https://github.com/ruan-cat/stars-list stars-list
git clone https://github.com/ruan-cat/resume resume
git clone https://github.com/ruan-cat/learn-nitro-starter-with-vercel learn-nitro-starter-with-vercel
git clone https://github.com/ruan-cat/learn-openx-ui learn-openx-ui
git clone --depth=750 --no-single-branch https://github.com/ruan-cat/SmallAliceWeb SmallAliceWeb
git clone https://github.com/ruan-cat/gzpc-big-screen gzpc-big-screen
git clone https://github.com/ruan-cat/dfsw-assets-admin dfsw-assets-admin

git clone https://github.com/tocque/h5mota-web h5mota-web
```

## 维护约定

- 增删仓库或调整 `depth` / `no-single-branch`：只改本文件。
- `.git` 后缀：按上游 URL 习惯保留或省略，以本文件为准（如 `12psi.git`）。
