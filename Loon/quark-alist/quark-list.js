/**
 * 夸克网盘 Alist 协议 - 文件列表
 * POST /api/fs/list
 */

const args = $argument || {};
const cookie = args.quark_cookie || "";

if (!cookie) {
  $done({
    response: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: 401, message: "请在插件设置中填入夸克Cookie" })
    }
  });
  return;
}

const headers = {
  "cookie": cookie,
  "content-type": "application/json"
};

const body = JSON.parse($request.body);
const path = body.path || "/";
const page = body.page || 1;
const per_page = body.per_page || 100;

// 解析路径获取 pdir_fid
const pathParts = path.split("/").filter(p => p);
const pdir_fid = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "0";

// 夸克 API 获取文件列表
const listUrl = `https://drive.quark.cn/1/clouddrive/file/sort?_fetch_total=1&_page=${page}&_size=${per_page}&fr=pc&pdir_fid=${pdir_fid}&pr=ucpro`;

$httpClient.get({
  url: listUrl,
  headers: headers
}, (err, resp, data) => {
  if (err || resp.status !== 200) {
    $done({
      response: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: 500, message: "获取文件列表失败" })
      }
    });
    return;
  }

  const result = JSON.parse(data);
  const files = result.data.list.map(f => ({
    name: f.file_name,
    size: f.size || 0,
    is_dir: !f.file,
    modified: f.updated_at || new Date().toISOString(),
    created: f.created_at || new Date().toISOString(),
    hash_info: null,
    thumb: f.thumb_url || "",
    type: !f.file ? 0 : getFileType(f.file_name),
    sign: "",
    raw_url: ""
  }));

  const total = parseInt(result.metadata._total);

  $done({
    response: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: 200,
        message: "success",
        data: {
          content: files,
          total: total,
          readme: "",
          header: "",
          write: true,
          provider: "Quark"
        }
      })
    }
  });
});

function getFileType(name) {
  const ext = name.split(".").pop().toLowerCase();
  const videoExts = ["mp4", "mkv", "avi", "mov", "wmv", "flv", "m4v", "ts", "rmvb", "rm"];
  const audioExts = ["mp3", "flac", "wav", "aac", "ogg", "m4a", "wma"];
  const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
  
  if (videoExts.includes(ext)) return 2;
  if (audioExts.includes(ext)) return 3;
  if (imageExts.includes(ext)) return 4;
  return 0;
}
