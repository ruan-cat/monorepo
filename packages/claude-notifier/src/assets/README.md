# Assets 资源文件

本目录存放通知工具的音频和图标资源。

## 目录结构

```plain
assets/
├── sounds/              # 音频文件目录
│   ├── success/         # 成功音效
│   ├── warning/         # 警告音效
│   ├── error/           # 错误音效
│   └── manbo/           # 自定义预设
└── icons/               # 图标文件目录
    ├── success/         # 成功图标
    ├── warning/         # 警告图标
    ├── error/           # 错误图标
    ├── info/            # 信息图标
    └── clock/           # 时钟图标
```

## 默认文件优先级

**音频文件**：`main.mp3` > `index.mp3` > `default.mp3`

**图标文件**：`icon.png` > `index.png` > `default.png` > `main.png`

## 快速使用

### 使用预设

```bash
# 使用预设名称（自动查找默认文件）
npx @ruan-cat/claude-notifier task-complete --sound manbo --icon success
```

### 指定具体文件

```bash
# 指定预设文件夹内的具体文件
npx @ruan-cat/claude-notifier task-complete --sound manbo/01.mp3
```

### 使用自定义路径

```bash
# 使用绝对路径
npx @ruan-cat/claude-notifier task-complete --sound "C:\sounds\custom.mp3"
```

## 添加自定义资源

详细的资源添加指南请参考：[如何添加静态资源](../docs/how-to-add-assets.md)

**快速步骤**：

1. 创建预设文件夹：`mkdir -p src/assets/sounds/my-sound`
2. 添加资源文件：`cp /path/to/audio.mp3 src/assets/sounds/my-sound/main.mp3`
3. 重新构建：`pnpm build`
4. 使用：`--sound my-sound`

## 资源规范

- **音频格式**：MP3（推荐）、WAV
- **图标格式**：PNG（推荐）、JPG、ICO
- **音频大小**：< 1MB
- **图标尺寸**：256x256 或 512x512

## 相关文档

- [如何添加静态资源](../docs/how-to-add-assets.md) - 详细的资源添加指南
- [CLI 使用文档](../docs/use/cli.md) - 命令行使用方式
- [API 使用文档](../docs/use/api.md) - 编程方式使用
