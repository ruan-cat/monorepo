---
"@ruan-cat/domains": major
---

**破坏性变更：修改 11comm 项目 `01s-11comm.ruan-cat.com` 域名的部署平台描述**

1. 将 `11comm` 项目中 `01s-11comm.ruan-cat.com` 域名的 `description` 字段，从 "本域名主要用于 cloudflare worker 部署" 更改为 "本域名主要用于 vercel 部署"。
2. 这是一个破坏性变更，因为该域名的实际部署平台发生了根本性变化——从 Cloudflare Worker 迁移到了 Vercel。依赖此域名描述信息进行部署判断或文档展示的下游消费者需要注意适配。
3. 受影响的域名条目：`{ topLevelDomain: "ruan-cat.com", secondLevelDomain: "01s-11comm", order: 4 }`。
