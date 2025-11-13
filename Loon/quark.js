/*
loon-plugin-quark-webdav.js
Loon Plugin — Quark WebDAV for FileBall (Password = Quark Token)
说明：
- 地址固定为 quark.example.com（或用本地地址）
- 登录密码即为夸克 token（不再依赖 $persistentStore）
- 支持 PROPFIND / GET / HEAD / OPTIONS
- 可直接在 FileBall 挂载 WebDAV
*/

(async () => {
  try {
    const method = $request.method;
    const rawUrl = $request.url || "";
    const path = decodeURIComponent(rawUrl.replace(/^https?:\/\/[^\/]+/, "")) || "/";

    // 从 Authorization 中提取 password（即 token）
    const auth = $request.headers?.Authorization || $request.headers?.authorization;
    let token = null;
    if (auth && auth.startsWith("Basic ")) {
      const decoded = atob(auth.split(" ")[1]);
      token = decoded.split(":")[1]; // user:token
    }
    if (!token) return $done({ status: 401, body: "Missing Quark token (use password as token)" });

    if (method === "OPTIONS") {
      $done({ status: 200, headers: { "DAV": "1,2", "Content-Type": "text/plain" }, body: "" });
      return;
    }

    if (method === "HEAD") {
      $done({ status: 200, headers: {}, body: "" });
      return;
    }

    if (method === "PROPFIND") {
      const xml = await handlePropfind(path, token);
      $done({ status: 207, headers: { "Content-Type": "application/xml; charset=utf-8" }, body: xml });
      return;
    }

    if (method === "GET") {
      const location = await handleGet(path, token);
      if (!location) return $done({ status: 404, body: "File not found" });
      $done({ status: 302, headers: { Location: location }, body: "" });
      return;
    }

    $done({ status: 405, body: "Method Not Allowed" });
  } catch (e) {
    $done({ status: 500, body: "Plugin error: " + e.message });
  }
})();

// ===== 辅助函数 =====

function httpRequest(options) {
  return new Promise((resolve, reject) => {
    const method = (options.method || "GET").toLowerCase();
    const cfg = { url: options.url, headers: options.headers || {}, body: options.body };
    $httpClient[method](cfg, (err, resp, data) => {
      if (err) reject(err);
      else resolve({ resp, body: data });
    });
  });
}

async function handlePropfind(path, token) {
  const folderId = (path === "/" || path === "") ? "0" : path.split("/").filter(Boolean).pop();
  let files = [];
  let page = 1, pageSize = 100, totalPages = 1;

  do {
    const apiUrl = `https://drive.quark.cn/1/clouddrive/file/sort?_fetch_total=1&_page=${page}&_size=${pageSize}&fr=pc&pdir_fid=${folderId}&pr=ucpro`;
    const { body } = await httpRequest({ url: apiUrl, method: "GET", headers: { cookie: token } });
    let json; try { json = JSON.parse(body); } catch { break; }
    const list = json?.data?.list || [];
    for (const f of list) {
      files.push({
        fid: f.fid || f.id || "",
        name: f.file_name || f.name || "unknown",
        isDir: !f.file,
        size: f.size || 0
      });
    }
    if (page === 1 && json?.metadata?._total) totalPages = Math.ceil(json.metadata._total / pageSize) || 1;
    page++;
  } while (page <= totalPages);

  const xmlItems = files.map(item => `
  <response>
    <href>/${encodeURIComponent(item.fid)}${item.isDir ? "/" : ""}</href>
    <propstat>
      <prop>
        <displayname>${escapeXml(item.name)}</displayname>
        <resourcetype>${item.isDir ? "<collection/>" : ""}</resourcetype>
        ${item.isDir ? "" : `<getcontentlength>${item.size}</getcontentlength>`}
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>`).join("");

  return `<?xml version="1.0" encoding="utf-8"?><multistatus xmlns="DAV:">${xmlItems}</multistatus>`;
}

async function handleGet(path, token) {
  const segs = path.split("/").filter(Boolean);
  const fid = segs.length ? segs[segs.length - 1] : null;
  if (!fid) return null;

  const { body } = await httpRequest({
    url: "https://drive.quark.cn/1/clouddrive/file/download?fr=pc&pr=ucpro",
    method: "POST",
    headers: { cookie: token, "Content-Type": "application/json" },
    body: JSON.stringify({ fids: [fid] })
  });

  let json; try { json = JSON.parse(body); } catch { return null; }
  const url = json?.data?.[0]?.download_url?.replace(/^https:/i, "http:");
  return url || null;
}

function escapeXml(unsafe) {
  return String(unsafe || "").replace(/[<>&'"]/g, c =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c])
  );
}

function atob(str) {
  return Buffer.from(str, "base64").toString("binary");
}
