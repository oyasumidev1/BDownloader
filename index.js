#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const dotenv = require('dotenv');
const { extractBvid, ensureDir, getQualityName } = require('./src/utils');
const { getVideoInfo, getPlayUrl, getHighestQuality } = require('./src/api');
const { downloadVideo, checkFfmpeg } = require('./src/downloader');

dotenv.config();

program
  .name('bdownloader')
  .description('Bilibili video downloader')
  .argument('[bvid]', 'BV number or Bilibili video URL')
  .option('-o, --output <dir>', 'Output directory', './downloads')
  .option('-q, --quality <qn>', 'Video quality (see README)', parseInt)
  .option('--cookie <sessdata>', 'Bilibili SESSDATA cookie (overrides .env)')
  .option('--no-merge', 'Skip ffmpeg merge, keep video/audio files separate')
  .version('1.0.0')
  .parse(process.argv);

const opts = program.opts();
const bvidInput = program.args[0];

async function main() {
  if (!bvidInput) {
    program.help();
    return;
  }

  const bvid = extractBvid(bvidInput);
  if (!bvid) {
    console.error('Error: Invalid BV number or Bilibili URL');
    process.exit(1);
  }

  const sessdata = opts.cookie || process.env.SESSDATA || '';
  if (!sessdata) {
    console.warn('Warning: No SESSDATA provided. Videos above 1080P may fail.');
    console.warn('Set SESSDATA in .env or use --cookie option.\n');
  }

  if (sessdata) {
    const masked = sessdata.length > 8
      ? sessdata.slice(0, 4) + '****' + sessdata.slice(-4)
      : '****';
    console.log(`Using SESSDATA: ${masked}`);
  }

  const outputDir = path.resolve(opts.output);
  ensureDir(outputDir);

  console.log(`Fetching video info for ${bvid}...`);
  const info = await getVideoInfo(bvid, sessdata);
  const title = info.title;
  console.log(`Title: ${title}`);
  console.log(`Pages: ${info.pages.length}`);

  for (const [idx, page] of info.pages.entries()) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Page ${idx + 1}/${info.pages.length}: ${page.part} (cid: ${page.cid})`);

    let qn = opts.quality;
    if (!qn) {
      console.log('Determining highest available quality...');
      qn = await getHighestQuality(bvid, page.cid, sessdata);
    }
    const qnName = getQualityName(qn);

    const playData = await getPlayUrl(bvid, page.cid, qn, sessdata);
    playData.bvid = bvid;
    playData.cid = page.cid;
    playData.quality = qn;

    const hasFfmpeg = checkFfmpeg();
    if (!hasFfmpeg && !opts.merge) {
      console.warn('Warning: ffmpeg not found in PATH. Audio/video will not be merged.');
    }

    await downloadVideo(playData, outputDir, title);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`All downloads completed! Files saved to: ${outputDir}`);
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`);
  process.exit(1);
});
