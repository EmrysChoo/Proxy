/**
 * 夸克网盘 Alist 协议 - 获取文件信息（含下载链接）
 * POST /api/fs/get
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

// 从路径提取文件ID
const pathParts = path.split("/").filter(p => p);
const fid = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "";

if (!fid) {
  $done({
    response: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: 400, message: "无效路径" })
    }
  });
  return;
}

// 获取下载链接
$httpAPI("POST", "https://drive.quark.cn/1/clouddrive/file/download?fr=pc&pr=ucpro", headers, JSON.stringify({fids: [fid]}), (err, resp, data) => {
  if (err || resp.status !== 200) {
    $done({
      response: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: 500, message: "获取下载链接失败" })
      }
    });
    return;
  }

  const result = JSON.parse(data);
  const downloadUrl = result.data[0].download_url;

  // 获取文件信息
  const infoUrl = `https://drive.quark.cn/1/clouddrive/file/sort?_fetch_total=1&_page=1&_size=1&fr=pc&pdir_fid=${fid}&pr=ucpro`;
  
  $httpClient.get({
    url: infoUrl,
    headers: headers
  }, (err2, resp2, data2) => {
    let fileName = path.split("/").pop();
    let fileSize = 0;
    let modified = new Date().toISOString();
    
    if (!err2 && resp2.status === 200) {
      try {
        const info = JSON.parse(data2);
        if (info.data && info.data.list && info.data.list.length > 0) {
          const file = info.data.list[0];
          fileName = file.file_name;
          fileSize = file.size || 0;
          modified = file.updated_at || modified;
        }
      } catch (e) {}
    }

    $done({
      response: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: 200,
          message: "success",
          data: {
            name: fileName,
            size: fileSize,
            is_dir: false,
            modified: modified,
            created: modified,
            hash_info: null,
            thumb: "",
            type: getFileType(fileName),
            raw_url: downloadUrl,
            provider: "Quark",
            related: []
          }
        })
      }
    });
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
