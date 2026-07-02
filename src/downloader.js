const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const cliProgress = require('cli-progress');
const { formatBytes, ensureDir, getQualityName } = require('./utils');

let ffmpegPath = 'ffmpeg';

function checkFfmpeg() {
  try {
    execSync(`"${ffmpegPath}" -version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function downloadStream(url, filePath, label) {
  const axios = require('axios');
  const writer = fs.createWriteStream(filePath);

  const { data, headers } = await axios.get(url, {
    responseType: 'stream',
    headers: {
      Referer: 'https://www.bilibili.com/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    },
  });

  const total = parseInt(headers['content-length'], 10) || 0;
  const bar = new cliProgress.SingleBar({
    format: `  ${label} | {bar} | {percentage}% | {value}/{total}`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  });
  bar.start(total, 0);

  let loaded = 0;
  data.on('data', (chunk) => {
    loaded += chunk.length;
    bar.update(loaded);
  });

  await new Promise((resolve, reject) => {
    data.pipe(writer);
    writer.on('finish', () => {
      bar.stop();
      resolve();
    });
    writer.on('error', reject);
    data.on('error', reject);
  });
}

function selectStream(streams, quality) {
  const target = streams.find((s) => s.id === quality);
  if (target) return target;
  const sorted = [...streams].sort((a, b) => b.id - a.id);
  return sorted[0];
}

function getFfmpegPath() {
  return ffmpegPath;
}

function setFfmpegPath(p) {
  ffmpegPath = p;
}

async function mergeVideoAudio(videoPath, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-i', videoPath,
      '-i', audioPath,
      '-c:v', 'copy',
      '-c:a', 'copy',
      '-movflags', '+faststart',
      '-y', outputPath,
    ];
    const proc = spawn(ffmpegPath, args);
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}\n${stderr}`));
    });
    proc.on('error', reject);
  });
}

async function downloadVideo(playData, outputDir, title) {
  const { bvid, cid, quality: qn } = playData;
  const qualityName = getQualityName(qn);
  const dash = playData.dash;

  if (!dash || !dash.video || dash.video.length === 0) {
    throw new Error('No DASH streams available');
  }

  const videoStream = selectStream(dash.video, qn);
  const videoUrl = videoStream.base_url || videoStream.baseUrl;
  const audioStream = selectStream(dash.audio, 0);
  const audioUrl = audioStream.base_url || audioStream.baseUrl;

  const baseName = `${title}_${bvid}_${cid}`;
  const videoFile = path.join(outputDir, `${baseName}_video.m4s`);
  const audioFile = path.join(outputDir, `${baseName}_audio.m4s`);

  console.log(`\nDownloading: ${title}`);
  console.log(`Quality: ${qualityName} (video: ${videoStream.width}x${videoStream.height}, codec: ${videoStream.codecs})`);
  console.log(`Video size: ${formatBytes(videoStream.size)}`);
  console.log(`Audio size: ${formatBytes(audioStream.size)}`);

  console.log('\nDownloading video stream...');
  await downloadStream(videoUrl, videoFile, 'Video');

  console.log('Downloading audio stream...');
  await downloadStream(audioUrl, audioFile, 'Audio');

  const hasFfmpeg = checkFfmpeg();
  if (hasFfmpeg) {
    const mergedFile = path.join(outputDir, `${baseName}.mp4`);
    console.log('\nMerging audio & video with ffmpeg...');
    await mergeVideoAudio(videoFile, audioFile, mergedFile);
    console.log(`Merged successfully: ${mergedFile}`);

    fs.unlinkSync(videoFile);
    fs.unlinkSync(audioFile);
    console.log('Temporary files cleaned up.');
    return mergedFile;
  } else {
    console.log('\nffmpeg not found. Video and audio files saved separately:');
    console.log(`  Video: ${videoFile}`);
    console.log(`  Audio: ${audioFile}`);
    console.log('Install ffmpeg and re-run to merge automatically.');
    return [videoFile, audioFile];
  }
}

module.exports = { downloadVideo, downloadStream, checkFfmpeg, setFfmpegPath, getFfmpegPath };
