// ==Quark WebDAV for Loon==
// 作者: GPT-5 for Yohn
// 用途: 让 Fileball 等 WebDAV 客户端通过 Loon 访问夸克网盘
// 使用: Fileball 地址填 http://quark.example.com:1789/ 密码填夸克 Cookie

const QUARK_COOKIE_KEY = "quark_cookie";
const QUARK_API = "https://drive.quark.cn/1/clouddrive";

;(async () => {
  const method = $request.method;
  const url = decodeURIComponent($request.url);
  const cookie = $persistentStore.read(QUARK_COOKIE_KEY) || getAuthToken($request.headers);

  if (!cookie) {
    return respond(401, "Missing Quark Cookie", "text/plain");
  }

  // 存储 cookie 供后续复用
  $persistentStore.write(cookie, QUARK_COOKIE_KEY);

  try {
    // WebDAV 基础请求分发
    if (method === "OPTIONS") {
      return respond(200, "", "text/plain", {
        "DAV": "1,2",
        "Allow": "OPTIONS, PROPFIND, GET, DELETE"
      });
    }

    // 列目录（PROPFIND）
    if (method === "PROPFIND") {
      const depth = $request.headers["depth"] || "1";
      const path = getDavPath(url);
      const fid = await pathToFid(path, cookie);
      const list = await getFileList(fid, cookie);
      const xml = toWebDAVXML(path, list, depth);
      return respond(207, xml, "application/xml");
    }

    // 下载文件（GET）
    if (method === "GET") {
      const path = getDavPath(url);
      const fid = await pathToFid(path, cookie);
      const link = await getDownloadUrl(fid, cookie);
      if (!link) return respond(404, "File Not Found", "text/plain");
      return $done({ response: { status: 302, headers: { Location: link } } });
    }

    // 删除文件（DELETE）
    if (method === "DELETE") {
      const path = getDavPath(url);
      const fid = await pathToFid(path, cookie);
      if (!fid) return respond(404, "File Not Found", "text/plain");
      await deleteFiles([fid], cookie);
      return respond(204, "");
    }

    // 未支持
    respond(405, "Method Not Allowed", "text/plain");
  } catch (err) {
    console.log(`[QuarkDAV] Error: ${err}`);
    respond(500, String(err), "text/plain");
  }
})();


// ========== 工具与核心函数 ==========

// 提取认证 Cookie
function getAuthToken(headers) {
  const auth = headers["authorization"];
  if (!auth) return null;
  if (auth.startsWith("Basic ")) {
    const base64 = auth.slice(6);
    try {
      const decoded = atob(base64);
      const token = decoded.split(":")[1];
      return token;
    } catch { return null; }
  }
  return null;
}

// 转 WebDAV 路径
function getDavPath(url) {
  const idx = url.indexOf("/", 10); // 跳过 http://
  return idx > 0 ? url.slice(idx) || "/" : "/";
}

// 获取文件列表
async function getFileList(folderId, cookie) {
  const res = await http({
    url: `${QUARK_API}/file/sort?_fetch_total=1&_page=1&_size=200&fr=pc&pdir_fid=${folderId}`,
    headers: { cookie }
  }, "get");
  if (!res) return [];
  const list = res.data?.list || [];
  return list.map(f => ({
    name: f.file_name,
    is_dir: !f.file,
    size: f.size || 0,
    fid: f.fid,
    modified: new Date(f.updated_at || f.created_at).toISOString()
  }));
}

// 路径转 fid
async function pathToFid(path, cookie) {
  if (path === "/" || !path) return "0";
  const cache = JSON.parse($persistentStore.read("quark_fid_cache") || "{}");
  if (cache[path]) return cache[path];
  const parts = path.split("/").filter(Boolean);
  let fid = "0";
  let cur = "";
  for (const p of parts) {
    cur += "/" + p;
    const list = await getFileList(fid, cookie);
    const match = list.find(x => x.name === p);
    if (!match) return null;
    fid = match.fid;
    cache[cur] = fid;
  }
  $persistentStore.write(JSON.stringify(cache), "quark_fid_cache");
  return fid;
}

// 下载链接
async function getDownloadUrl(fid, cookie) {
  const res = await http({
    url: `${QUARK_API}/file/download?fr=pc&pr=ucpro`,
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ fids: [fid] })
  }, "post");
  return res?.data?.[0]?.download_url || null;
}

// 删除文件
async function deleteFiles(fids, cookie) {
  return http({
    url: `${QUARK_API}/file/delete?fr=pc&pr=ucpro`,
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ action_type: 1, exclude_fids: [], filelist: fids })
  }, "post");
}

// HTTP 封装
function http(opts, method = "get") {
  return new Promise(res => {
    $httpClient[method](opts, (err, resp, data) => {
      if (err || resp.status !== 200) return res(null);
      try { res(JSON.parse(data)); } catch { res(null); }
    });
  });
}

// WebDAV XML 输出
function toWebDAVXML(basePath, list, depth) {
  const host = `http://quark.example.com:1789`;
  const items = list.map(f => `
  <d:response>
    <d:href>${host}${basePath === "/" ? "" : basePath}/${encodeURIComponent(f.name)}</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype>${f.is_dir ? "<d:collection/>" : ""}</d:resourcetype>
        <d:getcontentlength>${f.size}</d:getcontentlength>
        <d:getlastmodified>${f.modified}</d:getlastmodified>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>`).join("");
  return `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">${items}</d:multistatus>`;
}

// 响应封装
function respond(status, body, type = "text/plain", extraHeaders = {}) {
  $done({
    response: {
      status,
      headers: Object.assign({ "Content-Type": type }, extraHeaders),
      body
    }
  });
}
