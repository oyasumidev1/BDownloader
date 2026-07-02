# BDownloader

一个命令行工具，用于下载 [Bilibili](https://www.bilibili.com) 视频。

## 功能

- 支持 BV 号或完整 Bilibili 链接下载
- 支持所有画质：240P 至 4K HDR / 杜比视界
- 支持多 P 视频下载（合集/分 P）
- DASH 流下载（视频和音频分离）
- 自动通过 ffmpeg 合并视频和音频为单个 `.mp4`
- 下载进度条显示
- Cookie 认证，支持高清内容（1080P+）

## 环境要求

- [Node.js](https://nodejs.org/) v14+
- [ffmpeg](https://ffmpeg.org/)（可选，合并流时需要）

## 安装

```bash
npm install
```

## 配置

在 `.env` 文件中设置你的 Bilibili SESSDATA cookie，以访问高清流：

```
SESSDATA=your_sessdata_value_here
```

获取 SESSDATA：打开浏览器访问 Bilibili 并登录，按 F12 打开开发者工具 → Application → Cookies → `bilibili.com` → 复制 `SESSDATA` 的值。

也可以在每次运行时通过 `--cookie` 参数传入。

## 用法

```bash
node index.js <bvid_or_url> [options]
```

### 示例

```bash
# 自动选择画质下载
node index.js BV1xx...

# 指定输出目录和画质（120 = 4K）
node index.js BV1xx... -o ./my_videos -q 120

# 使用完整 Bilibili 链接
node index.js "https://www.bilibili.com/video/BV1xx..."

# 跳过 ffmpeg 合并，保留 .m4s 文件
node index.js BV1xx... --no-merge

# 在命令行中指定 cookie
node index.js BV1xx... --cookie "my_sessdata"
```

### 选项

| 选项 | 说明 |
|--------|------|
| `-o, --output <dir>` | 输出目录（默认：`./downloads`） |
| `-q, --quality <qn>` | 视频画质编码（见下表） |
| `--cookie <sessdata>` | Bilibili SESSDATA cookie |
| `--no-merge` | 跳过 ffmpeg 合并，保留单独文件 |
| `-V, --version` | 显示版本号 |
| `-h, --help` | 显示帮助信息 |

### 画质编码

| 编码 | 画质 |
|------|------|
| 6 | 240P |
| 16 | 360P |
| 32 | 480P |
| 64 | 720P |
| 74 | 720P60 |
| 80 | 1080P |
| 112 | 1080P+ |
| 116 | 1080P60 |
| 120 | 4K |
| 125 | 4K HDR |
| 126 | 杜比视界 |
| 127 | 8K |

未指定画质时，自动选择最高可用画质。

## 输出文件

文件保存到输出目录（默认 `./downloads/`），以视频标题命名。启用合并时生成单个 `.mp4` 文件；不合并时分别保存 `.m4s` 视频和音频文件。

## 项目结构

```
BDownloader/
├── index.js          # CLI 入口
├── src/
│   ├── api.js        # Bilibili API 客户端
│   ├── downloader.js # 流下载 & ffmpeg 合并
│   └── utils.js      # 工具函数（BV 提取、画质映射、格式化）
├── .env              # Cookie 配置
└── package.json
```

## 许可

MIT
