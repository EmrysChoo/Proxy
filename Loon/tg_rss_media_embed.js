let body = $response.body;

// 只处理 XML / HTML
if (!body || body.length < 50) {
  $done({});
}

// ===== TG 图片 =====
body = body.replace(
  /(https:\/\/tg\.i-c-a\.su\/media\/[^\s<"]+\.(jpg|jpeg|png|webp|gif))/gi,
  '<img src="$1" style="max-width:100%;border-radius:6px;" referrerpolicy="no-referrer">'
);

// ===== TG 视频 =====
body = body.replace(
  /(https:\/\/tg\.i-c-a\.su\/media\/[^\s<"]+\.(mp4|webm))/gi,
  `<video controls playsinline style="max-width:100%;border-radius:8px;">
     <source src="$1">
   </video>`
);

$done({ body });
