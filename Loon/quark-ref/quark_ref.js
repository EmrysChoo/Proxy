/**
 * 夸克播放修复 - 为播放链接添加必要的Headers
 */

const args = $argument || {};
const cookie = args.quark_cookie || "";

if (!cookie) {
  $done({});
  return;
}

// 获取当前请求的完整URL作为Referer
const url = $request.url;

// 添加必要的Headers
$done({
  headers: {
    "Cookie": cookie,
    "Referer": url,
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1",
    "sec-fetch-dest": "video",
    "sec-fetch-mode": "no-cors",
    "sec-fetch-site": "same-origin",
    "accept-encoding": "identity",
    "accept": "*/*",
    "accept-language": "zh-CN,zh-Hans;q=0.9"
  }
});
