WidgetMetadata = {
  "id": "bagua",
  "title": "bagua",
  "version": "2.5",
  "requiredVersion": "0.0.2",
  "description": "bagua 分类、搜索与详情模块 (封面修复增强版)",
  "author": "Codex",
  "site": "https://www.mrds66.com",
  "icon": "https://www.mrds66.com/usr/themes/Mirages/images/logo-2.png?v=2",
  "detailCacheDuration": 1800,
  "globalParams": [
    {
      "name": "baseUrl",
      "title": "站点域名",
      "type": "input",
      "value": "https://www.mrds66.com"
    },
    {
      "name": "coverProxy",
      "title": "封面代理",
      "type": "input",
      "value": "https://bagua-cover-proxy.dingyong1024.workers.dev",
      "placeholders": [
        {
          "title": "Cloudflare Worker 地址",
          "value": "https://bagua-cover-proxy.dingyong1024.workers.dev"
        }
      ]
    }
  ],
  "modules": [
    {
      "id": "loadList",
      "title": "分类",
      "functionName": "loadList",
      "cacheDuration": 600,
      "params": [
        {
          "name": "category",
          "title": "频道",
          "type": "enumeration",
          "value": "xazd",
          "enumOptions": [
            {
              "title": "校园学生",
              "value": "xazd"
            },
            {
              "title": "每日大赛",
              "value": "mrds"
            },
            {
              "title": "主题大赛",
              "value": "ztds"
            },
            {
              "title": "热搜吃瓜",
              "value": "rstt"
            },
            {
              "title": "必撸大赛",
              "value": "blyp"
            },
            {
              "title": "反差泄密",
              "value": "fctg"
            },
            {
              "title": "网红黑料",
              "value": "mhds"
            },
            {
              "title": "猎奇重口",
              "value": "lqdp"
            },
            {
              "title": "AV看片",
              "value": "jdsj"
            },
            {
              "title": "明星大赛",
              "value": "mxwh"
            },
            {
              "title": "动漫之家",
              "value": "smdh"
            },
            {
              "title": "影视国漫",
              "value": "dypd"
            },
            {
              "title": "cos写真",
              "value": "mtds"
            },
            {
              "title": "声控ASMR",
              "value": "ysds"
            },
            {
              "title": "寸止挑战",
              "value": "czds"
            },
            {
              "title": "混剪PMV",
              "value": "hjds"
            },
            {
              "title": "原创投稿",
              "value": "tgds"
            },
            {
              "title": "欧美精品",
              "value": "omjp"
            },
            {
              "title": "全网参赛",
              "value": "qwcs"
            },
            {
              "title": "世界杯区",
              "value": "sjbq"
            }
          ]
        },
        {
          "name": "page",
          "title": "页码",
          "type": "page"
        },
        {
          "name": "coverMode",
          "title": "封面类型",
          "type": "enumeration",
          "value": "image",
          "enumOptions": [
            {
              "title": "图片封面 (推荐)",
              "value": "image"
            },
            {
              "title": "视频封面 (M3U8)",
              "value": "video"
            },
            {
              "title": "图片+视频",
              "value": "both"
            }
          ]
        },
        {
          "name": "previewCount",
          "title": "视频封面数量",
          "type": "enumeration",
          "value": "0",
          "enumOptions": [
            {
              "title": "关闭",
              "value": "0"
            },
            {
              "title": "前 6 条",
              "value": "6"
            },
            {
              "title": "前 12 条",
              "value": "12"
            }
          ]
        }
      ]
    }
  ],
  "search": {
    "title": "搜索",
    "functionName": "search",
    "params": [
      {
        "name": "keyword",
        "title": "关键词",
        "type": "input"
      },
      {
        "name": "page",
        "title": "页码",
        "type": "page"
      },
      {
        "name": "coverMode",
        "title": "封面类型",
        "type": "enumeration",
        "value": "image",
        "enumOptions": [
          {
            "title": "图片封面 (推荐)",
            "value": "image"
          },
          {
            "title": "视频封面 (M3U8)",
            "value": "video"
          },
          {
            "title": "图片+视频",
            "value": "both"
          }
        ]
      },
      {
        "name": "previewCount",
        "title": "视频封面数量",
        "type": "enumeration",
        "value": "0",
        "enumOptions": [
          {
            "title": "关闭",
            "value": "0"
          },
          {
            "title": "前 6 条",
            "value": "6"
          },
          {
            "title": "前 12 条",
            "value": "12"
          }
        ]
      }
    ]
  }
};


var DEFAULT_BASE_URL = "https://www.mrds66.com";
var HEADERS = {
  "User-Agent": "Mozilla/5.0",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
  "Referer": "https://www.mrds66.com/"
};
var IMAGE_HEADERS = {
  "User-Agent": HEADERS["User-Agent"],
  "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  "Referer": "https://www.mrds66.com/"
};
var COVER_CACHE = {};
var DECRYPT_READY = false;
async function loadList(params) {
  params = params || {};
  var baseUrl = normalizeBaseUrl(params.baseUrl || DEFAULT_BASE_URL);
  var coverProxy = normalizeProxyUrl(params.coverProxy || "");
  var category = params.category || "xazd";
  var page = Math.max(1, Number(params.page || 1));
  var previewCount = normalizePreviewCount(params.previewCount);
  var coverMode = normalizeCoverMode(params.coverMode);
  var path = page === 1 ? "/category/" + category + "/" : "/category/" + category + "/" + page + "/";
  var html = await requestHtml(baseUrl + path);
  return await parseList(html, baseUrl, coverProxy, previewCount, coverMode);
}

async function search(params) {
  params = params || {};
  var keyword = String(params.keyword || "").trim();
  if (!keyword) return [];

  var baseUrl = normalizeBaseUrl(params.baseUrl || DEFAULT_BASE_URL);
  var coverProxy = normalizeProxyUrl(params.coverProxy || "");
  var page = Math.max(1, Number(params.page || 1));
  var previewCount = normalizePreviewCount(params.previewCount);
  var coverMode = normalizeCoverMode(params.coverMode);
  var encoded = encodeURIComponent(keyword);
  var path = page === 1 ? "/search/" + encoded + "/" : "/search/" + encoded + "/" + page + "/";
  var html = await requestHtml(baseUrl + path);
  return await parseList(html, baseUrl, coverProxy, previewCount, coverMode);
}

async function loadDetail(link) {
  if (!link) return null;

  var decoded = decodeLink(link);
  var baseUrl = normalizeBaseUrl(decoded.baseUrl || DEFAULT_BASE_URL);
  var coverProxy = normalizeProxyUrl(decoded.coverProxy || "");
  var url = absoluteUrl(decoded.url || link, baseUrl);
  var html = await requestHtml(url);

  var title =
    firstMatch(html, /<h1[^>]*class=["'][^"']*post-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
    metaContent(html, "property", "og:title") ||
    decoded.title ||
    "";
  var cover =
    metaContent(html, "itemprop", "image") ||
    metaContent(html, "property", "og:image") ||
    decoded.sourcePoster ||
    "";
  var description =
    metaContent(html, "property", "og:description") ||
    metaContent(html, "name", "description") ||
    "";
  var releaseDate = normalizeDate(
    metaContent(html, "property", "article:published_time") ||
    firstMatch(html, /<time[^>]*>([\s\S]*?)<\/time>/i)
  );
  var videoUrl = extractVideoUrl(html);
  var resolvedVideoUrl = videoUrl ? absoluteUrl(videoUrl, baseUrl) : undefined;
  var stills = unique([cover].concat(extractArticleImages(html, baseUrl))).filter(Boolean);
  var detailCover = await resolveCoverImage(stills[0] || cover, baseUrl, coverProxy);
  var coverUrl = detailCover || absoluteUrl(stills[0] || cover, baseUrl);
  var tags = extractTags(html);
  var backdropPaths = [];
  for (var i = 0; i < stills.length; i++) {
    backdropPaths.push(await resolveCoverImage(stills[i], baseUrl, coverProxy) || absoluteUrl(stills[i], baseUrl));
  }
  var genreItems = [];
  for (var j = 0; j < tags.length; j++) {
    genreItems.push({ id: tags[j], title: tags[j] });
  }

  return {
    id: decoded.id || idFromUrl(url),
    type: "url",
    mediaType: "movie",
    title: cleanText(title),
    coverUrl: coverUrl,
    posterPath: coverUrl,
    backdropPath: coverUrl,
    thumbnail: coverUrl,
    image: coverUrl,
    backdropPaths: backdropPaths,
    releaseDate: releaseDate,
    description: cleanText(description),
    videoUrl: resolvedVideoUrl,
    previewUrl: resolvedVideoUrl,
    trailers: resolvedVideoUrl ? [{ coverUrl: coverUrl, url: resolvedVideoUrl }] : undefined,
    link: encodeLink({ url: url, baseUrl: baseUrl, coverProxy: coverProxy, title: cleanText(title), sourcePoster: absoluteUrl(cover, baseUrl) }),
    genreItems: genreItems,
    playerType: "ijk",
    headers: IMAGE_HEADERS,
    customHeaders: HEADERS
  };
}

async function parseList(html, baseUrl, coverProxy, previewCount, coverMode) {
  var items = [];
  var articleRe = /<article\b[^>]*itemtype=["'][^"']*BlogPosting[^"']*["'][^>]*>[\s\S]*?<\/article>/gi;
  var match;

  while ((match = articleRe.exec(html))) {
    var block = match[0];
    if (/class=["'][^"']*ad-item/i.test(block)) continue;

    var href =
      firstMatch(block, /<a\b[^>]*href=["']([^"']*\/archives\/[^"']+)["'][^>]*>/i) ||
      firstMatch(block, /<meta\b[^>]*itemprop=["'][^"']*url[^"']*["'][^>]*content=["']([^"']+)["']/i);
    var title =
      firstMatch(block, /<h2[^>]*class=["'][^"']*post-card-title[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i) ||
      firstMatch(block, /<meta\b[^>]*itemprop=["']headline["'][^>]*content=["']([^"']+)["']/i);
    var coverPath =
      firstMatch(block, /loadBannerDirect\(\s*["']([^"']+)["']/i) ||
      firstMatch(block, /<meta\b[^>]*itemprop=["']image["'][^>]*content=["']([^"']+)["']/i);
    var dateText =
      firstMatch(block, /<time[^>]*>([\s\S]*?)<\/time>/i) ||
      firstMatch(block, /<meta\b[^>]*itemprop=["']datePublished["'][^>]*content=["']([^"']+)["']/i);

    if (!href || !title) continue;

    var url = absoluteUrl(href, baseUrl);
    var sourcePoster = absoluteUrl(coverPath || "", baseUrl);
    items.push({
      id: idFromUrl(url),
      type: "url",
      mediaType: "movie",
      title: cleanText(title),
      coverUrl: sourcePoster,
      backdropPath: sourcePoster,
      posterPath: sourcePoster,
      thumbnail: sourcePoster,
      image: sourcePoster,
      sourcePoster: sourcePoster,
      releaseDate: normalizeDate(dateText),
      description: normalizeDate(dateText),
      link: encodeLink({ url: url, baseUrl: baseUrl, coverProxy: coverProxy, coverMode: coverMode, title: cleanText(title), sourcePoster: sourcePoster }),
      headers: IMAGE_HEADERS,
      customHeaders: HEADERS
    });
  }

  items = await hydrateCovers(items, baseUrl, coverProxy);
  if (coverMode === "image") return items;
  return await hydratePreviewVideos(items, baseUrl, previewCount, coverMode);
}

async function requestHtml(url) {
  var res = await Widget.http.get(url, {
    headers: HEADERS
  });
  return String(res && res.data ? res.data : "");
}

async function hydrateCovers(items, baseUrl, coverProxy) {
  var index = 0;
  var workerCount = Math.min(3, items.length);
  var workers = [];

  async function worker() {
    while (index < items.length) {
      var item = items[index++];
      var sourcePoster = item.sourcePoster || "";
      var cover = await resolveCoverImage(sourcePoster, baseUrl, coverProxy);
      cover = cover || sourcePoster;
      setCoverFields(item, cover);
      item.headers = IMAGE_HEADERS;
      delete item.sourcePoster;
    }
  }

  for (var i = 0; i < workerCount; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return items;
}

async function hydratePreviewVideos(items, baseUrl, previewCount, coverMode) {
  var limit = Math.min(normalizePreviewCount(previewCount), items.length);
  if (!limit) return items;

  var index = 0;
  var workerCount = Math.min(2, limit);
  var workers = [];

  async function worker() {
    while (index < limit) {
      var item = items[index++];
      try {
        var decoded = decodeLink(item.link || "");
        var url = absoluteUrl(decoded.url || item.link, baseUrl);
        if (!url) continue;

        var html = await requestHtml(url);
        var previewUrl = extractVideoUrl(html);
        if (!previewUrl) continue;

        previewUrl = absoluteUrl(previewUrl, baseUrl);
        item.previewUrl = previewUrl;
        item.videoPreviewUrl = previewUrl;
        item.trailers = [{ coverUrl: item.coverUrl || item.posterPath || item.backdropPath, url: previewUrl }];
        if (coverMode === "video") {
          item.imageCoverUrl = item.coverUrl || item.posterPath || item.backdropPath;
          setCoverFields(item, previewUrl);
          item.coverType = "video";
        }
      } catch (error) {
        // Preview videos are optional. Keep list loading even when a detail page fails.
      }
    }
  }

  for (var i = 0; i < workerCount; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return items;
}

function setCoverFields(item, cover) {
  item.posterPath = cover;
  item.backdropPath = cover;
  item.thumbnail = cover;
  item.image = cover;
  item.coverUrl = cover;
}

async function resolveCoverImage(url, baseUrl, coverProxy) {
  var fullUrl = absoluteUrl(url, baseUrl);
  if (!fullUrl) return "";
  if (coverProxy && isEncryptedImage(fullUrl)) {
    return coverProxy + "?url=" + encodeURIComponent(fullUrl);
  }
  if (COVER_CACHE[fullUrl]) return COVER_CACHE[fullUrl];
  if (!isEncryptedImage(fullUrl)) {
    COVER_CACHE[fullUrl] = fullUrl;
    return fullUrl;
  }

  try {
    await ensureDecryptor(baseUrl);
    var res = await Widget.http.get(fullUrl, {
      headers: {
        "User-Agent": HEADERS["User-Agent"],
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": normalizeBaseUrl(baseUrl) + "/"
      },
      responseType: "arraybuffer"
    });
    var encryptedBase64 = toBase64(res ? res.data : "");
    var decryptedBase64 = decryptImageBase64(encryptedBase64);
    if (!decryptedBase64) return fullUrl;

    var dataUrl = "data:image/" + imageExt(fullUrl) + ";base64," + decryptedBase64;
    COVER_CACHE[fullUrl] = dataUrl;
    return dataUrl;
  } catch (error) {
    return fullUrl;
  }
}

async function ensureDecryptor(baseUrl) {
  if (DECRYPT_READY) return true;
  if (getDecryptFunction()) {
    DECRYPT_READY = true;
    return true;
  }

  var scriptUrl = normalizeBaseUrl(baseUrl) + "/usr/plugins/tbxw/js/zzz.js";
  var script = await requestHtml(scriptUrl);
  var root = getRoot();
  (function (code, target) {
    var module = undefined;
    var exports = undefined;
    var define = undefined;
    eval(code);
    if (typeof decryptImage === "function") {
      target.__baguaDecryptImage = decryptImage;
    }
  }).call(root, script, root);

  DECRYPT_READY = !!getDecryptFunction();
  return DECRYPT_READY;
}

function getDecryptFunction() {
  var root = getRoot();
  if (root.__baguaDecryptImage) return root.__baguaDecryptImage;
  if (typeof decryptImage === "function") return decryptImage;
  return null;
}

function decryptImageBase64(base64) {
  var fn = getDecryptFunction();
  if (!fn || !base64) return "";
  try {
    return fn(base64);
  } catch (error) {
    return "";
  }
}

function isEncryptedImage(url) {
  return /\/xiao\//i.test(url) || /\/upload_01\//i.test(url) || /\/uploads\//i.test(url) || /\/upload\/upload\//i.test(url);
}

function imageExt(url) {
  var ext = firstMatch(url, /\.([a-zA-Z0-9]+)(?:[?#]|$)/);
  ext = String(ext || "jpeg").toLowerCase();
  if (ext === "jpg") return "jpeg";
  if (ext === "png" || ext === "gif" || ext === "webp") return ext;
  return "jpeg";
}

function toBase64(data) {
  if (!data) return "";
  if (typeof data === "string") {
    if (data.indexOf("data:") === 0) return data.split(",").pop();
    if (/^[A-Za-z0-9+/=\r\n]+$/.test(data) && data.length % 4 === 0) {
      return data.replace(/\s+/g, "");
    }
    return binaryStringToBase64(data);
  }
  if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(data)) {
    return data.toString("base64");
  }
  if (data && data.type === "Buffer" && data.data) {
    return bytesToBase64(data.data);
  }
  if (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer) {
    return bytesToBase64(new Uint8Array(data));
  }
  if (data && data.buffer && data.byteLength !== undefined) {
    return bytesToBase64(new Uint8Array(data.buffer, data.byteOffset || 0, data.byteLength));
  }
  if (Object.prototype.toString.call(data) === "[object Array]") {
    return bytesToBase64(data);
  }
  return binaryStringToBase64(String(data));
}

function binaryStringToBase64(text) {
  var bytes = [];
  for (var i = 0; i < text.length; i++) {
    bytes.push(text.charCodeAt(i) & 255);
  }
  return bytesToBase64(bytes);
}

function bytesToBase64(bytes) {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var output = "";
  var i;
  for (i = 0; i < bytes.length; i += 3) {
    var b1 = bytes[i] & 255;
    var b2 = i + 1 < bytes.length ? bytes[i + 1] & 255 : 0;
    var b3 = i + 2 < bytes.length ? bytes[i + 2] & 255 : 0;
    var triplet = (b1 << 16) | (b2 << 8) | b3;
    output += chars[(triplet >> 18) & 63];
    output += chars[(triplet >> 12) & 63];
    output += i + 1 < bytes.length ? chars[(triplet >> 6) & 63] : "=";
    output += i + 2 < bytes.length ? chars[triplet & 63] : "=";
  }
  return output;
}

function getRoot() {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof self !== "undefined") return self;
  if (typeof window !== "undefined") return window;
  return this;
}

function extractVideoUrl(html) {
  var configText = firstMatch(html, /<div\b[^>]*class=["'][^"']*dplayer[^"']*["'][^>]*data-config=(["'])([\s\S]*?)\1/i, 2);
  if (configText) {
    var decoded = decodeHtml(configText);
    try {
      var config = JSON.parse(decoded);
      if (config && config.video && config.video.url) return config.video.url;
    } catch (error) {
      var fromConfig = firstMatch(decoded, /"url"\s*:\s*"([^"]+)"/i);
      if (fromConfig) return fromConfig.replace(/\\\//g, "/");
    }
  }

  return (
    firstMatch(html, /["'](https?:\\?\/\\?\/[^"']+?\.m3u8[^"']*)["']/i) ||
    firstMatch(html, /["'](https?:\\?\/\\?\/[^"']+?\.mp4[^"']*)["']/i) ||
    ""
  ).replace(/\\\//g, "/");
}

function extractArticleImages(html, baseUrl) {
  var body = firstMatch(html, /<div\b[^>]*class=["'][^"']*post-content[^"']*["'][^>]*>([\s\S]*?)<div class=["']tags["']/i) || html;
  var images = [];
  var attrRe = /\b(?:data-xkrkllgl|data-src|src)=["']([^"']+)["']/gi;
  var match;

  while ((match = attrRe.exec(body))) {
    var url = decodeHtml(match[1]);
    if (!url || /\/usr\/themes\/Mirages\/images\/banner\.png/i.test(url) || /\/usr\/plugins\/tbxw\/zw\.png/i.test(url)) continue;
    if (/\/uploads\/default\/other\//i.test(url)) continue;
    images.push(absoluteUrl(url, baseUrl));
  }

  return images;
}

function extractTags(html) {
  var tagsBlock = firstMatch(html, /<div\b[^>]*itemprop=["']keywords["'][^>]*>([\s\S]*?)<\/div>/i) || "";
  var tags = [];
  var tagRe = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
  var match;

  while ((match = tagRe.exec(tagsBlock))) {
    var tag = cleanText(match[1]);
    if (tag) tags.push(tag);
  }

  return unique(tags);
}

function metaContent(html, attr, value) {
  var escaped = escapeRegExp(value);
  return decodeHtml(
    firstMatch(html, new RegExp("<meta\\b[^>]*" + attr + "=[\"']" + escaped + "[\"'][^>]*content=[\"']([^\"']*)[\"']", "i")) ||
    firstMatch(html, new RegExp("<meta\\b[^>]*content=[\"']([^\"']*)[\"'][^>]*" + attr + "=[\"']" + escaped + "[\"']", "i")) ||
    ""
  );
}

function firstMatch(text, re, groupIndex) {
  var match = String(text || "").match(re);
  return match ? decodeHtml(match[groupIndex || 1] || "") : "";
}

function cleanText(text) {
  return decodeHtml(String(text || ""))
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(text) {
  return String(text || "")
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function normalizeBaseUrl(url) {
  var value = String(url || DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  var match = value.match(/^https?:\/\/[^/]+/i);
  return match ? match[0] : DEFAULT_BASE_URL;
}

function normalizeProxyUrl(url) {
  var value = String(url || "").trim().replace(/\/+$/, "");
  if (!value) return "";
  if (!/^https?:\/\//i.test(value)) return "";
  return value;
}

function normalizePreviewCount(value) {
  var count = Number(value);
  if (!isFinite(count)) count = 30;
  if (count < 0) return 0;
  if (count > 30) return 30;
  return Math.floor(count);
}

function normalizeCoverMode(value) {
  var mode = String(value || "video").trim().toLowerCase();
  if (mode === "image" || mode === "both" || mode === "video") return mode;
  return "video";
}

function absoluteUrl(url, baseUrl) {
  var value = decodeHtml(String(url || "").trim());
  if (!value) return "";
  if (/^\/\//.test(value)) return "https:" + value;
  if (/^https?:\/\//i.test(value)) return value;
  if (value[0] === "/") return normalizeBaseUrl(baseUrl) + value;
  return normalizeBaseUrl(baseUrl) + "/" + value;
}

function normalizeDate(text) {
  var value = cleanText(text);
  if (!value) return "";
  var iso = value.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[1] + "-" + iso[2] + "-" + iso[3];
  var zh = value.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (zh) return zh[1] + "-" + pad2(zh[2]) + "-" + pad2(zh[3]);
  return value;
}

function pad2(value) {
  var text = String(value);
  return text.length < 2 ? "0" + text : text;
}

function idFromUrl(url) {
  return firstMatch(url, /\/archives\/([^/?#]+)\/?/i) || String(url);
}

function encodeLink(data) {
  return "mrds:" + JSON.stringify(data);
}

function decodeLink(link) {
  var value = String(link || "");
  if (value.indexOf("mrds:") === 0) {
    try {
      return JSON.parse(value.slice(5));
    } catch (error) {
      return { url: value.slice(5) };
    }
  }
  return { url: value };
}

function unique(list) {
  var seen = {};
  return (list || []).filter(function (item) {
    var key = String(item || "");
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
