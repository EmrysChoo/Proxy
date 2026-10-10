/* TMDB CF 反代开关 + include_adult 解锁
 * 开关 cfproxy：
 *   true  → 请求改写到 Cloudflare Worker 中转（免代理直连）
 *   false → 直连 TMDB，仅补 include_adult=true
 * 由插件 [Argument] 的 switch 控件传入（argument=[{cfproxy}]）
 */
const WORKER = "tmdb-proxy.me-zhuxy.workers.dev";

// 读取插件开关，默认开启
let on = true;
try {
  if ($argument && typeof $argument.cfproxy !== "undefined") {
    const v = $argument.cfproxy;
    on = v === true || v === "true" || v === 1 || v === "1";
  }
} catch (e) {}

const u = new URL($request.url);
const isImage = u.hostname === "image.tmdb.org";

if (on) {
  // 反代模式：改为请求 Cloudflare Worker
  u.protocol = "https:";
  u.hostname = WORKER;
  u.port = "";
} else if (!isImage) {
  // 直连模式：仅强制成人内容
  u.searchParams.set("include_adult", "true");
}

$done({ url: u.toString() });
