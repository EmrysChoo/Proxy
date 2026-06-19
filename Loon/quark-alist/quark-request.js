/**
 * 夸克网盘 Alist - 请求处理
 * 添加cookie到请求头
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

// 修改请求，添加cookie
$done({
  headers: {
    "cookie": cookie,
    "content-type": "application/json"
  }
});
