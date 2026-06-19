/**
 * 夸克网盘 Alist - 文件列表响应转换
 * 将夸克API响应转换为Alist格式
 */

const args = $argument || {};
const cookie = args.quark_cookie || "";

if (!$response || !$response.body) {
  $done({});
  return;
}

try {
  const result = JSON.parse($response.body);
  
  if (result.status !== 200 || !result.data || !result.data.list) {
    $done({
      response: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: 500, message: "获取文件列表失败" })
      }
    });
    return;
  }

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
} catch (e) {
  $done({
    response: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: 500, message: "解析错误" })
    }
  });
}

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
