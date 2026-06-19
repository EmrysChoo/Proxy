/**
 * 夸克网盘 Alist 协议 - 目录列表（简化版，只有目录）
 * POST /api/fs/dirs
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

// 解析路径获取 pdir_fid
const pathParts = path.split("/").filter(p => p);
const pdir_fid = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "0";

// 只获取目录
const listUrl = `https://drive.quark.cn/1/clouddrive/file/sort?_fetch_total=1&_page=1&_size=200&fr=pc&pdir_fid=${pdir_fid}&pr=ucpro`;

$httpClient.get({
  url: listUrl,
  headers: headers
}, (err, resp, data) => {
  if (err || resp.status !== 200) {
    $done({
      response: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: 500, message: "获取目录失败" })
      }
    });
    return;
  }

  const result = JSON.parse(data);
  const dirs = result.data.list
    .filter(f => !f.file)
    .map(f => ({
      name: f.file_name,
      modified: f.updated_at || new Date().toISOString()
    }));

  $done({
    response: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: 200,
        message: "success",
        data: dirs
      })
    }
  });
});
