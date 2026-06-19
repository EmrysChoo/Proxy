/**
 * 夸克网盘 Alist - 初始化
 * 从插件参数获取cookie并保存
 */

// 从Loon插件参数获取cookie
const pluginArgs = $loon?.arguments || {};
const cookie = pluginArgs.quark_cookie || "";

if (cookie) {
  $persistentStore.write(cookie, "quark-ck");
  $done({
    response: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: 200,
        message: "Cookie saved successfully"
      })
    }
  });
} else {
  $done({
    response: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: 400,
        message: "请在插件设置中填入夸克Cookie"
      })
    }
  });
}
