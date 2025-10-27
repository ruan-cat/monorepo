# Assets 资源文件说明

本目录用于存放通知工具的音频和图标资源文件。

## 目录结构

```plain
assets/
├── sounds/              # 音频文件目录
│   ├── success/         # 成功音效预设
│   │   ├── main.mp3     # 默认音频（优先级最高）
│   │   ├── 01.mp3       # 可选的其他音频
│   │   └── 02.mp3
│   ├── warning/         # 警告音效预设
│   │   └── main.mp3
│   ├── error/           # 错误音效预设
│   │   └── main.mp3
│   └── manbo/           # 自定义预设（曼波音效）
│       ├── main.mp3     # 默认使用的曼波音效
│       ├── 01.mp3       # 其他可选的曼波音效
│       └── 02.mp3
└── icons/               # 图标文件目录
    ├── success/         # 成功图标预设
    │   └── icon.png     # 默认图标（优先级最高）
    ├── warning/         # 警告图标预设
    │   └── icon.png
    ├── error/           # 错误图标预设
    │   └── icon.png
    ├── info/            # 信息图标预设
    │   └── icon.png
    └── clock/           # 时钟图标预设（长任务）
        └── icon.png
```

## 使用规则

### 音频文件

**默认文件查找顺序**（当使用预设名称如 `--sound manbo` 时）：

1. `main.mp3` - 最优先
2. `index.mp3`
3. `default.mp3`

**支持的音频格式**：`.mp3`、`.wav`（推荐使用 `.mp3`）

**使用示例**：

```bash
# 使用预设（自动查找 manbo/main.mp3）
node dist/cli.cjs task-complete --sound manbo

# 指定具体文件
node dist/cli.cjs task-complete --sound manbo/01.mp3

# 使用绝对路径
node dist/cli.cjs task-complete --sound "C:\custom\sounds\myaudio.mp3"
```

### 图标文件

**默认文件查找顺序**（当使用预设名称如 `--icon success` 时）：

1. `icon.png` - 最优先
2. `index.png`
3. `default.png`
4. `main.png`

**支持的图标格式**：`.png`、`.jpg`、`.ico`（推荐使用 `.png`）

**使用示例**：

```bash
# 使用预设（自动查找 success/icon.png）
node dist/cli.cjs task-complete --icon success

# 指定具体文件
node dist/cli.cjs task-complete --icon success/custom.png

# 使用绝对路径
node dist/cli.cjs task-complete --icon "C:\custom\icons\myicon.png"
```

## 如何添加自定义资源

### 1. 添加新的音频预设

在 `sounds/` 目录下创建新文件夹，并放入音频文件：

```bash
mkdir sounds/my-custom
# 将音频文件复制到该目录
cp /path/to/your/audio.mp3 sounds/my-custom/main.mp3
```

使用时：

```bash
# 使用默认文件
node dist/cli.cjs task-complete --sound my-custom

# 指定具体文件
node dist/cli.cjs task-complete --sound my-custom/audio.mp3
```

### 2. 添加新的图标预设

在 `icons/` 目录下创建新文件夹，并放入图标文件：

```bash
mkdir icons/my-custom
# 将图标文件复制到该目录
cp /path/to/your/icon.png icons/my-custom/icon.png
```

使用时：

```bash
# 使用默认文件
node dist/cli.cjs task-complete --icon my-custom

# 指定具体文件
node dist/cli.cjs task-complete --icon my-custom/custom.png
```

## 注意事项

1. **文件命名**：
   - 推荐使用 `main.mp3` 作为音频默认文件
   - 推荐使用 `icon.png` 作为图标默认文件

2. **文件大小**：
   - 音频文件建议控制在 1MB 以内
   - 图标文件建议使用 256x256 或 512x512 尺寸

3. **格式支持**：
   - 音频优先使用 `.mp3` 格式（兼容性好）
   - 图标优先使用 `.png` 格式（支持透明度）

4. **相对路径**：
   - 当使用预设名称（如 `manbo`）时，会自动查找对应文件夹下的默认文件
   - 当使用路径（如 `manbo/01.mp3`）时，会查找具体的文件

## 获取资源文件

您可以从以下来源获取免费的音频和图标：

**音频资源**：

- [Freesound](https://freesound.org/) - 免费音效库
- [Zapsplat](https://www.zapsplat.com/) - 免费音效下载
- [Mixkit](https://mixkit.co/free-sound-effects/) - 免费音效

**图标资源**：

- [Flaticon](https://www.flaticon.com/) - 免费图标库
- [Icons8](https://icons8.com/) - 免费图标下载
- [Iconmonstr](https://iconmonstr.com/) - 简洁图标库
