// loon-plugin-quark-webdav-final.js
/*
Loon Plugin: Quark WebDAV for FileBall
功能：
1. WebDAV 挂载夸克网盘（FileBall 支持）
2. 地址固定为 quark.example.com
3. 使用夸克 token 登录
4. 支持多级目录浏览和分页
5. 支持大文件下载（Range）
*/

const BASE_URL = "http://quark.example.com"; // 固定 WebDAV 地址
const USERNAME = "user"; // WebDAV 用户名固定

let url = $request.url;
let method = $request.method;
let body = $request.body;

// 读取 Quark token
let token = $persistentStore.read("quark-ck");
if (!token) return $done({status: 401, body: "No Quark token found"});

let webdavPath = decodeURIComponent(url.replace(/^https?:\/\/[^\/]+/, "")) || "/";

// 处理 WebDAV 方法
switch(method) {
    case "PROPFIND":
        handlePropfind(webdavPath).catch(err => $done({status:500, body:err.message}));
        break;
    case "GET":
        handleGet(webdavPath).catch(err => $done({status:500, body:err.message}));
        break;
    default:
        $done({status: 405, body: "Method Not Allowed"});
}

// ===== 功能函数 =====
async function handlePropfind(path) {
    // 根目录为 0，子目录取路径最后一段
    let folderId = path === "/" ? "0" : path.split("/").filter(Boolean).pop();

    let files = [];
    let page = 1;
    let pageSize = 100;
    let totalPages = 1;

    do {
        let apiUrl = `https://drive.quark.cn/1/clouddrive/file/sort?_fetch_total=1&_page=${page}&_size=${pageSize}&fr=pc&pdir_fid=${folderId}&pr=ucpro`;
        let res = await http({url: apiUrl, headers: {"cookie": token}});
        if(!res?.data?.list) break;

        files.push(...res.data.list.map(f => ({
            name: f.file_name,
            isDir: !f.file,
            size: f.size || 0
        })));

        if(page === 1 && res?.metadata?._total) {
            totalPages = Math.ceil(res.metadata._total / pageSize);
        }
        page++;
    } while(page <= totalPages);

    let xmlItems = files.map(f => `
<response>
  <href>${encodeURIComponent(f.name)}</href>
  <propstat>
    <prop>
      <resourcetype>${f.isDir ? "<collection/>" : ""}</resourcetype>
      <getcontentlength>${f.size}</getcontentlength>
    </prop>
    <status>HTTP/1.1 200 OK</status>
  </propstat>
</response>`).join("");

    let xml = `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:">
${xmlItems}
</multistatus>`;

    $done({status: 207, headers: {"Content-Type":"application/xml"}, body: xml});
}

async function handleGet(path) {
    let fid = path.split("/").filter(Boolean).pop();
    if(!fid) return $done({status:404, body:"File not found"});

    let apiUrl = "https://drive.quark.cn/1/clouddrive/file/download?fr=pc&pr=ucpro";
    let res = await http({
        url: apiUrl,
        method: "POST",
        headers: {"cookie": token, "Content-Type":"application/json"},
        body: JSON.stringify({fids:[fid]})
    });

    let downloadUrl = res.data?.[0]?.download_url?.replace(/^https/, "http");
    if(!downloadUrl) return $done({status:404, body:"File not found"});

    let headers = {};
    if($request.headers?.Range) headers.Range = $request.headers.Range;

    $done({status: 302, headers:{Location:downloadUrl, ...headers}});
}

// ===== HTTP 请求封装 =====
function http(options) {
    return new Promise((resolve, reject) => {
        let method = options.method || "GET";
        $httpClient[method.toLowerCase()](options, (err, resp, data) => {
            if(err) return reject(err);
            try { resolve(JSON.parse(data)); } 
            catch(e) { resolve(data); }
        });
    });
}
