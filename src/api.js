const axios = require('axios');
const https = require('https');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

function createClient(sessdata) {
  const headers = { 'User-Agent': USER_AGENT, Referer: 'https://www.bilibili.com/' };
  if (sessdata) {
    headers.Cookie = `SESSDATA=${sessdata}`;
  }
  return axios.create({
    headers,
    timeout: 30000,
    httpsAgent: new https.Agent({ keepAlive: true }),
  });
}

async function getVideoInfo(bvid, sessdata) {
  const client = createClient(sessdata);
  const { data } = await client.get('https://api.bilibili.com/x/web-interface/view', {
    params: { bvid },
  });
  if (data.code !== 0) {
    throw new Error(`API error: ${data.message || data.code}`);
  }
  const v = data.data;
  const pages = v.pages || [];
  return {
    bvid: v.bvid,
    aid: v.aid,
    title: v.title,
    pages: pages.map((p) => ({
      cid: p.cid,
      page: p.page,
      part: p.part || `P${p.page}`,
    })),
  };
}

async function getPlayUrl(bvid, cid, qn, sessdata) {
  const client = createClient(sessdata);
  const params = {
    bvid,
    cid,
    qn,
    fnval: 4048,
    fourk: 1,
  };
  const { data } = await client.get('https://api.bilibili.com/x/player/playurl', { params });
  if (data.code !== 0) {
    throw new Error(`PlayURL API error: ${data.message || data.code}`);
  }
  return data.data;
}

async function getHighestQuality(bvid, cid, sessdata) {
  const { QUALITY_ORDER } = require('./utils');
  for (const qn of QUALITY_ORDER) {
    try {
      const playData = await getPlayUrl(bvid, cid, qn, sessdata);
      if (playData && playData.dash && playData.dash.video && playData.dash.video.length > 0) {
        return qn;
      }
    } catch {
      continue;
    }
  }
  return 80;
}

module.exports = { getVideoInfo, getPlayUrl, getHighestQuality };
