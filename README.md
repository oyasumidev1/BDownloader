# BDownloader

A command-line tool for downloading videos from [Bilibili](https://www.bilibili.com) (B站).

## Features

- Download videos from BV links or full Bilibili URLs
- Support for all quality levels: 240P to 4K HDR / Dolby Vision
- Multi-page video support (playlists/collections within a single BV)
- DASH stream downloading (separate video and audio)
- Automatic merging of video and audio into a single `.mp4` via ffmpeg
- Progress bars for download status
- Cookie-based authentication for HD content (1080P+)

## Prerequisites

- [Node.js](https://nodejs.org/) v14+
- [ffmpeg](https://ffmpeg.org/) (optional, required for merging streams)

## Installation

```bash
npm install
```

## Configuration

Set your Bilibili SESSDATA cookie in `.env` to access high-resolution streams:

```
SESSDATA=your_sessdata_value_here
```

To get your SESSDATA: open Bilibili in your browser, open Developer Tools (F12) → Application → Cookies → `bilibili.com` → copy the value of `SESSDATA`.

Alternatively, pass the cookie via the `--cookie` flag on each invocation.

## Usage

```bash
node index.js <bvid_or_url> [options]
```

### Examples

```bash
# Download with auto quality detection
node index.js BV1xx...

# Specify output directory and quality (120 = 4K)
node index.js BV1xx... -o ./my_videos -q 120

# Use a full Bilibili URL
node index.js "https://www.bilibili.com/video/BV1xx..."

# Skip ffmpeg merging, keep .m4s files separate
node index.js BV1xx... --no-merge

# Override cookie on command line
node index.js BV1xx... --cookie "my_sessdata"
```

### Options

| Option | Description |
|--------|-------------|
| `-o, --output <dir>` | Output directory (default: `./downloads`) |
| `-q, --quality <qn>` | Video quality code (see below) |
| `--cookie <sessdata>` | Bilibili SESSDATA cookie |
| `--no-merge` | Skip ffmpeg merge, keep separate files |
| `-V, --version` | Show version |
| `-h, --help` | Show help |

### Quality Codes

| Code | Quality |
|------|---------|
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
| 126 | Dolby Vision |
| 127 | 8K |

If no quality is specified, the highest available quality is used automatically.

## Output

Files are saved to the output directory (default `./downloads/`) with the video title as filename. When merging is enabled, a single `.mp4` file is produced. Without merging, separate `.m4s` video and audio files are saved.

## Project Structure

```
BDownloader/
├── index.js          # CLI entry point
├── src/
│   ├── api.js        # Bilibili API client
│   ├── downloader.js # Stream download & ffmpeg merge
│   └── utils.js      # Utilities (BV extraction, quality map, formatting)
├── .env              # Cookie configuration
└── package.json
```

## License

MIT
