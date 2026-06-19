/**
 * 夸克网盘 Alist - 文件列表
 * 简化版本，直接处理请求
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

// 直接返回测试数据
$done({
  response: {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: 200,
      message: "success",
      data: {
        content: [
          { name: "测试文件夹", size: 0, is_dir: true, type: 0 },
          { name: "测试视频.mp4", size: 1024000, is_dir: false, type: 2 }
        ],
        total: 2,
        provider: "Quark"
      }
    })
  }
});
