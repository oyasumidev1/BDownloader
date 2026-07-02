const path = require('path');
const fs = require('fs');

const BV_PATTERN = /BV[0-9A-Za-z]{10}/;
const URL_PATTERN = /bilibili\.com\/video\/(BV[0-9A-Za-z]{10})/;

function extractBvid(input) {
  if (BV_PATTERN.test(input)) {
    return input.match(BV_PATTERN)[0];
  }
  const m = input.match(URL_PATTERN);
  if (m) return m[1];
  return null;
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 2 : 0) + ' ' + units[i];
}

function formatDuration(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const QUALITY_MAP = {
  6: '240P',
  16: '360P',
  32: '480P',
  64: '720P',
  74: '720P60',
  80: '1080P',
  116: '1080P60',
  120: '4K',
  125: '4K HDR',
  126: '杜比视界',
  127: '1080P+',
};

const QUALITY_ORDER = [127, 126, 125, 120, 116, 80, 74, 64, 32, 16, 6];

function getQualityName(qn) {
  return QUALITY_MAP[qn] || `${qn}P`;
}

module.exports = {
  extractBvid,
  sanitizeFilename,
  formatBytes,
  formatDuration,
  ensureDir,
  QUALITY_ORDER,
  QUALITY_MAP,
  getQualityName,
};
