# 如何添加静态资源

本文档说明如何在 `@ruan-cat/claude-notifier` 中添加自定义音频和图标资源。

## 背景

本包使用**文件夹预设方式**组织资源：

- 每个预设对应一个文件夹
- 文件夹内可包含多个文件
- 支持指定具体文件名

## 目录结构

```plain
src/assets/
├── sounds/              # 音频目录
│   ├── success/         # 成功音效预设
│   │   ├── main.mp3     # 默认音频（优先级最高）
│   │   ├── 01.mp3       # 可选的其他音频
│   │   └── 02.mp3
│   ├── warning/         # 警告音效预设
│   ├── error/           # 错误音效预设
│   └── manbo/           # 自定义预设（曼波音效）
└── icons/               # 图标目录
    ├── success/         # 成功图标预设
    │   └── icon.png     # 默认图标
    ├── warning/         # 警告图标预设
    ├── error/           # 错误图标预设
    ├── info/            # 信息图标预设
    └── clock/           # 时钟图标预设
```

## 添加音频

### 步骤 1：创建文件夹

在 `src/assets/sounds/` 目录下创建新文件夹：

```bash
cd packages/claude-notifier
mkdir -p src/assets/sounds/my-sound
```

### 步骤 2：添加文件

复制音频文件（建议时长 1-3 秒，适合通知音效）：

```bash
# 添加默认音频
cp /path/to/your/audio.mp3 src/assets/sounds/my-sound/main.mp3

# 或添加多个可选音频
cp /path/to/audio1.mp3 src/assets/sounds/my-sound/01.mp3
cp /path/to/audio2.mp3 src/assets/sounds/my-sound/02.mp3
cp /path/to/default.mp3 src/assets/sounds/my-sound/main.mp3
```

**文件名优先级**：

- `main.mp3` - 默认音频（优先级最高）
- `index.mp3` - 次优先
- `default.mp3` - 再次优先
- 其他任意命名（如 `01.mp3`, `custom.mp3`）

### 步骤 3：重新构建

```bash
pnpm build
```

### 步骤 4：使用音频

```bash
# 使用默认音频（main.mp3）
npx @ruan-cat/claude-notifier task-complete --sound my-sound

# 使用指定文件
npx @ruan-cat/claude-notifier task-complete --sound my-sound/01.mp3
npx @ruan-cat/claude-notifier task-complete --sound my-sound/02.mp3
```

## 添加图标

### 步骤 1：创建图标文件夹

```bash
cd packages/claude-notifier
mkdir -p src/assets/icons/my-icon
```

### 步骤 2：添加图标文件

```bash
# 添加默认图标
cp /path/to/your/icon.png src/assets/icons/my-icon/icon.png

# 或添加多个可选图标
cp /path/to/icon1.png src/assets/icons/my-icon/default.png
cp /path/to/icon2.png src/assets/icons/my-icon/custom.png
cp /path/to/main-icon.png src/assets/icons/my-icon/icon.png
```

**文件名优先级**：

- `icon.png` - 默认图标（优先级最高）
- `index.png` - 次优先默认图标
- `default.png` - 再次优先
- `main.png` - 备选
- 其他任意命名

### 步骤 3：重新构建

```bash
pnpm build
```

### 步骤 4：使用图标

```bash
# 使用默认图标（icon.png）
npx @ruan-cat/claude-notifier task-complete --icon my-icon

# 使用指定文件
npx @ruan-cat/claude-notifier task-complete --icon my-icon/custom.png
```

## 完整示例：添加 manbo 预设

### 1. 准备资源文件

- 音频：`manbo-main.mp3`, `manbo-01.mp3`, `manbo-02.mp3`
- 图标：`manbo-icon.png`

### 2. 创建目录结构

```bash
cd packages/claude-notifier
mkdir -p src/assets/sounds/manbo
mkdir -p src/assets/icons/manbo
```

### 3. 复制资源文件

```bash
# 复制音频
cp ~/Downloads/manbo-main.mp3 src/assets/sounds/manbo/main.mp3
cp ~/Downloads/manbo-01.mp3 src/assets/sounds/manbo/01.mp3
cp ~/Downloads/manbo-02.mp3 src/assets/sounds/manbo/02.mp3

# 复制图标
cp ~/Downloads/manbo-icon.png src/assets/icons/manbo/icon.png
```

### 4. 验证目录结构

```bash
tree src/assets/
```

期望输出：

```plain
src/assets/
├── sounds/
│   └── manbo/
│       ├── main.mp3
│       ├── 01.mp3
│       └── 02.mp3
└── icons/
    └── manbo/
        └── icon.png
```

### 5. 重新构建

```bash
pnpm build
```

### 6. 测试使用

```bash
# 使用默认 manbo 音频和图标
npx @ruan-cat/claude-notifier task-complete \
  --sound manbo \
  --icon manbo \
  --message "Manbo 预设测试"

# 使用指定 manbo 音频
npx @ruan-cat/claude-notifier task-complete \
  --sound manbo/01.mp3 \
  --icon manbo \
  --message "使用 01 音频"
```

## 资源规范

### 音频格式

- **推荐格式**：MP3（优先）
- **备选格式**：WAV
- **采样率**：44.1kHz 或 48kHz
- **比特率**：128kbps - 320kbps
- **时长**：1-3 秒（适合通知音效）

### 文件大小

- **推荐**：< 500KB
- **最大**：< 2MB（较大文件会影响加载速度）

### 音频建议

- 音频内容简短明确
- 避免过于刺耳或嘈杂的音效

### 免费音频资源

可以从这些网站获取免费音效：

- [Freesound](https://freesound.org/) - 免费音效库
- [Zapsplat](https://www.zapsplat.com/) - 免费音效下载
- [Mixkit](https://mixkit.co/free-sound-effects/) - 免费音效
- [Notification Sounds](https://notificationsounds.com/) - 专门的通知音效

## 图标资源规范

### 推荐格式

- **推荐格式**：PNG（优先，支持透明度）
- **备选格式**：JPG, ICO

### 尺寸规范

- **推荐**：256x256 或 512x512
- **最小**：64x64
- **最大**：1024x1024

### 文件大小

- **推荐**：< 100KB
- **最大**：< 500KB

### 图标建议

- 使用扁平化设计风格的图标
- 支持透明背景
- 保持简洁清晰的视觉效果
- 高对比度更容易辨识

### 免费图标资源

可以从这些网站获取免费图标：

- [Flaticon](https://www.flaticon.com/) - 免费图标库
- [Icons8](https://icons8.com/) - 免费图标下载
- [Iconmonstr](https://iconmonstr.com/) - 简洁图标库
- [Feather Icons](https://feathericons.com/) - 轻量图标集
- [Heroicons](https://heroicons.com/) - 精美 SVG 图标

## 更新现有预设

如果想更新已有的预设（如 `success`或`warning`）：

### 1. 导航到相应的文件夹

```bash
cd packages/claude-notifier/src/assets/sounds/success
```

### 2. 替换或添加文件

```bash
# 替换默认音频
cp ~/new-success.mp3 main.mp3

# 或添加额外变体
cp ~/success-v2.mp3 02.mp3
```

### 3. 重新构建

```bash
cd ../../../..  # 回到 claude-notifier 包的根目录
pnpm build
```

## 删除资源

如果需要移除不需要的预设：

```bash
# 删除音频预设文件夹
rm -rf src/assets/sounds/my-sound

# 删除图标预设文件夹
rm -rf src/assets/icons/my-icon

# 重新构建
pnpm build
```

## 注意事项

### 避免提交到 Git 仓库

- 在添加预设文件夹后，建议在 `.gitkeep` 文件
- 在添加默认音频（`success`, `warning`, `error` 等）后提交

### 不要提交的资源

- 测试用临时音频
- 文件体积过大的音频（> 2MB）
- 不包含合法版权的资源（请确认可以使用）

### .gitignore 配置

在 `src/assets/` 目录下可以添加 `.gitignore`：

```gitignore
# 忽略临时文件
*.tmp
*.temp

# 忽略文件体积过大的文件
**/large-*.mp3
**/large-*.wav

# 但保留特定预设文件夹
!sounds/success/
!sounds/warning/
!sounds/error/
!sounds/manbo/
!icons/success/
!icons/warning/
!icons/error/
!icons/info/
!icons/clock/
```

## 常见问题

### Q1: 为什么资源文件没有生效，通知音效或图标未显示？

**A**: 请检查：

1. 文件格式是否正确（MP3/WAV 音频，PNG 图标）
2. 是否重新构建：`pnpm build`
3. 使用正确的命令名称
4. 查看日志输出

### Q2: 如何批量添加预设的多个文件？

**A**: 可以使用脚本批量操作：

```bash
#!/bin/bash
# add-presets.sh

presets=("preset1" "preset2" "preset3")

for preset in "${presets[@]}"; do
  mkdir -p src/assets/sounds/$preset
  mkdir -p src/assets/icons/$preset
  # 复制资源文件...
done

pnpm build
```

### Q3: 资源文件在构建后的位置是哪里？

**A**: 构建后的资源在 `dist/assets/` 目录：

```plain
dist/
└── assets/
    ├── sounds/
    │   └── my-sound/
    │       ├── main.mp3
    │       └── 01.mp3
    └── icons/
        └── my-icon/
            └── icon.png
```

### Q4: 如何在不重新构建的情况下测试资源？

**A**: 在 tsx 开发模式下运行或直接编辑：

```bash
# 先构建一次
pnpm build

# 然后直接测试
node dist/cli.cjs task-complete --sound my-sound
```

## 相关文档

- 参考 [CLI 使用文档](./use/cli.md) 了解如何使用资源
- 参考 [API 使用文档](./use/api.md) 了解如何编程式使用
- 参考 [架构文档](./architecture.md) 了解资源的组织架构
