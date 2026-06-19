/**
 * 夸克网盘 Alist 协议 - 认证
 * POST /api/auth/login
 * 
 * 认证已通过插件设置完成，此接口返回成功状态
 */

const cookie = $persistentStore.read("quark-ck");
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
