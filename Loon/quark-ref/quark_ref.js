/**
 * 夸克播放修复 - 为播放链接添加必要的Headers
 */

const args = $argument || {};
const cookie = args.quark_cookie || "";

if (!cookie) {
  $done({});
  return;
}

// 添加必要的Headers
$done({
  headers: {
    "Cookie": cookie,
    "sec-fetch-dest": "video",
    "sec-fetch-mode": "no-cors",
    "sec-fetch-site": "same-origin"
  }
});
