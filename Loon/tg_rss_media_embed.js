/*
 TG RSS 修复脚本
 作用：
 - 解析 tg.i-c-a.su RSS enclosure
 - 重建 description 内嵌媒体
 - 修复 HTML 转义污染
*/

let body = $response.body;

if (!body || body.length < 100) {
  $done({});
}

// 只处理 tg rss
if (!$request.url.includes("tg.i-c-a.su/rss")) {
  $done({});
}

// 处理每个 item
body = body.replace(/<item>([\s\S]*?)<\/item>/g, (itemBlock) => {
  try {
    // 找 enclosure
    const enclosure = itemBlock.match(
      /<enclosure[^>]*url="([^"]+)"[^>]*type="([^"]+)"/i
    );

    if (!enclosure) return itemBlock;

    const mediaUrl = enclosure[1];
    const mediaType = enclosure[2];

    let embedHTML = "";

    // 视频
    if (mediaType.includes("video")) {
      embedHTML = `
<video controls playsinline style="max-width:100%;border-radius:8px;">
  <source src="${mediaUrl}">
</video>`;
    }

    // 图片
    if (mediaType.includes("image")) {
      embedHTML = `
<img src="${mediaUrl}" style="max-width:100%;border-radius:6px;" referrerpolicy="no-referrer">`;
    }

    if (!embedHTML) return itemBlock;

    // 提取原 description 文本（去掉 HTML 垃圾）
    let descMatch = itemBlock.match(/<description>([\s\S]*?)<\/description>/i);
    let cleanText = "";

    if (descMatch) {
      // 去掉 HTML 标签
      cleanText = descMatch[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;[^&]+&gt;/g, "")
        .trim();
    }

    const newDesc = `
<description><![CDATA[
${embedHTML}
<br><br>
${cleanText}
]]></description>`;

    // 替换整个 description
    itemBlock = itemBlock.replace(
      /<description>[\s\S]*?<\/description>/i,
      newDesc
    );

    return itemBlock;
  } catch (e) {
    return itemBlock;
  }
});

$done({ body });
