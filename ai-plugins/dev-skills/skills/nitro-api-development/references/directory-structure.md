> **何时读**：创建目录、命名接口文件前；含扁平/模块化两种形态与「文件路径即 API 路由」映射规则。

## 4. 目录结构规范

### 4.1 扁平结构（推荐用于小型项目）

```plain
project-root/
├── server/                          # Nitro 服务端目录
│   ├── routes/                      # API 路由目录
│   │   ├── users.get.ts             # GET /users
│   │   ├── users.post.ts            # POST /users
│   │   └── health.get.ts            # GET /health
│   ├── db/                          # 数据库相关（可选）
│   │   ├── index.ts                 # 数据库连接（useDb）
│   │   └── schema/                  # Drizzle Schema 定义
│   ├── utils/                       # 工具函数
│   │   └── format-date.ts           # 时间格式化（参见 templates/format-date.ts）
│   └── types/                       # 类型定义
│       └── index.ts                 # ApiResponse、PageData 等（参见 templates/types.ts）
├── nitro.config.ts                  # Nitro 配置文件
└── package.json
```

### 4.2 模块化结构（适用于大型项目）

```plain
project-root/
├── server/
│   ├── api/                         # API 接口目录
│   │   └── {module}/{feature}/
│   │       ├── list.post.ts         # 列表查询接口
│   │       ├── create.post.ts       # 创建接口
│   │       ├── update.post.ts       # 更新接口
│   │       ├── delete.post.ts       # 删除接口
│   │       └── [id].get.ts          # 详情接口
│   ├── db/                          # 数据库连接和 Schema
│   └── utils/                       # 工具函数
├── nitro.config.ts
└── package.json
```

**文件路径映射规则**：文件路径直接映射为 API 路径

```plain
文件: server/routes/users.get.ts     -> GET /users
文件: server/api/users/list.post.ts  -> POST /api/users/list
文件: server/api/users/[id].get.ts   -> GET /api/users/:id
```
