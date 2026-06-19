/**
 * 夸克网盘 Alist 协议 - 存储信息
 * GET /api/fs/storage
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

$done({
  response: {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: 200,
      message: "success",
      data: {
        total: 0,
        used: 0,
        content: true
      }
    })
  }
});
