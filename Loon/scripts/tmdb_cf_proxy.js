/* TMDB CF 反代开关 —— 保持 302 客户端跳转机制（响应脚本才能触发）
 * cfproxy = true  → 302 跳转 Cloudflare Worker 中转
 * cfproxy = false → 直连 TMDB：API 补 include_adult=true 后 302 回自身
 * 注意：用「返回 302 响应」而非「改 host」，避免响应脚本不触发
 */
const WORKER = "tmdb-proxy.me-zhuxy.workers.dev";

let on = true;
try {
  if ($argument && typeof $argument.cfproxy !== "undefined") {
    const v = $argument.cfproxy;
    on = v === true || v === "true" || v === 1 || v === "1";
  }
} catch (e) {}

const u = new URL($request.url);
const isImage = u.hostname === "image.tmdb.org";

let location = "";
if (on) {
  // 反代：302 到 Worker
  location = "https://" + WORKER + u.pathname + u.search;
} else if (!isImage && u.searchParams.get("include_adult") !== "true") {
  // 直连：补参数后 302 回自身
  u.searchParams.set("include_adult", "true");
  location = u.toString();
}

if (location) {
  $done({ response: { status: 302, headers: { Location: location }, body: "" } });
} else {
  $done({});
}
