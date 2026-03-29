---
order: 8000
---

# 提示词

制作本库用到的一些提示词。仅作为阅读参考，与本库关联不大。

可以选择性的阅读。

## 001

请深度思考。
1 阅读 packages\domains\main.ts domains 变量的 notesCloudflare notesVercel notesGithubWorkflow 三个属性，并认真阅读其 jsdoc 注释。
2 阅读 packages\domains\src\domains.ts 的 projectLikeDomainSet ，阅读属性 ruan-cat-notes 的内容。
3 为 projectLikeDomainSet 的 ruan-cat-notes 的 description ，增加上述的 jsdoc 内容。根据不同的 projectAlias 配置，将对应的 jsdoc 配置写入到 description 内。
4 写入时，请注意实现文本的换行效果。注意使用模板字符串。填写好模板字符串即可。

## 002 <!-- TODO: --> 增加 11comm 内增加 app 相关的域名，并提供别名配置

1. 阅读 `D:\code\github-desktop-store\11comm-app\docs\prompts\migrate-plan\01.md` 的 088 将项目部署到 vercel 平台内 ，这个章节。
2. 去更新维护 `packages\domains\src\domains.ts` 文件。
3. 我们增加了两个域名，都在 vercel 平台内完成部署，都是高频更新的。在 11comm 这个项目内，继续增加 order 为 3 4 的域名。且必须增加 alias 别名。在其他项目内要实现精准获取域名配置的。
4. 顺延 11comm 内原本 order 为 3 4 的域名。
5. 注意在 description 内说明清楚：
   - vercel 平台部署
   - 高频更新
6. 最后编写更新日志，发版标签为 minor 更新。
