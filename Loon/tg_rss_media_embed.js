/*
 * TG RSS 媒体修复 - feeeed 特供版
 * 适配：Loon / Surge / Shadowrocket
 * 功能：重建 CDATA，支持 feeeed 直接播放视频和看图
 */

let body = $response.body;
const url = $request.url;

// 1. 基础校验
if (!body || !url.includes("tg.i-c-a.su/rss")) {
    $done({});
}

try {
    // 2. 提取并循环处理所有 <item> 块
    // 使用正则提取，确保不破坏 <channel> 级别的 hostname 和 link
    body = body.replace(/<item>([\s\S]*?)<\/item>/g, (itemBlock) => {
        
        // 提取附件链接 (enclosure)
        const encMatch = itemBlock.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="([^"]+)"/i);
        if (!encMatch) return itemBlock;

        const mediaUrl = encMatch[1];
        const mediaType = encMatch[2];
        let mediaTag = "";

        // 为 feeeed 优化：使用标准 HTML5 标签并强制宽度
        if (mediaType.includes("video")) {
            mediaTag = `<video controls playsinline preload="metadata" style="width:100%; border-radius:10px; margin-bottom:10px;"><source src="${mediaUrl}" type="${mediaType}"></video>`;
        } else if (mediaType.includes("image")) {
            mediaTag = `<img src="${mediaUrl}" style="width:100%; border-radius:10px; margin-bottom:10px;" referrerpolicy="no-referrer">`;
        }

        // 提取原始描述并去除转义污染
        let descMatch = itemBlock.match(/<description>([\s\S]*?)<\/description>/i);
        let rawContent = descMatch ? descMatch[1] : "";
        
        // 清洗：还原转义字符并移除旧标签，防止内容重复
        let cleanText = rawContent
            .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') // 剥离旧 CDATA
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>')  // 还原转义
            .replace(/<(?:.|\n)*?>/gm, '')                // 移除所有旧 HTML
            .trim();

        // 3. 重组：这是 feeeed 能正确识别的关键
        // 使用标准的 CDATA 包裹，确保媒体标签排在文字前面
        const newDescription = `<description><![CDATA[
            <div class="tg-media-wrapper">
                ${mediaTag}
            </div>
            <div class="tg-content" style="white-space: pre-wrap;">
                ${cleanText}
            </div>
        ]]></description>`;

        // 只替换当前 item 内的 description
        return itemBlock.replace(/<description>[\s\S]*?<\/description>/i, newDescription);
    });

    $done({ body });
} catch (e) {
    console.log("TG_RSS_Fix_Error: " + e);
    $done({});
}
