/**
 * 夸克网盘 Alist 协议 - 认证
 * POST /api/auth/login
 */

const args = $argument || {};
const cookie = args.quark_cookie || "";

if (!cookie) {
  $done({
    response: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: 401,
        message: "请在插件设置中填入夸克Cookie"
      })
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
        token: "authenticated"
      }
    })
  }
});
